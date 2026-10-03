import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface Topic {
  id: string;
  summary: string;
  vector: number[];
  messages: any[]; // Acumulador de mensajes de este tema
  lastUpdatedAt: Date;
}

@Injectable()
export class SemanticService {
  private readonly logger = new Logger(SemanticService.name);
  private genAI: GoogleGenerativeAI;
  
  public activeTopics: Topic[] = [];

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  async getEmbedding(text: string): Promise<number[]> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-embedding-2-preview" });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error: any) {
      this.logger.error('Error al generar embedding', error);
      return [];
    }
  }

  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA.length || !vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async findMatchingTopic(message: string, messageDate: Date): Promise<{ topic: Topic | null, score: number }> {
    const messageVector = await this.getEmbedding(message);
    if (!messageVector.length || this.activeTopics.length === 0) {
      return { topic: null, score: 0 };
    }

    let bestMatch: Topic | null = null;
    let highestScore = 0;
    
    // Convertir a fecha nativa por seguridad
    const currentDate = new Date(messageDate);

    for (const topic of this.activeTopics) {
      // LÓGICA DE TIEMPO: Si el tema se habló hace más de 4 horas, ya es un contexto "viejo".
      // Incluso si hablan de lo mismo, se considera un nuevo feed.
      const topicDate = new Date(topic.lastUpdatedAt);
      const hoursDiff = Math.abs(currentDate.getTime() - topicDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 4) {
        continue; // Ignorar este tema porque expiró por tiempo
      }

      const score = this.cosineSimilarity(messageVector, topic.vector);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = topic;
      }
    }

    // 0.65 es el límite de "cambio de tema".
    if (highestScore > 0.65) {
      return { topic: bestMatch, score: highestScore };
    }

    return { topic: null, score: highestScore };
  }

  async saveNewTopic(messageText: string, messageObj: any): Promise<Topic> {
    const vector = await this.getEmbedding(messageText);
    const newTopic: Topic = {
      id: Math.random().toString(36).substring(7),
      summary: messageText,
      vector,
      messages: [messageObj],
      lastUpdatedAt: new Date()
    };
    this.activeTopics.push(newTopic);
    this.logger.log(`Nuevo cluster de tema creado: "${messageText}"`);
    return newTopic;
  }
}
