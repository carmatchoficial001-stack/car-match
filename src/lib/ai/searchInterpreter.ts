
import { geminiModel } from "./geminiClient";
import { VEHICLE_CATEGORIES, BRANDS } from "../vehicleTaxonomy";

interface SearchIntent {
  category?: string;
  subType?: string;
  brand?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  color?: string;
  transmission?: string;
  fuel?: string;
  passengers?: number;
  query_language?: string; // Just for logging/debugging
  keywords?: string[]; // Extra keywords like "roja", "4x4"
  isBusinessSearch?: boolean; // If user is looking for a shop/mechanic instead of a car
}

export async function interpretSearchQuery(query: string, context: 'MARKET' | 'MAP'): Promise<SearchIntent> {
  console.log(`🧠 Interpretando búsqueda (${context}): "${query}"`);

  // We inject the taxonomy context so Gemini knows our exact valid values
  const categoriesStr = JSON.stringify(Object.keys(VEHICLE_CATEGORIES));

  const prompt = `
    Actúa como un VENDEDOR DE AUTOS EXPERTO (BROKER) con 30 AÑOS DE EXPERIENCIA. Conoces todos los modelos, versiones, apodos callejeros ("slang") y precios del mercado.

    CONTEXTO:
    - Base de Datos de Categorías: ${categoriesStr}
    - El usuario está buscando en: ${context} (Market = Vehículos, Map = Negocios/Talleres).

    QUERY DEL USUARIO: "${query}"

    TUS OBJETIVOS:
    1. 🕵️‍♂️ **Interpretar Intención**: ¿Busca comprar un auto o buscar un taller?
       - Si dice "cambio de aceite", "me falla", "taller": isBusinessSearch: true.
    2. 🚗 **Entender Slang y Modelos**:
       - "Troca" / "Mamalona" -> Categoría: "Camioneta" o "Pickup".
       - "Nave" -> Automóvil.
       - "Vocho" -> Volkswagen Sedan.
       - "Cheyenne" -> Marca: Chevrolet (Corrige si dice "Ford Cheyenne").
    3. 💰 **Interpretar "Barato/Lujo"**:
       - "Barato" para un Sedan: maxPrice ~80,000.
       - "Barato" para una SUV: maxPrice ~150,000.
       - "De lujo": BMW, Mercedes, Audi (Marca) o minPrice alto.
    4. 🌍 **Multilenguaje**: Traduce cualquier idioma al Español de nuestra DB.
       - "I need a cheap truck" -> Category: "Automóvil" (Subtipo Pickup), maxPrice: 150000.

    RESPONDE SOLO JSON (Sin markdown):
    {
      "category": "String (Exact match: 'Automóvil', 'Motocicleta', 'Camión', 'Maquinaria', 'Especial')",
      "subType": "String (Normalized style, e.g. 'Sedán', 'Excavadora', 'Tractocamión')",
      "brand": "String (Normalized brand)",
      "model": "String (Specific model name)",
      "minPrice": Number, "maxPrice": Number, "minYear": Number,
      "color": "String (Capitalized, e.g. 'Blanco')",
      "transmission": "String ('Automático', 'Manual')",
      "fuel": "String ('Gasolina', 'Diesel', 'Eléctrico')",
      "passengers": Number,
      "isBusinessSearch": Boolean,
      "keywords": ["Array", "Of", "Semantic", "Tokens"]
    }

    CONOCIMIENTO UNIVERSAL CARMATCH:
    - CATEGORÍAS: Automóvil, Motocicleta, Camión (Tractocamiones), Autobús, Maquinaria (Excavadoras, Tractores), Especial (RZRs, Remolques).
    - SLANG: "Troca/Mamalona" -> Pickup, "Nave/Fierro" -> Auto, "Burrita/Moto" -> Motocicleta, "Mano de chango" -> Retroexcavadora.
    - FAMILIAR: SUV/Minivan 5+ personas. TRABAJO: Pickup/Camión. CAMPO: Maquinaria/4x4.
    - PRECIOS: Barato (Autos <200k, Maquinaria <500k), Caro/Lujo (>800k).
  `;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();

    return JSON.parse(jsonString);
  } catch (error) {
    console.error("❌ Error interpretando búsqueda:", error);
    return {}; // Return empty filter if AI fails (fallback to text search)
  }
}
