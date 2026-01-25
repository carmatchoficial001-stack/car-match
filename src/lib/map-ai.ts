import { safeGenerateContent, safeExtractJSON } from "./ai/geminiClient";

export async function interpretMapQuery(query: string): Promise<string[]> {
    try {
        const prompt = `
            Actúa como un traductor de problemas mecánicos a categorías de negocios.
            El usuario buscará algo en un mapa de "CarMatch".
            
            Categorías disponibles:
            [TALLER, CONCESIONARIO, CARWASH, DESPONCHADORA, FINANCIAMIENTO, REFACCIONES, PINTURA, MECANICA, ELECTRICO, OTRO]

            Query del usuario: "${query}"

            Instrucciones:
            1. Analiza el problema o necesidad. (Ej: "ruido al frenar" -> MECANICA, TALLER)
            2. Si es una búsqueda directa de nombre (Ej: "AutoZone"), devuelve null (deja que el buscador normal funcione).
            3. Si es un problema vago (Ej: "chak chak motor"), asigna la mejor categoría técnica.
            4. Devuelve SOLO un array JSON de strings con las categorías sugeridas.

            Respuesta (JSON Array puro):
        `;

        // ✅ Flash Preciso para clasificación de categorías (temp 0.2)
        const { geminiFlashPrecise } = await import("./ai/geminiClient");
        const response = await safeGenerateContent(prompt, 5, geminiFlashPrecise);
        const responseText = response.text();

        const categories = safeExtractJSON<string[]>(responseText);
        return Array.isArray(categories) ? categories : [];
    } catch (error) {
        console.error("AI Map Interpretation Error:", error);
        return [];
    }
}
