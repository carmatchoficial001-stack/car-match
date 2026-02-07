// 🔒 FEATURE LOCKED: CORE AI INTERPRETATION. NO EDITAR SIN APROBACIÓN EXPRESA DE RUBEN.
// Consulte REGLAS_DE_PROTECCION.md en la raíz para más detalles.
import { safeGenerateContent, safeExtractJSON } from "./ai/geminiClient";
import aiCache from "./ai/aiCache"; // 💰 Sistema de caché para ahorrar $$$

export async function interpretMapQuery(query: string): Promise<string[]> {
   // 💰 PASO 1: Intentar obtener del caché
   const cached = aiCache.get(query, 'map-ai');
   if (cached) {
      console.log(`💰 [MAP AI CACHE HIT] Ahorramos llamada a Gemini para: "${query}"`);
      return cached;
   }

   try {
      const prompt = `
            Actúa como el MAESTRO MECÁNICO de CarMatch, una leyenda con 60 años de experiencia. Tienes OÍDO ABSOLUTO para motores y conoces toda la jerga callejera y técnica de México.

            TU MISIÓN: Traducir lo que dice el usuario (ruidos, quejas, jerga) a CATEGORÍAS TÉCNICAS para el mapa.

            CATEGORÍAS DISPONIBLES EN EL MAPSTORE (Salida):
            [TALLER, CONCESIONARIO, CARWASH, DESPONCHADORA, FINANCIAMIENTO, REFACCIONES, PINTURA, MECANICA, ELECTRICO, DIESEL, MAQUINARIA, ESPECIAL, OTRO]

            🧠 BASE DE CONOCIMIENTO (NIVEL EXPERTO):

            1. 🔊 DICCIONARIO DE RUIDOS (ONOMATOPEYAS):
               - "Taka taka" (motor) -> MECANICA (Punterías, bielas, válvulas)
               - "Clack clack" al dar vuelta -> TALLER (Flecha homocinética, espigas)
               - "Grillo", "Chillido" -> MECANICA (Bandas, poleas, tensores)
               - "Zumbido" al correr -> TALLER (Baleros, maza)
               - "Tronido" al frenar/baches -> TALLER (Balatas, rótulas, bujes)
               - "Explosiones", "Pedos" -> MECANICA (Escape, mofles, puesta a punto)
               - "Silbido" (turbo/aire) -> MECANICA (Turbo, mangueras de vacío)
               - "Golpeteo seco" -> TALLER (Amortiguadores, bases)
               - "Raspa", "Fierro con fierro" -> TALLER (Frenos acabados)

            2. 🇲🇽 JERGA MEXICANA Y CALLEJERA:
               - "Gallito", "Talacha", "Goma", "Vulca", "Parchada" -> DESPONCHADORA
               - "Chalanear", "Talibaneada", "Remendar" -> TALLER (Reparación general)
               - "Afinación" -> MECANICA (Bujías, aceite, filtros)
               - "Verificación", "Holograma", "Emisiones" -> TALLER
               - "Hojalatería", "Laminazo", "Sacar un golpe" -> PINTURA
               - "Baño de pintura", "Pulida de faros", "Detailing" -> PINTURA
               - "Polarizado", "Película", "Estéreo", "Audio", "Sonido" -> TALLER (Accesorios/Otro)
               - "Headers", "Tubería directa", "Flowmaster", "Catback" -> MECANICA (Modificaciones)
               - "Repro", "Stage 1/2", "Chip", "Válvula de alivio" -> MECANICA (Tuning)

            3. 🚑 URGENCIAS Y SÍNTOMAS CRÍTICOS:
               - "Me quedé tirado", "No camina", "Se mató el carro" -> MECANICA y DESPONCHADORA (Grúas)
               - "Se calienta", "Tira agua", "Humea", "Avienta vapor" -> MECANICA
               - "Tira aceite", "Mancha el piso", "Gotea" -> MECANICA
               - "No da marcha", "Click click y nada", "Muerto" -> ELECTRICO (Batería, marcha)
               - "Testigos prendidos", "Check engine", "Foco del motor" -> ELECTRICO (Escáner)
               - "Patina", "No entran cambios", "Truena la caja", "Se neutraliza" -> MECANICA (Transmisión)
               - "No enfría", "Solo echa aire caliente", "No sale aire" -> ELECTRICO (Aire Acondicionado)

            4. 🚜 TIPOS DE VEHÍCULO ESPECIALES:
               - "Tractor", "Cosechadora", "Retro", "Mano de chango" -> MAQUINARIA
               - "Troca diesel", "Cummins", "Powerstroke", "Trailer", "Kenworth", "Torton" -> DIESEL
               - "RZR", "Can-Am", "Cuatrimoto", "Buggy", "Lancha", "Moto de agua" -> ESPECIAL
               - "Vochito", "Clásico", "Restauración" -> PINTURA y MECANICA

            5. 🛁 ESTÉTICA Y LIMPIEZA:
               - "Lavado de vestiduras", "Encerado", "Pulido", "Motor lavado" -> CARWASH

            6. 💰 DINERO Y PAPELES:
               - "Crédito", "Enganche", "Mensualidad", "A plazos" -> FINANCIAMIENTO
               - "Cambio de propietario", "Gestoría", "Placas" -> OTRO

            REGLAS DE ORO:
            - Sé EMPÁTICO: Si alguien está "tirado", prioriza la ayuda cercana (MECANICA/DESPONCHADORA).
            - Sé PRECISO: Si dice "llanta", es DESPONCHADORA, no TALLER.
            - BÚSQUEDA DIRECTA: Si busca un nombre propio (Ej: "Taller El Chuy"), devuelve null para que el sistema busque por texto.

            USUARIO DICE: "${query}"

            Responde ÚNICAMENTE con un array JSON de strings (Ej: ["MECANICA", "ELECTRICO"]):
        `;

      // ✅ Usamos FLASH PRECISE (Temp 0.1) para evitar alucinaciones técnicas
      const { geminiFlashPrecise } = await import("./ai/geminiClient");
      const response = await geminiFlashPrecise.generateContent(prompt);
      const responseText = response.response.text();

      const categories = safeExtractJSON<string[]>(responseText);
      const result = Array.isArray(categories) ? categories : [];

      // 💰 PASO 2: Guardar en caché para la próxima vez
      if (result.length > 0) {
         aiCache.set(query, result, 'map-ai');
         console.log(`💾 [MAP AI CACHED] "${query}" -> ${result.join(', ')}`);
      }

      return result;
   } catch (error) {
      console.error("AI Map Interpretation Error:", error);
      return [];
   }
}
