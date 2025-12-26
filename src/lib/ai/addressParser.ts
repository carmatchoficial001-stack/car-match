
import { geminiModel } from "./geminiClient";

interface ParsedAddress {
    street?: string;
    housenumber?: string;
    city?: string;
    state?: string;
    postalcode?: string;
    country?: string;
    full_search_query?: string; // Fallback string if structure fails
}

export async function parseAddressWithAI(rawQuery: string, biasLat?: number, biasLng?: number): Promise<ParsedAddress | null> {
    try {
        const prompt = `
        Actúa como un experto en Geocodificación para México y el Mundo.
        Tu tarea es estructurar una dirección ambigua en componentes precisos para un buscador GPS (como Nominatim).
        
        INPUT: "${rawQuery}"
        REGLAS:
        1. CORRIGE ERRORES DE ORTOGRAFÍA: "montealban" -> "Monte Albán", "juarez" -> "Juárez", "nl" -> "Nuevo León".
        2. FORMATO IDEAL NOMINATIM: "Calle Número, Colonia, Ciudad, Estado, País".
        3. SIEMPRE incluye el número exterior si existe.
        4. Si falta Ciudad/Estado, INFIEÉRELOS usando las coordenadas de bias (biasLat, biasLng) si se proporcionan.
        5. "full_search_query" debe ser la cadena corregida y completa lista para enviar a la API de mapas.
        
        RESPONDE SOLO JSON:
        {
            "street": "Nombre de la calle",
            "housenumber": "Número exterior",
            "city": "Ciudad o Municipio",
            "state": "Estado",
            "postalcode": "CP (opcional)",
            "country": "País (ej. México)",
            "full_search_query": "String optimizado para búsqueda (ej. Calle Número, Ciudad, Estado)"
        }
        `;

        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(jsonString);
    } catch (error) {
        console.error("AI Address Parse Error:", error);
        return null;
    }
}
