import { Module } from '@nestjs/common';
import { AiService } from './ai.service.js';
import { SemanticService } from './semantic.service.js';

@Module({
  providers: [AiService, SemanticService],
  exports: [AiService, SemanticService]
})
export class AiModule { }
