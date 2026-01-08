
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";

if (!apiKey) {
    console.warn("⚠️ Advertencia: Ni GEMINI_API_KEY ni GOOGLE_API_KEY están definidas.");
}

const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({
    model: "gemini-flash-latest",
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    ],
    generationConfig: {
        temperature: 0.1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
    }
});

/**
 * Wrapper robusto para llamar a Gemini con reintentos automáticos
 */
export async function safeGenerateContent(prompt: string, maxRetries = 3) {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await geminiModel.generateContent(prompt);
            return result.response;
        } catch (error: any) {
            lastError = error;
            const isRetryable = error.message?.includes("429") || error.message?.includes("500") || error.message?.includes("503");

            if (isRetryable && i < maxRetries - 1) {
                const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
                console.warn(`⚠️ IA Ocupada (Intento ${i + 1}/${maxRetries}). Reintentando en ${Math.round(waitTime)}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}

/**
 * Extrae y parsea JSON de una respuesta de IA, incluso si contiene texto explicativo
 */
export function safeExtractJSON<T>(text: string): T | null {
    try {
        // Intentar encontrar el bloque JSON más grande entre llaves o corchetes
        const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (!jsonMatch) return null;

        const cleaned = jsonMatch[0]
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        return JSON.parse(cleaned) as T;
    } catch (e) {
        console.error("❌ Error parseando JSON de IA:", e);
        return null;
    }
}
