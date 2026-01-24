
import { geminiModel } from "./geminiClient";
import { VEHICLE_CATEGORIES, BRANDS, COLORS, TRANSMISSIONS, FUELS, GLOBAL_SYNONYMS } from "../vehicleTaxonomy";

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
  sort?: string; // sorting intent
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

    CONTEXTO DE ESCALA Y TAXONOMÍA ESTRICTA:
    - Base de Datos de Categorías: ${categoriesStr}
    - Colores Válidos (Taxonomía): ${JSON.stringify(COLORS)}
    - Transmisiones: ${JSON.stringify(TRANSMISSIONS)}
    - Combustibles: ${JSON.stringify(FUELS)}
    - 🌍 DICCIONARIO GLOBAL DE SINÓNIMOS (APRENDIZAJE): ${JSON.stringify(GLOBAL_SYNONYMS)}

    TUS OBJETIVOS DE ALTA PRECISIÓN Y TRADUCCIÓN:
    1. 🗣️ **Traductor Semántico Multilingüe**: El usuario puede buscar en CUALQUIERA de los 21 idiomas (Español, Inglés, Chino, Árabe, etc.). TU TRABAJO es mapear su intención a los VALORES EXACTOS de la taxonomía anterior en Español.
       - "Ram negra" (Español) -> color: "Negro"
       - "Black Ram" (Inglés) -> color: "Negro"
       - "Ram noir" (Francés) -> color: "Negro"
       - "Camioneta" / "Troca" / "Pickup" -> vehicleType: "Pickup" (Categoría: Automóvil)
       - "Voiture" -> category: "Automóvil"

    2. 🧠 **MODO CONSULTOR (PREGUNTAS VAGAS)**: Si el usuario busca por USO en lugar de vehículo ("Para Uber", "Para Campo", "Ahorrar Gasolina"), deduce los mejores filtros técnicos:
       - 🚖 "Para Uber/Taxi/Didi": Autos fiables, recientes y de bajo consumo.
         -> category: "Automóvil", vehicleType: "Sedán", minYear: 2018, fuel: "Gasolina" (o Híbrido), doors: 4, features: ["Aire Acondicionado"].
       - ⛽ "Ahorrar Gasolina / Trabajo Diario": Autos pequeños o híbridos.
         -> category: "Automóvil", fuel: "Híbrido" (o Híbrido Enchufable), vehicleType: "Sedán" o "Hatchback".
       - 🚜 "Para el Campo / Rancho": Vehículos de trabajo rudo.
         -> category: "Automóvil", vehicleType: "Pickup", traction: "4x4 (4WD)".
       - 👪 "Para Familia / Viajar": Espacio y seguridad.
         -> category: "Automóvil", vehicleType: "SUV" o "Minivan", passengers: 7 (o 5+).

       - 👪 "Para Familia / Viajar": Espacio y seguridad.
         -> category: "Automóvil", vehicleType: "SUV" o "Minivan", passengers: 7 (o 5+).

    3. 📉 **ORDENAMIENTO INTELIGENTE**: Detecta si el usuario prioriza precio, año o uso.
       - "El más barato", "Económico" -> sort: "price_asc"
       - "El más nuevo", "Reciente" -> sort: "year_desc"
       - "Poco kilometraje", "Casi nuevo" -> sort: "mileage_asc"
       - "De lujo", "Caro" -> sort: "price_desc"

    4. 🆚 **MODO COMPARACIÓN (A vs B)**: Si el usuario menciona DOS vehículos, quiere ver AMBOS.
       - "Corolla o Civic" -> brand: "Toyota,Honda", model: "Corolla,Civic"
       - "Camaro vs Mustang" -> brand: "Chevrolet,Ford", model: "Camaro,Mustang"
       - "Honda o Toyota" -> brand: "Honda,Toyota"

    5. 🎯 **Extracción Quirúrgica**: Si detectas una marca o modelo, identifícalo con precisión milimétrica.
    6. 💰 **Inteligencia de Precios**: "Barato" (<250k), "Lujo" (>800k).

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
      "sort": "String ('price_asc', 'price_desc', 'year_desc', 'mileage_asc')",
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
