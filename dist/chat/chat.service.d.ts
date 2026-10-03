import { Repository } from 'typeorm';
import { Chat } from './entities/chat.entity.js';
import { CreateChatDto } from './dto/create-chat.dto.js';
export declare class ChatService {
    private chatRepository;
    constructor(chatRepository: Repository<Chat>);
    create(createChatDto: CreateChatDto): Promise<Chat>;
    findAll(): Promise<Chat[]>;
}
