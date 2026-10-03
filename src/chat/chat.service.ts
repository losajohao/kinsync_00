import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './entities/chat.entity.js';
import { CreateChatDto } from './dto/create-chat.dto.js';
import { UpdateChatDto } from './dto/update-chat.dto.js';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>
  ) { }

  async create(createChatDto: CreateChatDto) {
    const newMessage = this.chatRepository.create(createChatDto)
    return await this.chatRepository.save(newMessage);
  }

  async findAll() {
    return await this.chatRepository.find();
  }

}
