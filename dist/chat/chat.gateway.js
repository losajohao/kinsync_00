var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ChatGateway_1;
import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { ChatService } from './chat.service.js';
import { CreateChatDto } from './dto/create-chat.dto.js';
import { AiService } from '../ai/ai.service.js';
let ChatGateway = ChatGateway_1 = class ChatGateway {
    chatService;
    aiService;
    server;
    logger = new Logger(ChatGateway_1.name);
    constructor(chatService, aiService) {
        this.chatService = chatService;
        this.aiService = aiService;
    }
    handleConnection(client) {
        this.logger.log(`Cliente conectado: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Cliente desconectado: ${client.id}`);
    }
    async create(createChatDto) {
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
    findAll() {
        return this.chatService.findAll();
    }
};
__decorate([
    WebSocketServer(),
    __metadata("design:type", Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    SubscribeMessage('createChat'),
    __param(0, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateChatDto]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "create", null);
__decorate([
    SubscribeMessage('findAllChat'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "findAll", null);
ChatGateway = ChatGateway_1 = __decorate([
    WebSocketGateway({ cors: { origin: '*' } }),
    __metadata("design:paramtypes", [ChatService, AiService])
], ChatGateway);
export { ChatGateway };
//# sourceMappingURL=chat.gateway.js.map