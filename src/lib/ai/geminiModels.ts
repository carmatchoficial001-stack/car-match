/**
 * 🎯 CONFIGURACIÓN CENTRALIZADA DE MODELOS GEMINI
 * 
 * Este archivo define qué modelo usar para cada caso de uso en CarMatch.
 * Todos los modelos usan versiones ESTABLES (-002) para evitar cambios inesperados.
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";

if (!apiKey) {
    console.warn("⚠️ Advertencia: Ni GEMINI_API_KEY ni GOOGLE_API_KEY están definidas.");
}

const genAI = new GoogleGenerativeAI(apiKey);

// 🔒 Safety settings compartidos (moderados para no bloquear contenido legítimo)
const SHARED_SAFETY_SETTINGS = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

/**
 * 🎨 MODELO PRO - Para tareas complejas y críticas
 * Casos de uso:
 * - Análisis de imágenes (visión multimodal compleja)
 * - Descubrimiento de marcas/modelos (requiere conocimiento profundo)
 */
export const geminiPro = genAI.getGenerativeModel({
    model: "gemini-1.5-pro-002", // ✅ Fixed Stable Pro
    safetySettings: SHARED_SAFETY_SETTINGS,
    generationConfig: {
        temperature: 0.2, // Baja para precisión técnica
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 3000, // Respuestas detalladas
    }
});

/**
 * ⚡ MODELO FLASH - Para tareas rápidas y eficientes
 * Casos de uso:
 * - Búsquedas inteligentes
 * - Chatbots
 * - Clasificaciones simples
 * - Análisis de texto
 */
export const geminiFlash = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-002", // ✅ Fixed Stable Flash
    safetySettings: SHARED_SAFETY_SETTINGS,
    generationConfig: {
        temperature: 0.3, // Moderada para balance precisión/creatividad
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1000,
    }
});

/**
 * 💬 MODELO FLASH CONVERSACIONAL - Para chatbots
 * Temperatura más alta para respuestas más naturales
 */
export const geminiFlashConversational = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest",
    safetySettings: SHARED_SAFETY_SETTINGS,
    generationConfig: {
        temperature: 0.7, // Alta para conversación natural
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 500,
    }
});

/**
 * 🔍 MODELO FLASH PRECISO - Para clasificaciones y análisis donde la precisión es crítica
 * Temperatura muy baja
 */
export const geminiFlashPrecise = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest",
    safetySettings: SHARED_SAFETY_SETTINGS,
    generationConfig: {
        temperature: 0.1, // Muy baja para máxima precisión
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 500,
    }
});

/**
 * 📋 MAPA DE CASOS DE USO A MODELOS
 * Referencia rápida de qué modelo usar dónde
 */
export const AI_USE_CASES = {
    IMAGE_ANALYSIS: 'PRO', // imageAnalyzer.ts
    VEHICLE_DISCOVERY: 'PRO', // vehicleDiscovery.ts
    SEARCH_INTERPRETER: 'FLASH', // searchInterpreter.ts
    CHATBOT: 'FLASH_CONVERSATIONAL', // chatbot route
    CHAT_ASSISTANT: 'FLASH_PRECISE', // chat-ai.ts
    MAP_INTERPRETER: 'FLASH_PRECISE', // map-ai.ts
    VEHICLE_SCANNER: 'FLASH_PRECISE', // vehicleScanner.ts
    ADMIN_ANALYST: 'FLASH', // admin routes
} as const;

/**
 * 🔧 Helper function para obtener el modelo por caso de uso
 */
export function getModelForUseCase(useCase: keyof typeof AI_USE_CASES): GenerativeModel {
    const modelType = AI_USE_CASES[useCase];

    switch (modelType) {
        case 'PRO':
            return geminiPro;
        case 'FLASH_CONVERSATIONAL':
            return geminiFlashConversational;
        case 'FLASH_PRECISE':
            return geminiFlashPrecise;
        case 'FLASH':
        default:
            return geminiFlash;
    }
}

// ✅ Exportar el modelo por defecto (para compatibilidad con código existente)
export { geminiFlash as geminiModel };
