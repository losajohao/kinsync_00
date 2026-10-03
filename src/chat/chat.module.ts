import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'
import { ChatService } from './chat.service.js';
import { ChatGateway } from './chat.gateway.js';
import { Chat } from './entities/chat.entity.js';
import { AiModule } from '../ai/ai.module.js'

@Module({
  imports: [TypeOrmModule.forFeature([Chat]), AiModule],
  providers: [ChatGateway, ChatService],
})
export class ChatModule { }
