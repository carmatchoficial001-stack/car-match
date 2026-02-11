// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.


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

  // 🚀 NIVEL 0: ORQUESTADOR DE EFICIENCIA EXTREMA
  // Importar el orquestador dinámicamente para evitar dependencias circulares
  try {
    const { orchestrator } = await import('./orchestrator');
    const orchestratedResult = await orchestrator.execute(query, {
      role: 'INTERPRETER',
      efficiency: 'LOCAL_FIRST',
      useCache: true,
      context: { taxonomy: { BRANDS, COLORS, TRANSMISSIONS, FUELS }, searchContext: context }
    });

    if (orchestratedResult.source === 'LOCAL' || orchestratedResult.source === 'CACHE') {
      console.log(`✅ [ORCHESTRATOR ${orchestratedResult.source}] Costo: $0. Confianza: ${orchestratedResult.confidence}`);
      return orchestratedResult.data as SearchIntent;
    }

    if (orchestratedResult.source === 'FLASH' && orchestratedResult.confidence >= 0.8) {
      console.log(`⚡ [ORCHESTRATOR FLASH] Costo mínimo. Confianza: ${orchestratedResult.confidence}`);
      return orchestratedResult.data as SearchIntent;
    }

    // Si el orquestador usó PRO o tiene baja confianza, usamos ese resultado pero lo validamos abajo
    if (orchestratedResult.data) {
      console.log(`👑 [ORCHESTRATOR PRO] Máxima precisión garantizada.`);
      return orchestratedResult.data as SearchIntent;
    }
  } catch (orchError) {
    console.warn("⚠️ Orquestador no disponible, usando flujo legacy:", orchError);
  }

  // 🚀 PASO 1: FALLBACK - Intentar obtener del caché directo (por si el orquestador falló)
  const cachedResult = aiCache.get(query, context);
  if (cachedResult) {
    console.log(`⚡ [CACHE HIT LEGACY] Respuesta recuperada del caché. $0 gastados.`);
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
    
    **🏗️ VEHÍCULOS ESPECIALIZADOS DE CONSTRUCCIÓN (MAQUINARIA):**
    - "Montacargas" / "Forklift" / "Pato" → category: "Maquinaria", vehicleType: "Montacargas", brand: "Toyota,Caterpillar,Komatsu,Yale,Hyster"
    - "Retroexcavadora" / "Backhoe" / "Retro" → category: "Maquinaria", vehicleType: "Retroexcavadora", brand: "Caterpillar,JCB,Case,John Deere"
    - "Excavadora" / "Excavator" / "Pala mecánica" → category: "Maquinaria", vehicleType: "Excavadora", brand: "Caterpillar,Komatsu,Hitachi,Volvo"
    - "Motoconformadora" / "Motor Grader" / "Niveladora" → category: "Maquinaria", vehicleType: "Motoconformadora", brand: "Caterpillar,John Deere"
    - "Cargador frontal" / "Wheel Loader" / "Pala cargadora" → category: "Maquinaria", vehicleType: "Cargador Frontal", brand: "Caterpillar,Case,Volvo"
    - "Compactadora" / "Roller" / "Rodillo" → category: "Maquinaria", vehicleType: "Compactadora", brand: "Caterpillar,Bomag,Ingersoll Rand"
    - "Bulldozer" / "Dozer" / "D11" → category: "Maquinaria", vehicleType: "Bulldozer", brand: "Caterpillar,Komatsu,Shantui"
    - "Minicargador" / "Skid Steer" / "Bobcat" → category: "Maquinaria", vehicleType: "Minicargador", brand: "Bobcat,Caterpillar,Case,John Deere"
    - "Manipulador telescópico" / "Telehandler" → category: "Maquinaria", vehicleType: "Manipulador Telescópico", brand: "JCB,Manitou,Caterpillar"
    - "Grúa móvil" / "Crane" → category: "Maquinaria", vehicleType: "Grúa Móvil", brand: "Liebherr,Terex,Grove"
    
    **🚑 VEHÍCULOS DE SERVICIOS Y EMERGENCIAS:**
    - "Ambulancia" / "Ambulance" → category: "Especial", vehicleType: "Ambulancia", brand: "Mercedes-Benz,Ford,RAM,Chevrolet"
    - "Patrulla" / "Police car" / "Policía" → category: "Especial", vehicleType: "Patrulla", brand: "Ford,Chevrolet,Dodge"
    - "Camión de bomberos" / "Fire truck" → category: "Especial", vehicleType: "Camión de Bomberos", brand: "Pierce,Rosenbauer,E-One"
    - "Grúa" / "Tow truck" / "Grúa de arrastre" → category: "Camión", vehicleType: "Grúa", brand: "Ford,Freightliner,International"
    - "Barredora" / "Street sweeper" → category: "Maquinaria", vehicleType: "Barredora", brand: "Tennant,Nilfisk,Elgin"
    - "Camión de basura" / "Garbage truck" / "Recolector" → category: "Camión", vehicleType: "Camión de Basura", brand: "Freightliner,Peterbilt,Kenworth"
    - "Pipa" / "Water truck" / "Camión pipa" → category: "Camión", vehicleType: "Pipa", brand: "International,Kenworth,Freightliner"
    - "Camión cisterna" / "Tank truck" → category: "Camión", vehicleType: "Cisterna", brand: "Peterbilt,Kenworth,Volvo"
    - "Food truck" / "Camión de comida" → category: "Camión", vehicleType: "Food Truck", brand: "Ford,Chevrolet,Mercedes-Benz"
    
    **🚜 VEHÍCULOS AGRÍCOLAS:**
    - "Tractor agrícola" / "Tractor" / "Tractor de campo" → category: "Maquinaria", vehicleType: "Tractor", brand: "John Deere,Case IH,New Holland,Massey Ferguson,Kubota"
    - "Cosechadora" / "Combine" / "Trilladora" → category: "Maquinaria", vehicleType: "Cosechadora", brand: "John Deere,Case IH,Claas"
    - "Fumigadora" / "Sprayer" → category: "Maquinaria", vehicleType: "Fumigadora", brand: "John Deere,Apache,Case IH"
    - "Empacadora" / "Baler" → category: "Maquinaria", vehicleType: "Empacadora", brand: "John Deere,New Holland,Case IH"
    - "Sembradora" / "Planter" → category: "Maquinaria", vehicleType: "Sembradora", brand: "John Deere,Kinze,Case IH"
    
    **🏕️ VEHÍCULOS RECREATIVOS (RV/ATV):**
    - "Casa rodante" / "RV" / "Motorhome" / "Camper" → category: "Especial", vehicleType: "Casa Rodante", brand: "Winnebago,Jayco,Forest River,Thor"
    - "Trailer" / "Travel trailer" / "Remolque de viaje" → category: "Especial", vehicleType: "Trailer", brand: "Airstream,Keystone,Jayco"
    - "Cuatrimoto" / "ATV" / "Four wheeler" / "Cuatro ruedas" → category: "Especial", vehicleType: "Cuatrimoto", brand: "Honda,Yamaha,Polaris,Can-Am,Kawasaki"
    - "RZR" / "UTV" / "Side by side" / "Arenero" → category: "Especial", vehicleType: "RZR", brand: "Polaris,Can-Am,Yamaha,Honda"
    - "Go-kart" / "Kart" / "Kartcross" → category: "Especial", vehicleType: "Go-Kart", brand: "Tony Kart,CRG,Birel ART"
    - "Carrito de golf" / "Golf cart" → category: "Especial", vehicleType: "Carrito de Golf", brand: "Club Car,EZ-GO,Yamaha"
    - "Moto de nieve" / "Snowmobile" → category: "Especial", vehicleType: "Moto de Nieve", brand: "Ski-Doo,Polaris,Arctic Cat"
    - "Buggy" / "Dune buggy" → category: "Especial", vehicleType: "Buggy", brand: "Meyers Manx,VW"
    
    **🚌 VEHÍCULOS DE TRANSPORTE PÚBLICO:**
    - "Autobús urbano" / "City bus" / "Camión urbano" → category: "Autobús", vehicleType: "Autobús Urbano", brand: "Mercedes-Benz,Volvo,Scania,MAN"
    - "Autobús escolar" / "School bus" → category: "Autobús", vehicleType: "Autobús Escolar", brand: "Blue Bird,IC Bus,Thomas Built"
    - "Autobús de turismo" / "Coach" / "Autobús foráneo" → category: "Autobús", vehicleType: "Autobús de Turismo", brand: "Volvo,Scania,Mercedes-Benz,Irizar"
    - "Microbus" / "Minibus" / "Buseta" → category: "Autobús", vehicleType: "Microbus", brand: "Mercedes-Benz,Ford,Toyota,Hyundai"
    - "Combi" / "Van de pasajeros" / "Transporte escolar" → category: "Autobús", vehicleType: "Combi", brand: "Nissan,Toyota,Volkswagen"
    - "Sprinter" / "Sprinter van" → category: "Autobús", vehicleType: "Van", brand: "Mercedes-Benz,Ford Transit,RAM ProMaster"
    
    **🏭 VEHÍCULOS INDUSTRIALES:**
    - "Apilador eléctrico" / "Reach truck" / "Apiladora" → category: "Maquinaria", vehicleType: "Apilador", brand: "Toyota,Yale,Crown"
    - "Transpaleta motorizada" / "Electric pallet jack" → category: "Maquinaria", vehicleType: "Transpaleta", brand: "Yale,Crown,Raymond"
    - "Plataforma elevadora" / "Scissor lift" / "Tijera" → category: "Maquinaria", vehicleType: "Plataforma Elevadora", brand: "Genie,JLG,Haulotte"
    - "Camión de volteo" / "Dump truck" / "Volquete" → category: "Camión", vehicleType: "Volteo", brand: "Kenworth,Peterbilt,Mack,Volvo"
    - "Trompo" / "Revolvedora" / "Camión mezclador" / "Mixer" → category: "Camión", vehicleType: "Revolvedora", brand: "Kenworth,Freightliner,Mack"
    - "Bomba de concreto" / "Concrete pump" → category: "Maquinaria", vehicleType: "Bomba de Concreto", brand: "Putzmeister,Schwing,CIFA"
    - "Reach stacker" / "Contenedores" → category: "Maquinaria", vehicleType: "Reach Stacker", brand: "Kalmar,Hyster,Konecranes"
    
    **🛴 VEHÍCULOS DE MOVILIDAD PERSONAL:**
    - "Scooter eléctrico" / "E-scooter" / "Monopatín eléctrico" → category: "Especial", vehicleType: "Scooter Eléctrico", brand: "Xiaomi,Segway,Razor"
    - "Segway" / "Scooter balanceado" → category: "Especial", vehicleType: "Segway", brand: "Segway,Ninebot"
    - "Patineta eléctrica" / "E-skateboard" → category: "Especial", vehicleType: "Patineta Eléctrica", brand: "Boosted,Evolve,Backfire"
    - "Bicicleta eléctrica" / "E-bike" → category: "Especial", vehicleType: "Bicicleta Eléctrica", brand: "Trek,Specialized,Giant"
    - "Triciclo motorizado" / "Motocarro" / "Mototaxi" → category: "Especial", vehicleType: "Triciclo Motorizado", brand: "Bajaj,TVS,Piaggio"
    - "Motoneta" / "Scooter" / "Vespa" → category: "Motocicleta", vehicleType: "Motoneta", brand: "Vespa,Honda,Yamaha,Italika"
    
    **🎖️ VEHÍCULOS MILITARES/ESPECIALIZADOS (USADOS CIVILES):**
    - "Jeep militar" / "Willys" / "M151" → category: "Especial", vehicleType: "Jeep Militar", brand: "Willys,AM General"
    - "Hummer H1" / "HMMWV" / "Humvee" → category: "Automóvil", vehicleType: "SUV", brand: "AM General,Hummer"
    - "Camión militar" / "Military truck" / "6x6" → category: "Camión", vehicleType: "Camión Militar", brand: "M35,LMTV,Unimog"
    - "Furgón policial" / "Police van" / "Celular" → category: "Especial", vehicleType: "Furgón Policial", brand: "Ford,Mercedes-Benz,Chevrolet"
    
    **🏆 VEHÍCULOS CLÁSICOS E HISTÓRICOS (COLECCIONISTA):**
    - "Vocho" / "Escarabajo" / "Beetle" / "Fusca" → category: "Automóvil", brand: "Volkswagen", model: "Sedan (Vocho)", minYear: 1938, maxYear: 2003
    - "Combi" / "VW Bus" / "Transporter" / "Hippie van" → category: "Automóvil", brand: "Volkswagen", model: "Combi", vehicleType: "Van"
    - "Mustang clásico" / "Fastback" / "Shelby" → category: "Automóvil", brand: "Ford", model: "Mustang", minYear: 1964, maxYear: 1973
    - "Corvette Stingray" / "C2" / "C3" → category: "Automóvil", brand: "Chevrolet", model: "Corvette", minYear: 1963, maxYear: 1982
    - "Camaro clásico" / "Z28" → category: "Automóvil", brand: "Chevrolet", model: "Camaro", minYear: 1967, maxYear: 1981
    - "Chevy Nova" / "Nova SS" → category: "Automóvil", brand: "Chevrolet", model: "Nova", minYear: 1962, maxYear: 1979
    - "Impala clásico" / "Lowrider" → category: "Automóvil", brand: "Chevrolet", model: "Impala", minYear: 1958, maxYear: 1970
    - "Caribe" / "Golf Mk1" → category: "Automóvil", brand: "Volkswagen", model: "Caribe", minYear: 1974, maxYear: 1992
    - "Atlantic" / "Jetta Mk1" → category: "Automóvil", brand: "Volkswagen", model: "Atlantic", minYear: 1979, maxYear: 1992
    - "Datsun 240Z" / "Fairlady" → category: "Automóvil", brand: "Nissan", model: "240Z", minYear: 1969, maxYear: 1978
    - "Bronco clásico" / "Bronco viejo" → category: "Automóvil", brand: "Ford", model: "Bronco", minYear: 1966, maxYear: 1996
    - "Toyota FJ" / "FJ40" / "Land Cruiser clásico" → category: "Automóvil", brand: "Toyota", model: "Land Cruiser FJ", minYear: 1960, maxYear: 1984
    - "Mercedes 300SL" / "Gullwing" / "Alas de gaviota" → category: "Automóvil", brand: "Mercedes-Benz", model: "300SL"
    - "Porsche 911 clásico" / "911 air-cooled" → category: "Automóvil", brand: "Porsche", model: "911", minYear: 1964, maxYear: 1998
    
    **⚡ VEHÍCULOS ELÉCTRICOS HISTÓRICOS Y RAROS:**
    - "Tesla Roadster original" / "Roadster 1.0" → category: "Automóvil", brand: "Tesla", model: "Roadster", minYear: 2008, maxYear: 2012, fuel: "Eléctrico (BEV)"
    - "GM EV1" / "Electric Vehicle 1" → category: "Automóvil", brand: "General Motors", model: "EV1", fuel: "Eléctrico (BEV)"
    - "Nissan Leaf" / "Leaf eléctrico" → category: "Automóvil", brand: "Nissan", model: "Leaf", fuel: "Eléctrico (BEV)"
    - "BMW i3" / "i3 eléctrico" → category: "Automóvil", brand: "BMW", model: "i3", fuel: "Eléctrico (BEV)"
    - "Chevy Bolt" / "Bolt EV" → category: "Automóvil", brand: "Chevrolet", model: "Bolt EUV", fuel: "Eléctrico (BEV)"
    
    **🚀 CONCEPTS Y PROTOTIPOS 2025-2026:**
    - "Cybertruck" / "Tesla Cybertruck" → category: "Automóvil", brand: "Tesla", model: "Cybertruck", vehicleType: "Pickup", fuel: "Eléctrico (BEV)"
    - "Rivian R1T" / "R1S" → category: "Automóvil", brand: "Rivian", model: "R1T", vehicleType: "Pickup", fuel: "Eléctrico (BEV)"
    - "Ford F-150 Lightning" / "Lightning eléctrico" → category: "Automóvil", brand: "Ford", model: "F-150 Lightning", fuel: "Eléctrico (BEV)"
    - "Hummer EV" / "GMC Hummer eléctrico" → category: "Automóvil", brand: "GMC", model: "Hummer EV", fuel: "Eléctrico (BEV)"
    - "Lucid Air" → category: "Automóvil", brand: "Lucid", model: "Air", fuel: "Eléctrico (BEV)"
    - "Mercedes EQS" / "EQ eléctrico" → category: "Automóvil", brand: "Mercedes-Benz", model: "EQS", fuel: "Eléctrico (BEV)"
    - "Porsche Taycan" → category: "Automóvil", brand: "Porsche", model: "Taycan", fuel: "Eléctrico (BEV)"
    - "BYD Dolphin" / "BYD Seal" / "BYD Tang" → category: "Automóvil", brand: "BYD", fuel: "Eléctrico (BEV)"
    - "Xiaomi SU7" / "Auto Xiaomi" → category: "Automóvil", brand: "Xiaomi", model: "SU7", fuel: "Eléctrico (BEV)"
    
    **🌍 VEHÍCULOS REGIONALES / INTERNACIONALES:**
    - "Tuk-tuk motorizado" / "Auto rickshaw" / "Mototaxi" → category: "Especial", vehicleType: "Tuk-Tuk", brand: "Bajaj,Piaggio,TVS"
    - "Jeepney" / "Jeepney filipino" → category: "Especial", vehicleType: "Jeepney", brand: "Toyota,Isuzu"
    - "Wuling Mini EV" / "Hongguang Mini" → category: "Automóvil", brand: "Wuling", model: "Hongguang Mini EV", fuel: "Eléctrico (BEV)"
    - "Tata Nano" / "Nano carro" → category: "Automóvil", brand: "Tata", model: "Nano"
    - "Lada Niva" / "Niva 4x4" → category: "Automóvil", brand: "Lada", model: "Niva", traction: "4x4 (4WD)"
    - "Suzuki Jimny" / "Jimny 4x4" → category: "Automóvil", brand: "Suzuki", model: "Jimny", vehicleType: "SUV", traction: "4x4 (4WD)"
    - "Mahindra Thar" → category: "Automóvil", brand: "Mahindra", model: "Thar", vehicleType: "SUV"
    - "Maruti Alto" / "Suzuki Alto" → category: "Automóvil", brand: "Suzuki", model: "Alto"
    - "Renault Kwid" → category: "Automóvil", brand: "Renault", model: "Kwid"
    - "Dacia Duster" → category: "Automóvil", brand: "Dacia", model: "Duster", vehicleType: "SUV"
    
    **🎪 VEHÍCULOS ANFIBIOS Y ESPECIALES RAROS:**
    - "Amphicar" / "Auto anfibio" → category: "Especial", vehicleType: "Anfibio", brand: "Amphicar"
    - "Gibbs Aquada" / "Carro anfibio" → category: "Especial", vehicleType: "Anfibio", brand: "Gibbs"
    - "Rinspeed Splash" → category: "Especial", vehicleType: "Anfibio", brand: "Rinspeed"
    - "Messerschmitt KR200" / "Bubble car" / "Carro burbuja" → category: "Especial", vehicleType: "Microcar", brand: "Messerschmitt"
    - "Isetta" / "BMW Isetta" / "Huevo" → category: "Especial", vehicleType: "Microcar", brand: "BMW,Isetta"
    - "Peel P50" / "Carro más pequeño" → category: "Especial", vehicleType: "Microcar", brand: "Peel"
    - "Reliant Robin" / "Three-wheeler" → category: "Especial", vehicleType: "Triciclo", brand: "Reliant"
    
    **🏪 CATEGORÍAS DE NEGOCIOS PARA MAPSTORE:**
    - "Mecánico" / "Taller mecánico" / "Reparación" → businessCategory: "Taller Mecánico"
    - "Hojalatería" / "Enderezado" / "Pintura" → businessCategory: "Hojalatería y Pintura"
    - "Eléctrico automotriz" / "Electricidad de autos" → businessCategory: "Electricidad Automotriz"
    - "Refaccionaria" / "Autopartes" / "Repuestos" → businessCategory: "Refaccionaria"
    - "Llantas" / "Neumáticos" / "Tires" → businessCategory: "Llantería"
    - "Alineación" / "Balanceo" / "Suspensión" → businessCategory: "Alineación y Balanceo"
    - "Escape" / "Mofle" / "Silenciador" → businessCategory: "Taller de Escapes"
    - "Transmisiones" / "Clutch" / "Embrague" → businessCategory: "Taller de Transmisiones"
    - "Frenos" / "Brake service" → businessCategory: "Taller de Frenos"
    - "Aire acondicionado" / "A/C automotriz" → businessCategory: "Aire Acondicionado Automotriz"
    - "Radiadores" / "Sistema de enfriamiento" → businessCategory: "Radiadores"
    - "Grúa" / "Grúa de arrastre" / "Tow truck" → businessCategory: "Servicio de Grúa"
    - "Desponchadora" / "Ponchadura" / "Vulcanizadora" → businessCategory: "Desponchadora"
    - "Lavado de autos" / "Car wash" / "Autolavado" → businessCategory: "Lavado de Autos"
    - "Detailing" / "Pulido" / "Encerado" → businessCategory: "Detailing Automotriz"
    - "Polarizado" / "Window tint" / "Insulfilm" → businessCategory: "Polarizado"
    - "Audio para autos" / "Estéreo" / "Car audio" → businessCategory: "Audio Automotriz"
    - "Alarmas" / "Seguridad vehicular" → businessCategory: "Alarmas y Seguridad"
    - "GPS para autos" / "Rastreadores" → businessCategory: "GPS y Rastreo"
    - "Tapicería" / "Vestiduras" / "Upholstery" → businessCategory: "Tapicería Automotriz"
    - "Cristales" / "Parabrisas" / "Windshield" → businessCategory: "Cristales Automotrices"
    - "Agencia automotriz" / "Dealer" / "Concesionario" → businessCategory: "Agencia Automotriz"
    - "Verificentro" / "Verificación vehicular" → businessCategory: "Verificación Vehicular"
    - "Gasolinera" / "Gas station" / "Pemex" → businessCategory: "Gasolinera"
    - "Lubricantes" / "Cambio de aceite" / "Quick lube" → businessCategory: "Cambio de Aceite"
    - "Diesel" / "Gasolinera diesel" → businessCategory: "Estación de Diesel"
    - "Gas LP" / "Carga de gas" → businessCategory: "Estación de Gas LP"
    - "Carga eléctrica" / "Supercharger" / "Tesla charger" → businessCategory: "Estación de Carga Eléctrica"
    - "Seguro de autos" / "Insurance" / "Aseguradora" → businessCategory: "Seguros Automotrices"
    - "Financiamiento" / "Crédito automotriz" → businessCategory: "Financiamiento Automotriz"
    - "Chatarra" / "Yonke" / "Junkyard" → businessCategory: "Yonke / Deshuesadero"
    - "Empacadora" / "Scrap yard" → businessCategory: "Empacadora de Autos"
    - "Rent a car" / "Renta de autos" → businessCategory: "Renta de Vehículos"
    - "Valet parking" / "Estacionamiento" → businessCategory: "Estacionamiento"
    - "Car wash automático" / "Lavado express" → businessCategory: "Lavado Automático"
    - "Inspector vehicular" / "Perito" → businessCategory: "Inspección y Peritaje"
    - "Tuning" / "Modificaciones" / "Performance" → businessCategory: "Tuning y Modificaciones"
    - "Suspensión especializada" / "Lift kit" → businessCategory: "Suspensión Especializada"
    - "Reparación de turbos" → businessCategory: "Taller de Turbos"
    - "Inyección diesel" / "Common rail" → businessCategory: "Inyección Diesel"
    
    
    **SLANG Y TÉRMINOS REGIONALES (DICCIONARIO DE LA CALLE):**
    - "Troca" / "Trocona" / "Mamalona" → Pickup (generalmente grande, 4x4)
    - "Nave" / "Fierro" / "Ranfla" → Auto (general)
    - "Mueble" → Automóvil (Norte de México)
    - "Clima helando" → Aire Acondicionado: Sí
    - "Patas de hule" → Llantas: Nuevas
    - "Carcacha" / "Chatarra rodante" → Automóvil viejo (condition: "Para Restaurar")
    - "De agencia" / "De lote" → Condition: "Nuevo" o "Seminuevo (Casi Nuevo)"
    - "Carrazo" / "Carrote" → Automóvil de lujo (maxPrice: \u003e800000)
    - "Nave espacial" → Automóvil muy moderno o futurista
    - "Troquita" / "Rangerita" → Pickup pequeña (Ford Ranger, Toyota Tacoma)
    - "Suburban" / "Burban" → Chevrolet Suburban específicamente
    - "Raptor" / "La Raptor" → Ford F-150 Raptor específicamente
    - "Cheyenne" / "La Cheyenne" → Chevrolet Silverado Cheyenne
    - "Lobo" / "La Lobo" → Ford F-150 Lobo (México)
    - "Vochito" → Volkswagen Beetle pequeño/antiguo
    - "Combota" → Volkswagen Combi grande
    
    **SLANG INTERNACIONAL (MULTILINGÜE):**
    - "Truck" (USA) → Pickup
    - "Ute" (Australia) → Pickup
    - "Bakkie" (Sudáfrica) → Pickup
    - "Pickup truck" → Vehiculo: Pickup
    - "SUV" / "4x4" → VehicleType: SUV, traction: "4x4 (4WD)"
    - "Crossover" / "CUV" → VehicleType: SUV (más pequeño)
    - "Minivan" / "People carrier" → VehicleType: Minivan
    - "Station wagon" / "Estate" / "Familiar" → VehicleType: SW (Station Wagon)
    - "Sedan" / "Saloon" → VehicleType: Sedán
    - "Hatchback" / "Tres puertas" / "Cinco puertas" → VehicleType: Hatchback
    - "Coupe" / "Coupé" → VehicleType: Coupé
    - "Convertible" / "Cabrio" / "Descapotable" → VehicleType: Convertible
    - "Roadster" / "Spider" / "Spyder" → VehicleType: Roadster
    
    **SLANG BRASIL (PORTUGUÊS):**
    - "Caminhonete" → Pickup
    - "Caminhão" → Camión
    - "Perua" → Station Wagon
    - "Fusca" → Volkswagen Beetle
    - "Kombi" → Volkswagen Combi
    - "Carrão" → Auto de lujo
    - "Carro popular" → Auto económico
    - "Zero km" → Nuevo (minYear: 2024)
    
    **SLANG ESPAÑA:**
    - "Todoterreno" → SUV 4x4
    - "Monovolumen" → Minivan
    - "Furgoneta" → Van
    - "Utilitario" → Auto compacto económico
    - "Berlina" → Sedán
    - "Familiar" → Station Wagon
    - "Descapotable" → Convertible
    
    **SLANG ARGENTINA:**
    - "Camioneta" → Pickup
    - "Chata" → Pickup (término local)
    - "Auto" → Automóvil
    - "Coche" → Automóvil
    - "Coupé deportivo" → Coupé
    - "Rural" → Station Wagon
    
    **SLANG USA (ENGLISH):**
    - "Beemer" / "Bimmer" → BMW
    - "Vette" → Chevrolet Corvette
    - "Stang" → Ford Mustang
    - "Lambo" → Lamborghini
    - "Porky" / "Pig" → Porsche (coloquial)
    - "Viper" → Dodge Viper
    - "Hemi" → Motor Chrysler Hemi (cylinders: 8)
    - "Cummins" → Motor Cummins diesel
    - "Duramax" → Motor Duramax diesel
    - "Power Stroke" → Motor Ford diesel
    - "Ecoboost" → Motor Ford turbocargado
    
    
    TUS OBJETIVOS DE ALTA PRECISIÓN Y TRADUCCIÓN:
    1. 🗣️ **Traductor Semántico Multilingüe**: El usuario puede buscar en CUALQUIERA de los 21 idiomas. TU TRABAJO es mapear su intención a los VALORES EXACTOS de la taxonomía.
    2. 🧠 **MODO CONSULTOR (PREGUNTAS VAGAS)**: Si el usuario busca por USO:
       - 🚜 "Para el Campo" → category: "Maquinaria", vehicleType: "Tractor", traction: "4x4 (4WD)"
       - 🏗️ "Para Construcción" → category: "Maquinaria", vehicleType: "Excavadora"
       - 🚚 "Para Fletes/Mudanzas" → category: "Camión", vehicleType: "Caja Seca"
       - 🏁 "Para dunas/arena" → category: "Especial", vehicleType: "RZR"
    3. ⚙️ **MODO TÉCNICO EXPERTO (MAQUINARIA Y CAMIONES)**: 
       - "Cero horas", "0 hrs" -> operatingHours: 0
       - "18 velocidades", "18 cambios" -> (Tractocamiones) transmission: "Manual"
       - "Paso 42/46", "Mancuerna" -> (Contexto Camiones) features: ["Mancuerna"]
    4. 🗣️ **FEEDBACK HUMANO ('ALIVE AI')**: 
       Genera un campo "aiReasoning" con mensaje corto (máx 15 palabras) con EMOCIÓN/EMOJIS:
       - "¡Bestias diesel listas para el jale! 🚜💨"
       - "Encontrando tu nave ideal para Uber 🚖✨"
       - "Buscando esa mamalona 4x4 🐎🏜️"
       - "Esa Raptor se ve imponente 🦖💨"

    6. 📉 **ORDENAMIENTO INTELIGENTE**:
       - "El más barato" → sort: "price_asc"
       - "El más nuevo" → sort: "year_desc"
       - "Poco kilometraje" → sort: "mileage_asc"

    7. 💬 **MODO ASESOR INTERACTIVO (CUESTIONARIO)**:
       Esta es tu función más importante. Si el usuario hace una pregunta vaga como QUE ME RECOMIENDAS, NO devuelvas filtros finales. 
       En su lugar, inicia una CONVERSACIÓN devolviendo isConversational true.

       **COMPORTAMIENTO REQUERIDO:**
       
       - **Caso 1: Recomendación General**
         -> isConversational: true
         -> nextQuestion: "¡Claro! Para recomendarte mejor, ¿cuál será el uso principal? (Ej: Familia, Trabajo, Uber, Ciudad, Campo)"
       
       - **Caso 2: Uso Específico**
         -> isConversational: true
         -> nextQuestion: "Excelente. ¿Qué presupuesto aproximado tienes y prefieres algún tipo de carrocería?"
       
       - **Caso 3: Comparación Vaga**
         -> isConversational: true
         -> nextQuestion: "Ambas son excelentes. ¿Buscas un modelo específico o quieres ver todo el catálogo de ambas?"
       
       - **Caso 4: Pregunta Técnica**
         -> isConversational: false
         -> aiReasoning: "El V6 es potente y confiable. Aquí tienes opciones."
         -> Filtros: cylinders: 6

       - **Caso 5: Consejos de Seguridad o Cita**
         -> isConversational: true
         -> nextQuestion: "🛡️ ¡Seguridad ante todo! Recomendamos verse en un punto medio público (plazas). ¿Buscas consejos sobre qué revisar al vehículo o cómo agendar la cita?"
         -> aiReasoning: "CarMatch NO se involucra en negociaciones; somos la plataforma que los conecta con seguridad."

    REGLA: Solo usa isConversational true si es indispensable.

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
