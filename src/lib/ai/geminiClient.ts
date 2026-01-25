/**
 * 🔧 GEMINI CLIENT - Funciones helper para interactuar con Gemini AI
 * Los modelos específicos ahora están en geminiModels.ts
 */

// Exportar modelos desde la configuración centralizada
export {
    geminiModel,
    geminiPro,
    geminiFlash,
    geminiFlashConversational,
    geminiFlashPrecise,
    getModelForUseCase,
    AI_USE_CASES
} from './geminiModels';

/**
 * Wrapper robusto para llamar a Gemini con reintentos automáticos
 * @param prompt El prompt a enviar
 * @param maxRetries Número máximo de reintentos
 * @param model Modelo específico a usar (por defecto geminiFlash)
 */
export async function safeGenerateContent(prompt: string, maxRetries = 3, model?: any) {
    // Importar dinámicamente para evitar circular dependency
    const { geminiFlash, geminiPro, geminiLegacy } = await import('./geminiModels');

    // Default to Flash, but allow override
    let currentModel = model || geminiFlash;
    let usingFallback = false;

    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log(`🤖 [AI] Intentando generar con ${usingFallback ? 'FALLBACK (Pro)' : 'Principal'} (Intento ${i + 1}/${maxRetries})...`);
            const result = await currentModel.generateContent(prompt);
            return result.response;
        } catch (error: any) {
            lastError = error;
            const msg = error.message?.toLowerCase() || '';

            // 🚨 CRITICAL PRODUCTION FIX: Model Not Found (404) Handling
            // Triple Blindaje: Flash -> Pro -> Legacy (1.0)
            if (msg.includes("404") || msg.includes("not found")) {
                if (!usingFallback) {
                    console.warn("⚠️ [AI WARN] Modelo Flash no encontrado. Cambiando a PRO...");
                    currentModel = geminiPro;
                    usingFallback = true;
                    continue;
                } else if (currentModel !== geminiLegacy) {
                    console.warn("⚠️ [AI WARN] Modelo Pro no encontrado. Cambiando a LEGACY (1.0)...");
                    currentModel = geminiLegacy;
                    continue;
                }
            }

            const isRetryable =
                msg.includes("429") ||
                msg.includes("500") ||
                msg.includes("503") ||
                msg.includes("quota") ||
                msg.includes("overloaded") ||
                msg.includes("exhausted") ||
                msg.includes("timeout") ||
                msg.includes("deadline");

            if (isRetryable && i < maxRetries - 1) {
                const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
                console.warn(`⚠️ [AI] Reintentando en ${Math.round(waitTime)}ms...`);
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
