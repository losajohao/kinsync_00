import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './entities/chat.entity.js';
import { FeedPost } from './entities/feed.entity.js';
import { CreateChatDto } from './dto/create-chat.dto.js';
import { UpdateChatDto } from './dto/update-chat.dto.js';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(FeedPost)
    private feedRepository: Repository<FeedPost>
  ) { }

  async saveFeedPosts(posts: any[]) {
      for (const post of posts) {
          const newPost = this.feedRepository.create({
              post_type: post.post_type,
              date: post.date || '',
              feed_text: post.feed_text,
              tags: post.tags || []
          });
          await this.feedRepository.save(newPost);
      }
  }

  async getAllFeedPosts() {
      return this.feedRepository.find({ order: { createdAt: 'DESC' } });
  }

  async create(createChatDto: CreateChatDto) {
    const newMessage = this.chatRepository.create(createChatDto)
    return await this.chatRepository.save(newMessage);
  }

  async findAll() {
    return await this.chatRepository.find();
  }

}
