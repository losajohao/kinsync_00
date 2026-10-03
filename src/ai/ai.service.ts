import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private genAI: GoogleGenerativeAI;

    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    }

    async summarizeChat(messages: any[]): Promise<string> {
        try {
            this.logger.log('llamando a gemini 3.8 flash...');
            const model = this.genAI.getGenerativeModel({
                model: 'gemini-3.8-flash',
                generationConfig: {
                    temperature: 0.7
                }
            });

            //formatear el chat
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

        } catch (error: any) {
            this.logger.error(`Error con Gemini: ${error.message || error}`, error.stack);
            return `Lo siento, no pude procesar el resumen. Detalles del error: ${error.message || 'Desconocido'}`;
        }
    }
}
