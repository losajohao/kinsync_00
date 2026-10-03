import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service.js';
import { CreateChatDto } from './dto/create-chat.dto.js';
import { AiService } from '../ai/ai.service.js';
import { SemanticService } from '../ai/semantic.service.js';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  
  // Memoria del último tema activo
  private lastActiveTopicId: string | null = null;

  constructor(
    private readonly chatService: ChatService, 
    private readonly aiService: AiService,
    private readonly semanticService: SemanticService
  ) { }

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('createChat')
  async create(@MessageBody() createChatDto: CreateChatDto) {

    // 1. Comando oculto para hidratar la DB del Muro de Noticias al cargar la UI
    if (createChatDto.content.trim() === '/resumen') {
      const feedPosts = await this.chatService.getAllFeedPosts();
      
      if (feedPosts.length > 0) {
          this.logger.log(`💾 [FASE 3] Cargando ${feedPosts.length} posts desde la Base de Datos! No usamos Gemini.`);
          // Como ya están parseados como objetos en la DB, tenemos que pasarlo a string para el frontend
          this.server.emit('received_message', { sender: 'KinSync AI AutoFeed 🤖', content: JSON.stringify(feedPosts) });
      } else {
          this.logger.log(`💾 [FASE 3] La DB del Muro está vacía. Escaneando por primera vez...`);
          const allMessages = await this.chatService.findAll();
          const aiSummary = await this.aiService.summarizeChat(allMessages);
          try {
             await this.chatService.saveFeedPosts(JSON.parse(aiSummary));
             this.logger.log(`💾 [FASE 3] ¡Posts iniciales guardados en la DB!`);
          } catch(e) {}
          this.server.emit('received_message', { sender: 'KinSync AI AutoFeed 🤖', content: aiSummary });
      }
      return;
    }

    // 2. Guardar mensaje en base de datos normal y emitirlo al frontend
    const savedMessage = await this.chatService.create(createChatDto);
    this.server.emit('received_message', savedMessage);

    // --- FASE 2: EL PORTERO SEMÁNTICO (AUTO-FEED) ---
    // 3. Evaluamos matemáticamente a qué tema pertenece este mensaje, respetando la fecha de creación
    const { topic, score } = await this.semanticService.findMatchingTopic(createChatDto.content, savedMessage.createdAt);

    if (topic) {
      this.logger.log(`🎯 Mensaje asignado al tema: [${topic.id}] (Similitud: ${score.toFixed(2)})`);
      topic.messages.push(savedMessage);
      topic.lastUpdatedAt = new Date();
      this.lastActiveTopicId = topic.id;
    } else {
      this.logger.log(`🌟 Cambio de tema detectado por baja similitud. Cerrando contexto anterior...`);
      
      if (this.lastActiveTopicId) {
        const oldTopic = this.semanticService.activeTopics.find(t => t.id === this.lastActiveTopicId);
        
        // Regla de Anti-Spam: Solo resumir si hablaron al menos X mensajes seguidos
        if (oldTopic && oldTopic.messages.length >= 1) {
           this.logger.log(`🚀 Generando Feed automático para el tema: "${oldTopic.summary}"`);
           
           // Disparamos en segundo plano (sin await) para no frenar la velocidad del chat
           this.aiService.summarizeChat(oldTopic.messages).then(async aiSummary => {
               try {
                   // FASE 3: ¡Guardamos en la Base de Datos!
                   const posts = JSON.parse(aiSummary);
                   await this.chatService.saveFeedPosts(posts);
                   this.logger.log(`💾 [FASE 3] ¡Nuevo Auto-Feed guardado permanentemente en la DB!`);
               } catch(e) {
                   this.logger.error('Error guardando en DB:', e);
               }
               this.server.emit('received_message', { sender: 'KinSync AI AutoFeed 🤖', content: aiSummary });
           }).catch(err => this.logger.error('Error generando AutoFeed:', err));
        }
      }

      // 4. Creamos el nuevo tema y lo marcamos como el actual
      const newTopic = await this.semanticService.saveNewTopic(createChatDto.content, savedMessage);
      this.lastActiveTopicId = newTopic.id;
    }

    return savedMessage;
  }

  @SubscribeMessage('findAllChat')
  findAll() {
    return this.chatService.findAll();
  }
}
