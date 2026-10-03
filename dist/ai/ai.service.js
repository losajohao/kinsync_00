var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiService_1;
import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
let AiService = AiService_1 = class AiService {
    logger = new Logger(AiService_1.name);
    genAI;
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    }
    async summarizeChat(messages) {
        try {
            this.logger.log('llamando a gemini 3.8 flash...');
            const model = this.genAI.getGenerativeModel({
                model: 'gemini-3.8-flash',
                generationConfig: {
                    temperature: 0.7
                }
            });
            const chatTranscript = messages.map(msg => `[${msg.sender}]: ${msg.content}`).join('\n');
            const prompt = `Eres el asistente inteligente de KinSync. Tu tarea es leer la siguiente transcripción de un chat familiar y resumir de qué hablaron.
Reglas:
- Responde SIEMPRE en Español.
- Escribe el resumen en una lista corta y fácil de leer (usando puntos o guiones).
- Si detectas tareas pendientes o decisiones, destácalas claramente.
- Si solo fue una charla casual, simplemente resume de forma amigable los temas que trataron.

Transcripción de la conversación:
${chatTranscript}`;
            this.logger.log(`\n========== PROMPT ENVIADO A GEMINI ==========\n${prompt}\n==============================================\n`);
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const textResult = response.text();
            this.logger.log('✅ Llamado completado exitosamente.');
            this.logger.log(`Respuesta de Gemini: ${textResult}`);
            return textResult;
        }
        catch (error) {
            this.logger.error(`Error con Gemini: ${error.message || error}`, error.stack);
            return `Lo siento, no pude procesar el resumen. Detalles del error: ${error.message || 'Desconocido'}`;
        }
    }
};
AiService = AiService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], AiService);
export { AiService };
//# sourceMappingURL=ai.service.js.map