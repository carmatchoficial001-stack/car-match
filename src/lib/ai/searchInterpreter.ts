
import { geminiPro } from "./geminiModels"; // 🚀 UPGRADE: Usamos PRO para "Entendimiento Humano" perfecto
import { VEHICLE_CATEGORIES, BRANDS, COLORS, TRANSMISSIONS, FUELS, GLOBAL_SYNONYMS } from "../vehicleTaxonomy";
import aiCache from "./aiCache"; // 💰 Sistema de caché para reducir costos

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
  aiReasoning?: string; // 🗣️ Mensaje de la IA explicando su lógica al usuario
}

export async function interpretSearchQuery(query: string, context: 'MARKET' | 'MAP'): Promise<SearchIntent> {
  console.log(`🧠 Interpretando búsqueda (${context}): "${query}"`);

  // 🚀 PASO 1: Intentar obtener del caché
  const cachedResult = aiCache.get(query, context);
  if (cachedResult) {
    console.log(`⚡ [CACHE HIT] Respuesta recuperada del caché. $0 gastados.`);
    return cachedResult;
  }

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

    🔤 **NIVEL 0 - TOLERANCIA ORTOGRÁFICA MÁXIMA (PRIORIDAD ABSOLUTA):**
    El usuario puede escribir con CUALQUIER error ortográfico debido a velocidad, autocorrector o nivel educativo. NUNCA penalices esto:
    - Marcas mal escritas: "chevi" → Chevrolet, "volksw" → Volkswagen, "toyot" → Toyota, "nissn" → Nissan
    - Colores con errores: "negr", "nwgra", "negrao" → Negro, "roj", "rrojo" → Rojo, "azull" → Azul
    - Tipos de vehículo: "pico", "pikap", "pickup" → Pickup, "camionta" → Camioneta
    - Términos técnicos: "diessel" → Diesel, "gasolna" → Gasolina, "automatico" → Automático, "4x4" (escrito "4 por 4", "cuatro equis cuatro") → 4x4
    
    Tu trabajo es INTERPRETAR la intención real ignorando completamente la ortografía. Usa similitud fonética y contextual.

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

    3. ⚙️ **MODO TÉCNICO (EXTRACCIÓN DE ATRIBUTOS)**: Extrae con precisión de cirujano valores numéricos de ingeniería:
       - "V6", "6 cil", "6 cilindros" -> cylinders: 6
       - "V8", "8 cilindros" -> cylinders: 8
       - "3 toneladas", "3 ton", "capacidad de 3000kg" -> cargoCapacity: 3.0
       - "Motor 2.0", "2.0 litros", "2000 cc" -> displacement: 2000 (o el valor en litros si la taxonomía lo pide)
       - "450 hp", "450 caballos" -> hp: 450
       - "Cero horas", "0 horas" -> operatingHours: 0 (Maquinaria)

    4. 🕵️‍♂️ **DETECTIVES DE MARCA (CASOS ESPECIALES)**:
       - "Ram" / "Ramona" / "Mamalona" -> brand: "RAM,Dodge" (Busca en ambas marcas para cubrir modelos viejos y nuevos).
       - "Chevy" -> brand: "Chevrolet".
       - "Vw" / "Vocho" -> brand: "Volkswagen".

    5. 🗣️ **FEEDBACK HUMANO ('ALIVE AI')**: 
       Genera un campo "aiReasoning" con un mensaje corto (máx 15 palabras) y con EMOCIÓN/EMOJIS explicando qué estás buscando. ¡Que se sienta vivo!
       - "¡Entendido! Buscando bestias V8 de 450hp 🏎️💨"
       - "Perfecto para el rancho. Filtrando 4x4 de trabajo pesado 🚜"
       - "Buscando autos ahorradores para plataforma ⛽📉"
       - "¡Claro! Mostrando solo trocas blindadas 🛡️"

    4. 📉 **ORDENAMIENTO INTELIGENTE**: Detecta si el usuario prioriza precio, año o uso.
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
      "keywords": ["Array", "Of", "Semantic", "Tokens"],
      "aiReasoning": "String (Mensaje corto y carismático para el usuario)"
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
    const result = await geminiPro.generateContent(prompt); // 🚀 Usando modelo PRO para máxima precisión semántica
    const response = await result.response;
    const text = response.text();
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const aiOutput = JSON.parse(jsonString) as SearchIntent;

    // 🛡️ REFUERZO DE TAXONOMÍA: Corrección post-IA
    // Aunque el prompt lo pide, a veces la IA alucina (ej: "Negra" vs "Negro").
    // Aquí forzamos la coincidencia exacta con nuestros arrays.

    if (aiOutput.color) {
      const outputColor = aiOutput.color;
      // 1. Busqueda exacta
      const exact = COLORS.find(c => c.toLowerCase() === outputColor.toLowerCase());
      if (exact) {
        aiOutput.color = exact;
      } else {
        // 2. Busqueda parcial (ej: "Negra" -> "Negro", "Azul marino" -> "Azul")
        const partial = COLORS.find(c => outputColor.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(outputColor.toLowerCase().substring(0, 4)));
        if (partial) aiOutput.color = partial;
      }
    }

    if (aiOutput.fuel) {
      const outputFuel = aiOutput.fuel;
      const exact = FUELS.find(f => f.toLowerCase() === outputFuel.toLowerCase());
      if (exact) aiOutput.fuel = exact;
    }

    if (aiOutput.transmission) {
      const outputTrans = aiOutput.transmission;
      const exact = TRANSMISSIONS.find(t => t.toLowerCase() === outputTrans.toLowerCase());
      if (exact) aiOutput.transmission = exact;
    }

    // 💾 PASO FINAL: Guardar en caché para futuras consultas
    aiCache.set(query, aiOutput, context);
    console.log(`💰 [CACHE SAVE] Próxima búsqueda idéntica será gratis.`);

    return aiOutput;
  } catch (error) {
    console.error("❌ Error interpretando búsqueda:", error);
    return {}; // Return empty filter if AI fails (fallback to text search)
  }
}
