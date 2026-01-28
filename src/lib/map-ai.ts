// 🔒 FEATURE LOCKED: CORE AI INTERPRETATION. NO EDITAR SIN APROBACIÓN EXPRESA DE RUBEN.
// Consulte REGLAS_DE_PROTECCION.md en la raíz para más detalles.
import { safeGenerateContent, safeExtractJSON } from "./ai/geminiClient";

export async function interpretMapQuery(query: string): Promise<string[]> {
    try {
        const prompt = `
            Actúa como el MAESTRO MECÁNICO de CarMatch, un experto con 50 años de experiencia que solo con escuchar el ruido sabe qué le duele al vehículo.
            
            TU MISIÓN: Traducir problemas vagos de los usuarios a categorías técnicas exactas para encontrarlas en el mapa.

            CATEGORÍAS DISPONIBLES EN EL MAPSTORE:
            [TALLER, CONCESIONARIO, CARWASH, DESPONCHADORA, FINANCIAMIENTO, REFACCIONES, PINTURA, MECANICA, ELECTRICO, DIESEL, MAQUINARIA, ESPECIAL, OTRO]

            REGLAS DE ORO:
            1. **Simpatía Técnica**: Si el usuario escribe ruidos (Ej: "chak chak", "clack clack"), identifica si es motor (MECANICA) o suspensión (MECANICA/TALLER).
            2. **Urgencia**: Si el usuario está "tirado", sugiere MECANICA y DESPONCHADORA.
            3. **Especialización**:
               - Si menciona "tractor", "cosechadora", "excavadora" -> MAQUINARIA.
               - Si menciona "troca diesel", "trailer", "pesado" -> DIESEL.
               - Si menciona "RZR", "cuatrimoto", "buggy" -> ESPECIAL.
            4. **Búsqueda Directa**: Si busca un nombre propio (Ej: "Llantera El Primo"), devuelve null.

            USUARIO DICE: "${query}"

            Responde ÚNICAMENTE con un array JSON de strings:
        `;

        // ✅ Usamos FLASH PRECISE (Temp 0.1) para evitar alucinaciones técnicas
        const { geminiFlashPrecise } = await import("./ai/geminiClient");
        const response = await geminiFlashPrecise.generateContent(prompt);
        const responseText = response.response.text();

        const categories = safeExtractJSON<string[]>(responseText);
        return Array.isArray(categories) ? categories : [];
    } catch (error) {
        console.error("AI Map Interpretation Error:", error);
        return [];
    }
}
