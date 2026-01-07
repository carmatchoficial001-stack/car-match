import { geminiModel } from './geminiClient';
import { POPULAR_MODELS } from '../vehicleTaxonomy';

/**
 * Escanea y sugiere modelos para una marca específica usando IA
 */
export async function suggestModelsForBrand(brand: string): Promise<string[]> {
    console.log(`🤖 AI Scanner: Buscando modelos para ${brand}...`);

    // 1. Verificar si tenemos modelos estáticos de respaldo
    const staticModels = POPULAR_MODELS[brand as keyof typeof POPULAR_MODELS] || [];

    try {
        const prompt = `ERES UN EXPERTO EN LA INDUSTRIA AUTOMOTRIZ GLOBAL.
    El usuario necesita la lista completa de modelos para la marca: "${brand}".
    
    INSTRUCCIONES:
    - Incluye modelos icónicos, modelos actuales (2024, 2025) y modelos anunciados (2026, 2027).
    - Incluye versiones eléctricas (EV) e híbridas si existen.
    - Responde ÚNICAMENTE con una lista de nombres de modelos separados por comas.
    - No incluyas la marca en el nombre del modelo (ej: escribe "Civic", no "Honda Civic").
    - Si la marca no existe o es una broma, devuelve "INVALID".

    EJEMPLO PARA "Tesla":
    Model S, Model 3, Model X, Model Y, Cybertruck, Roadster
    `;

        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        if (text === "INVALID") return staticModels;

        // Limpiar y formatear la lista
        const aiModels = text
            .split(',')
            .map(m => m.trim())
            .filter(m => m.length > 0);

        // Combinar con los estáticos y eliminar duplicados
        const combined = Array.from(new Set([...aiModels, ...staticModels])).sort();

        return combined.length > 0 ? combined : staticModels;

    } catch (error) {
        console.error(`❌ Error al sugerir modelos para ${brand}:`, error);
        return staticModels;
    }
}
