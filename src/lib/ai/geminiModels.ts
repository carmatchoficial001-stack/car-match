// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

/**
 * 🎯 CONFIGURACIÓN CENTRALIZADA DE MODELOS GEMINI (2026 EDITION)
 * 
 * Este archivo define qué modelo usar para cada caso de uso en CarMatch.
 * Actualizado con modelos optimizados para costo y rendimiento.
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";

if (!apiKey) {
    console.warn("⚠️ Advertencia: Ni GEMINI_API_KEY ni GOOGLE_API_KEY están definidas.");
}

const genAI = new GoogleGenerativeAI(apiKey);

// 🔒 Safety settings compartidos
const SHARED_SAFETY_SETTINGS = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

/**
 * ⚡ GEMINI 1.5 FLASH-8B (La "Ultra Barata")
 * Ideal para: Validaciones simples (¿Es carro o no?), Tareas repetitivas, Alto volumen.
 * Costo: ~$0.03 / 1M input
 */
export const geminiFlash8B = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-8b",
    safetySettings: SHARED_SAFETY_SETTINGS,
    generationConfig: {
        temperature: 0.1, // Muy precisa, poca creatividad
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1000,
    }
});

/**
 * 🌟 GEMINI 2.5 FLASH-LITE (La "Calidad-Precio")
 * Ideal para: Extracción de datos, Chatbots simples, Análisis de texto.
 * Costo: ~$0.10 / 1M input
 */
export const geminiFlashLite = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite-preview-02-05", // Usamos la preview estable más reciente de 2.0 Flash Lite (o 2.5 si estuviera disponible)
    safetySettings: SHARED_SAFETY_SETTINGS,
    generationConfig: {
        temperature: 0.3,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2000,
    }
});

/**
 * 🚀 GEMINI 2.0 FLASH (La "Estándar Potente")
 * Reemplazo directo de 1.5 Flash. Más rápida y multimodal.
 * Ideal para: Tareas generales, Visión compleja.
 */
export const geminiFlash = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-001",
    safetySettings: SHARED_SAFETY_SETTINGS,
    generationConfig: {
        temperature: 0.3,
        topP: 0.95,
        maxOutputTokens: 4096, // Aumentado para evitar truncamiento
    }
});

/**
 * 🎨 GEMINI PRO (Legacy/High-End)
 * Mantenemos la 1.5 Pro como respaldo de alta inteligencia si se necesita
 * o actualizamos a 2.0 Pro si tienes acceso. Por seguridad dejamos la estable 1.5 Pro-002.
 */
export const geminiPro = genAI.getGenerativeModel({
    model: "gemini-1.5-pro-002",
    safetySettings: SHARED_SAFETY_SETTINGS,
    generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096, // Aumentado para estrategias largas
    }
});

export const geminiFlashConversational = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-001", // Upgrade a 2.0 Flash para chat
    safetySettings: SHARED_SAFETY_SETTINGS,
    generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096, // Aumentado para evitar truncamiento en el chat
    }
});

export const geminiFlashPrecise = geminiFlash8B; // Usamos la 8B para cosas precisas y baratas


/**
 * 📋 MAPA DE CASOS DE USO A MODELOS
 */
export const AI_USE_CASES = {
    // 📸 ANÁLISIS DE IMAGEN: Usamos Flash (2.0) por defecto por su buena visión, 
    // pero en imageAnalyzer.ts haremos la lógica de fallback manual (8B -> Lite -> Flash).
    IMAGE_ANALYSIS: 'FLASH',
    VEHICLE_DISCOVERY: 'FLASH_LITE',
    SEARCH_INTERPRETER: 'FLASH_8B',
    CHATBOT: 'FLASH_CONVERSATIONAL',
    CHAT_ASSISTANT: 'FLASH_PRECISE',
    MAP_INTERPRETER: 'FLASH_PRECISE',
    VEHICLE_SCANNER: 'FLASH_LITE',
    ADMIN_ANALYST: 'FLASH',
} as const;

export function getModelForUseCase(useCase: keyof typeof AI_USE_CASES): GenerativeModel {
    const modelType = AI_USE_CASES[useCase];
    switch (modelType) {
        case 'FLASH': return geminiFlash;
        case 'FLASH_LITE': return geminiFlashLite;
        case 'FLASH_8B': return geminiFlash8B;
        case 'FLASH_CONVERSATIONAL': return geminiFlashConversational;
        case 'FLASH_PRECISE': return geminiFlashPrecise;
        default: return geminiFlash;
    }
}

// Exportar legacy para compatibilidad
export { geminiFlash as geminiModel, geminiPro as geminiLegacy };
