
import { geminiModel } from "./geminiClient";
import { VEHICLE_CATEGORIES, BRANDS } from "../vehicleTaxonomy";

interface SearchIntent {
  category?: string;
  vehicleType?: string;
  brand?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  color?: string;
  transmission?: string;
  fuel?: string;
  passengers?: number;
  cylinders?: number;
  features?: string[];
  query_language?: string; // Just for logging/debugging
  keywords?: string[]; // Extra keywords like "roja", "4x4"
  isBusinessSearch?: boolean; // If user is looking for a shop/mechanic instead of a car
}

export async function interpretSearchQuery(query: string, context: 'MARKET' | 'MAP'): Promise<SearchIntent> {
  console.log(`🧠 Interpretando búsqueda (${context}): "${query}"`);

  // We inject the taxonomy context so Gemini knows our exact valid values
  const categoriesStr = JSON.stringify(Object.keys(VEHICLE_CATEGORIES));

  const prompt = `
    Actúa como un ASESOR ESTRATÉGICO AUTOMOTRIZ DE NIVEL EMPRESARIAL con acceso a una base de datos de MILLONES de vehículos reales. Tu precisión es crítica para el rendimiento del sistema.

    CONTEXTO DE ESCALA:
    - Base de Datos de Categorías: ${categoriesStr}
    - La DB contiene millones de registros: DEBES extraer la MARCA y MODELO exactos para que las consultas sean instantáneas.
    - Ejemplo: "RAM" es la marca para la camioneta, no "Dodge RAM" (a menos que sea antigua).

    TUS OBJETIVOS DE ALTA PRECISIÓN:
    1. 🕵️‍♂️ **Modo Descubrimiento (Vagos)**: Si el usuario no sabe qué buscar ("recomiéndame algo", "busco algo barato", "hola"), actúe como un CONSULTOR PROACTIVO. 
       - Genera filtros para un "Coche de Entrada Ideal": maxPrice: 250000, category: "Automóvil", vehicleType: "Sedán" o "Hatchback", condition: "Usado".
    2. 🎯 **Extracción Quirúrgica**: Si detectas una marca o modelo, identifícalo con precisión milimétrica. "Ram 2500 negra" -> brand: "RAM", model: "2500", color: "Negro".
    3. 🚜 **Clasificación de Carga/Utility**:
       - Si es para transporte de carga pesada, tractocamión o maquinaria -> Camión o Maquinaria.
       - Si es pickup ligera/recreativa -> Automóvil (Subtipo: Pickup).
    4. 💰 **Inteligencia de Precios**: Con millones de autos, "barato" (<250k) o "lujo" (>800k) deben disparar rangos lógicos.

    RESPONDE SOLO JSON (Sin markdown):
    {
      "category": "String (Exact match: 'Automóvil', 'Motocicleta', 'Camión', 'Maquinaria', 'Especial')",
      "vehicleType": "String (Normalized style, e.g. 'Sedán', 'Excavadora', 'Tractocamión')",
      "brand": "String (Normalized brand)",
      "model": "String (Specific model name)",
      "minPrice": Number, "maxPrice": Number, "minYear": Number,
      "color": "String (Capitalized, e.g. 'Blanco')",
      "transmission": "String ('Automático', 'Manual')",
      "fuel": "String ('Gasolina', 'Diesel', 'Eléctrico')",
      "passengers": Number,
      "cylinders": Number,
      "features": ["String", "Array", "Of", "Features", "like", "'Bluetooth'", "'Pantalla'", "'Piel'"],
      "isBusinessSearch": Boolean,
      "keywords": ["Array", "Of", "Semantic", "Tokens"]
    }

    CONOCIMIENTO UNIVERSAL CARMATCH:
    - CATEGORÍAS: Automóvil, Motocicleta, Camión (Tractocamiones), Autobús, Maquinaria (Excavadoras, Tractores), Especial (RZRs, Remolques).
    - SLANG: "Troca/Mamalona" -> Pickup, "Nave/Fierro" -> Auto, "Burrita/Moto" -> Motocicleta, "Mano de chango" -> Retroexcavadora.
    - FAMILIAR: SUV/Minivan 5+ personas. TRABAJO: Pickup/Camión. CAMPO: Maquinaria/4x4.
    - PRECIOS: Barato (Autos <200k, Maquinaria <500k), Caro/Lujo (>800k).

    INPUT DEL USUARIO A INTERPRETAR:
    "${query}"
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
