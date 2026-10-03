require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function run() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: 'gemini-3.8-flash',
            generationConfig: {
                maxOutputTokens: 300,
                temperature: 0.3
            }
        });

        const chatTranscript = "[Usuario]: Hola\n[Usuario]: Cómo estás?";
        const prompt = `Eres el asistente inteligente de KinSync. Tu tarea es leer la siguiente transcripción de un chat familiar y resumir de qué hablaron.
Reglas:
- Responde SIEMPRE en Español.
- Escribe el resumen en una lista corta y fácil de leer (usando puntos o guiones).
- Si detectas tareas pendientes o decisiones, destácalas claramente.
- Si solo fue una charla casual, simplemente resume de forma amigable los temas que trataron.

Transcripción de la conversación:
${chatTranscript}`;

        console.log("Calling Gemini API...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        console.log("--- FULL RESPONSE OBJECT ---");
        console.log(JSON.stringify(response, null, 2));
        
        console.log("\n--- FINISH REASON ---");
        if (response.candidates && response.candidates.length > 0) {
            console.log(response.candidates[0].finishReason);
        } else {
            console.log("No candidates");
        }
        
    } catch (e) {
        console.error("ERROR:", e);
    }
}

run();
