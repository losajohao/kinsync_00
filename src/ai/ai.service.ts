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
            this.logger.log('Llamando a gemini-3.8-flash en modo JSON...');

            const systemInstruction = `Eres el 'Community Manager' de la familia KinSync. Tu tarea es leer el chat y crear publicaciones (posts) naturales y amigables para el Muro de Noticias de la familia.
Ten muy en cuenta las FECHAS Y HORAS de los mensajes para no mezclar temas antiguos con temas recientes.
REGLA ESTRICTA: Tu respuesta DEBE ser un arreglo JSON de objetos.
Esquema esperado:
{
  "post_type": "ANUNCIO" | "RECORDATORIO" | "MOMENTO_DIVERTIDO",
  "date": "Fecha y hora inferida (ej. '03/10/2026 10:30 AM')",
  "feed_text": "El texto del post redactado de forma natural (ej. '¡Papá al fin arregló la tubería! 🔧')",
  "tags": ["etiqueta1", "etiqueta2"]
}`;

            const model = this.genAI.getGenerativeModel({
                model: 'gemini-3.5-flash',
                systemInstruction: systemInstruction,
                generationConfig: {
                    temperature: 0.2
                    // responseMimeType: 'application/json' // COMENTADO PARA EVITAR EL 503!
                }
            });

            //formatear el chat (Agregando fecha exacta para dar contexto a la IA)
            const chatTranscript = messages.map(msg => {
                const dateStr = msg.createdAt ? new Date(msg.createdAt).toLocaleString('es-PE') : 'Fecha desconocida';
                return `[${dateStr}] [${msg.sender}]: ${msg.content}`;
            }).join('\n');

            const prompt = `Analiza la siguiente transcripción histórica y extrae los eventos/tareas agrupados por temas en formato JSON:\n\n${chatTranscript}`;

            this.logger.log(`\n========== PROMPT ENVIADO A GEMINI ==========\n${prompt}\n==============================================\n`);

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const textResult = response.text();

            // FASE 3 FIX: Limpiamos los bloques de markdown (```json y ```) porque
            // al no usar el JSON estricto (por culpa del 503), Gemini lo envía como texto plano
            const cleanedJson = textResult.replace(/```json/gi, '').replace(/```/g, '').trim();

            this.logger.log('✅ Llamado completado exitosamente.');
            this.logger.log(`Respuesta de Gemini: ${cleanedJson}`);

            return cleanedJson;

        } catch (error: any) {
            this.logger.error(`Error con Gemini: ${error.message || error}`, error.stack);
            return `Lo siento, no pude procesar el resumen. Detalles del error: ${error.message || 'Desconocido'}`;
        }
    }
}
