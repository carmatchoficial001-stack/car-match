
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
  isConversational?: boolean; // 💬 TRUE si la IA necesita más info y está iniciando un cuestionario
  nextQuestion?: string; // ❓ La pregunta que la IA le hace al usuario para refinar la búsqueda
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
    Eres un MEGA-CEREBRO AUTOMOTRIZ con 100 AÑOS DE EXPERIENCIA COMBINADA. Has visto TODOS los vehículos terrestres motorizados desde el Ford Modelo T hasta los Cybertrucks. Conoces cada motor icónico, cada configuración legendaria, cada slang de México y el mundo.

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

    🧠 **CONOCIMIENTO ENCICLOPÉDICO DE VEHÍCULOS (EXPERTO DE 100 AÑOS):**
    
    **MOTORES LEGENDARIOS QUE DEBES RECONOCER AL INSTANTE:**
    - "Duramax" / "6.6 Duramax" → brand: "Chevrolet,GMC", fuel: "Diesel", cylinders: 8, vehicleType: "Pickup"
    - "Cummins" / "5.9 Cummins" / "6.7 Cummins" → brand: "RAM,Dodge", fuel: "Diesel", cylinders: 6, vehicleType: "Pickup"
    - "Power Stroke" / "Powerstroke" / "6.7 Power Stroke" → brand: "Ford", fuel: "Diesel", cylinders: 8, vehicleType: "Pickup"
    - "Hemi" / "5.7 Hemi" / "6.4 Hemi" → brand: "RAM,Dodge,Jeep", fuel: "Gasolina", cylinders: 8
    - "Ecoboost" / "3.5 Ecoboost" / "2.7 Ecoboost" → brand: "Ford", fuel: "Gasolina", cylinders: 6
    - "LS" / "LS1" / "LS3" / "LT1" → brand: "Chevrolet", fuel: "Gasolina", cylinders: 8 (Corvette, Camaro, etc.)
    - "Triton" / "5.4 Triton" → brand: "Ford", fuel: "Gasolina", cylinders: 8
    - "Vortec" / "5.3 Vortec" / "6.0 Vortec" → brand: "Chevrolet,GMC", fuel: "Gasolina", cylinders: 8
    
    **CONFIGURACIONES ESPECÍFICAS:**
    - "V6" / "v6" / "6 cilindros" / "6 cil" → cylinders: 6
    - "V8" / "v8" / "8 cilindros" / "8 cil" → cylinders: 8
    - "I4" / "4 cilindros en línea" → cylinders: 4
    - "W16" / "16 cilindros" → cylinders: 16 (Bugatti)
    - "Boxer" / "Motor boxer" → (Subaru, Porsche) cylinders: 4 o 6
    
    **MODELOS ICÓNICOS Y SU CONTEXTO:**
    - "Raptor" / "F-150 Raptor" → brand: "Ford", model: "F-150 Raptor", vehicleType: "Pickup", traction: "4x4 (4WD)"
    - "TRD" / "TRD Pro" → brand: "Toyota", features: ["Off-road package"], traction: "4x4 (4WD)"
    - "Denali" → brand: "GMC", vehicleType: "Pickup" OR "SUV" (versión de lujo)
    - "Laramie" / "Longhorn" / "Limited" → brand: "RAM", vehicleType: "Pickup" (trim levels)
    - "King Ranch" / "Platinum" / "Lariat" → brand: "Ford", vehicleType: "Pickup" (trim levels)
    - "Cheyenne" / "Silverado" / "Sierra" → brand: "Chevrolet,GMC", vehicleType: "Pickup"
    
    **SLANG Y TÉRMINOS REGIONALES (MÉXICO Y LATAM):**
    - "Troca" / "Trocona" / "Mamalona" → Pickup (generalmente grande, 4x4)
    - "Nave" / "Fierro" / "Carcacha" → Auto (general)
    - "Vocho" → Volkswagen Beetle (Sedán)
    - "Combi" → Volkswagen Kombi / Transporter (Minivan)
    - "Chevy" / "Chevycito" → Chevrolet Chevy (Sedán pequeño, descontinuado)
    - "Tsuru" → Nissan Tsuru (Sedán icónico en México)
    - "Atos" → Hyundai Atos (Hatchback pequeño)
    - "Matiz" → Chevrolet Matiz (Hatchback muy pequeño)
    - "Italika" → Marca de motocicletas mexicana muy popular

    TUS OBJETIVOS DE ALTA PRECISIÓN Y TRADUCCIÓN:
    1. 🗣️ **Traductor Semántico Multilingüe**: El usuario puede buscar en CUALQUIERA de los 21 idiomas (Español, Inglés, Chino, Árabe, etc.). TU TRABAJO es mapear su intención a los VALORES EXACTOS de la taxonomía anterior en Español.
       - "Ram negra" (Español) -> color: "Negro"
       - "Black Ram" (Inglés) -> color: "Negro"
       - "Ram noir" (Francés) -> color: "Negro"
       - "Camioneta" / "Troca" / "Pickup" -> vehicleType: "Pickup" (Categoría: Automóvil)
       - "Voiture" -> category: "Automóvil"

    2. 🧠 **MODO CONSULTOR (PREGUNTAS VAGAS)**: Si el usuario busca por USO en lugar de vehículo:
       - 🚖 "Para Uber/Taxi/Didi" → category: "Automóvil", vehicleType: "Sedán", minYear: 2018, fuel: "Gasolina" (o Híbrido)
       - ⛽ "Ahorrar Gasolina" → category: "Automóvil", fuel: "Híbrido", vehicleType: "Sedán"
       - 🚜 "Para el Campo" → category: "Automóvil", vehicleType: "Pickup", traction: "4x4 (4WD)"
       - 👪 "Para Familia" → category: "Automóvil", vehicleType: "SUV" o "Minivan", passengers: 7
       - 💪 "Trabajo Pesado" / "Para Jalar" / "Remolcar" → vehicleType: "Pickup", cylinders: 8, fuel: "Diesel"

    3. ⚙️ **MODO TÉCNICO (EXTRACCIÓN DE ATRIBUTOS)**: Extrae con precisión de cirujano valores numéricos:
       - "V6", "6 cil", "6 cilindros" -> cylinders: 6
       - "V8", "8 cilindros", "ocho cilindros" -> cylinders: 8
       - "3 toneladas", "3 ton" -> cargoCapacity: 3.0
       - "Motor 2.0", "2.0 litros", "2000 cc" -> displacement: 2000
       - "450 hp", "450 caballos" -> hp: 450
       - "Cero horas", "0 horas" -> operatingHours: 0

    4. 🕵️‍♂️ **DETECTIVES DE MARCA (CASOS ESPECIALES)**:
       - "Ram" / "Ramona" / "Mamalona" -> brand: "RAM,Dodge"
       - "Chevy" -> brand: "Chevrolet"
       - "Vw" / "Vocho" -> brand: "Volkswagen"
       - "Bora" -> brand: "Volkswagen", model: "Bora"

    5. 🗣️ **FEEDBACK HUMANO ('ALIVE AI')**: 
       Genera un campo "aiReasoning" con mensaje corto (máx 15 palabras) con EMOCIÓN/EMOJIS:
       - "¡Bestias diesel con Cummins! 🐎💨"
       - "Pickups 4x4 para trabajo rudo 🚜💪"
       - "Buscando ahorradores híbridos ⛽📉"

    6. 📉 **ORDENAMIENTO INTELIGENTE**:
       - "El más barato" → sort: "price_asc"
       - "El más nuevo" → sort: "year_desc"
       - "Poco kilometraje" → sort: "mileage_asc"

    7. 💬 **MODO ASESOR INTERACTIVO (CUESTIONARIO)**:
       Esta es tu función más importante. Si el usuario hace una pregunta vaga ("¿qué me recomiendas?", "quiero un carro familiar", "carro para uber"), **NO devuelvas filtros finales**. 
       En su lugar, inicia una CONVERSACIÓN estableciendo el campo isConversational en true y una pregunta de seguimiento en nextQuestion.

       **COMPORTAMIENTO REQUERIDO:**
       
       - **Caso 1: Recomendación General ("¿Qué me recomiendas?")**
         → isConversational: true
         → nextQuestion: "¡Claro! Para darte la mejor recomendación, ¿cuál será el uso principal? (Ej: Familia, Trabajo, Uber, Ciudad, Campo)"
       
       - **Caso 2: Uso Específico Detectado pero Faltan Detalles** ("Quiero un carro para Uber")
         → isConversational: true
         → nextQuestion: "Excelente opción. ¿Qué presupuesto tienes aproximadamente y prefieres algún tipo de carrocería (Sedán o Hatchback)?"
       
       - **Caso 3: Comparación Vaga ("¿Toyota o Nissan?")**
         → isConversational: true
         → nextQuestion: "Ambas son excelentes marcas japonesas. ¿Estás buscando un modelo en particular (como Corolla vs Sentra) o quieres ver todo lo disponible de ambas?"
       
       - **Caso 4: Pregunta Técnica ("¿Es bueno el motor V6?")**
         → isConversational: false
         → aiReasoning: "El V6 ofrece buen equilibrio potencia/consumo. Aquí tienes opciones V6 confiables. 🔧"
         → Filtros: cylinders: 6
       
       **REGLA:** Solo activa `isConversational: true` si realmente necesitas más info para filtrar bien. Si la búsqueda es explícita ("Ram 2020 4x4"), NO preguntes nada, solo busca.

    RESPONDE SOLO JSON (Sin markdown):
    {
      "category": "String",
      "vehicleType": "String",
      "brand": "String",
      "model": "String",
      "minPrice": Number, "maxPrice": Number, "minYear": Number,
      "color": "String",
      "transmission": "String",
      "fuel": "String",
      "passengers": Number,
      "cylinders": Number,
      "hp": Number,
      "displacement": Number,
      "traction": "String",
      "features": ["Array"],
      "sort": "String",
      "aiReasoning": "String (Si NO es conversacional: Mensaje corto final 'Mostrando X resultados...')",
      "isConversational": Boolean, // TRUE si haces una pregunta de seguimiento
      "nextQuestion": "String" // La pregunta que le haces al usuario
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
