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
export async function safeGenerateContent(prompt: string, maxRetries = 5, model?: any) {
    // Importar dinámicamente para evitar circular dependency
    const { geminiFlash } = await import('./geminiModels');
    const modelToUse = model || geminiFlash;

    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await modelToUse.generateContent(prompt);
            return result.response;
        } catch (error: any) {
            lastError = error;
            const msg = error.message?.toLowerCase() || '';
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
