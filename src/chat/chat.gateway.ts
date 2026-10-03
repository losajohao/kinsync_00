import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service.js';
import { CreateChatDto } from './dto/create-chat.dto.js';
import { AiService } from '../ai/ai.service.js';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService, private readonly aiService: AiService) { }

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('createChat')
  async create(@MessageBody() createChatDto: CreateChatDto) {

    //deteccion de comando IA
    if (createChatDto.content.trim() === '/resumen') {
      const allMessages = await this.chatService.findAll();
      this.server.emit('received_message', { sender: 'kinSync AI', content: 'Pensanding...' });
      const aiSummary = await this.aiService.summarizeChat(allMessages);
      this.server.emit('received_message', { sender: 'KinSync AI', content: aiSummary });
      return;
    }

    this.logger.debug(`Recibiendo payload: ${JSON.stringify(createChatDto)}`);
    const savedMessage = await this.chatService.create(createChatDto);
    this.logger.debug(`Mensaje guardado en DB con ID: ${savedMessage.id}`);
    this.server.emit('received_message', savedMessage);
    return savedMessage;
  }

  @SubscribeMessage('findAllChat')
  findAll() {
    return this.chatService.findAll();
  }
}
