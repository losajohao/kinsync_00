import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service.js';
import { CreateChatDto } from './dto/create-chat.dto.js';
import { AiService } from '../ai/ai.service.js';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly chatService;
    private readonly aiService;
    server: Server;
    private readonly logger;
    constructor(chatService: ChatService, aiService: AiService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    create(createChatDto: CreateChatDto): Promise<import("./entities/chat.entity.js").Chat | undefined>;
    findAll(): Promise<import("./entities/chat.entity.js").Chat[]>;
}
