
import { geminiModel } from "./geminiClient";


interface ImageAnalysisResult {
  valid: boolean;
  reason?: string; // If invalid (NSFW, Not a vehicle)
  category?: string; // 'automovil', 'motocicleta', 'comercial', 'industrial', 'transporte', 'especial'
  invalidIndices?: number[]; // 🚨 NEW: Indices of images that are NOT vehicles
  details?: {
    // Identificación básica
    brand?: string;
    model?: string;
    year?: string; // Estimated
    color?: string;
    type?: string; // SUV, Sedan, Pickup, etc.

    // Características técnicas
    transmission?: string; // Manual, Automática, CVT
    fuel?: string; // Gasolina, Diésel, Eléctrico, Híbrido
    engine?: string; // Ej: "2.0L Turbo", "V6 3.5L"
    doors?: number; // 2, 4, 5
    mileage?: number; // Kilometraje estimado si es visible
    condition?: string; // Nuevo, Seminuevo, Usado

    // Características visibles (para vender el vehículo)
    features?: string[]; // ["Quemacocos", "Rines aleación", "Cámara reversa", etc.]

    // Campos específicos por tipo de vehículo
    displacement?: number; // Cilindrada en cc (motos)
    cargoCapacity?: number; // Toneladas (camiones)
    operatingHours?: number; // Horas de uso (maquinaria)
  };
}

export async function analyzeImage(imageBase64: string, type: 'VEHICLE' | 'BUSINESS' = 'VEHICLE'): Promise<ImageAnalysisResult> {
  console.log(`🤖 Analizando imagen (${type}) con Gemini Vision...`);

  let prompt = '';

  if (type === 'BUSINESS') {
    // 🟢 RELAXED VALIDATION FOR BUSINESS
    prompt = `
ERES UN MODERADOR DE CONTENIDO PARA UNA RED SOCIAL DE NEGOCIOS.
TU TRABAJO ES FILTRAR SOLO EL CONTENIDO PELIGROSO O ILEGAL.

✅ PERMITIDO (TODO LO QUE NO ESTÉ PROHIBIDO):
- Logos, Fachadas, Tarjetas de presentación
- Personas (mecánicos, clientes, staff)
- Memes, Humor, Publicidad, Flyers
- Vehículos, Herramientas, Talleres
- CUALQUIER imagen segura para el trabajo (SFW)

❌ PROHIBIDO ESTRICTAMENTE (TOLERANCIA CERO):
- 🔞 CONTENIDO SEXUAL EXPLÍCITO (Desnudos, pornografía, poses lascivas)
- 🩸 VIOLENCIA EXTREMA (Sangre real, gore, accidentes fatales, tortura)
- 🔫 ARMAS REALES en contexto violento (no herramientas)
- 💊 DROGAS ILEGALES o parafernalia explícita
- 🖕 DISCURSO DE ODIO (Símbolos nazis, racistas, etc.)

SI LA IMAGEN ES SEGURA (Aunque sea un meme o un dibujo):
Responde {"valid": true}

SI LA IMAGEN VIOLA LAS REGLAS:
Responde {"valid": false, "reason": "Explicación breve en español"}

RESPONDE SOLO EL JSON.
`;
  } else {
    // 🚗 STRICT VALIDATION FOR VEHICLES (Existing Logic)
    prompt = `
ERES UN INSPECTOR DE CONTENIDO PARA CARMATCH - RED SOCIAL EXCLUSIVA DE VEHÍCULOS TERRESTRES MOTORIZADOS.

⚠️ POLÍTICA DE TOLERANCIA CERO ⚠️
Esta plataforma SOLO acepta vehículos terrestres con motor y sus partes legítimas.
CUALQUIER OTRA COSA debe ser RECHAZADA inmediatamente.

═══ LISTA DE RECHAZO ABSOLUTO (TOLERANCIA CERO) ═══
🚫 RECHAZA DE INMEDIATO Y SIN EXCEPCIÓN:
  
  🔞 CONTENIDO SEXUAL O DESNUDOS (Cualquier rastro de pornografía o lascivia)
  🩸 VIOLENCIA O SANGRE (Accidentes fatales, armas, gore, tortura)
  🪴 PLANTAS (Flores, árboles, jardines, vegetación predominate)
  👥 PERSONAS (Rostros, cuerpos, selfies, multitudes)
  🐾 ANIMALES (Perros, gatos, ganado, cualquier ser vivo)
  🍔 COMIDA (Platillos, bebidas, supermercado)
  🏞️ PAISAJES (Montañas, playas, edificios sin vehículos)
  🤡 MEMES O TEXTO (Capturas de pantalla, dibujos, humor)
  🏠 OBJETOS DOMÉSTICOS (Muebles, electrónicos, ropa)
  ✈️ VEHÍCULOS NO TERRESTRES (Aviones, barcos, drones, lanchas)
  🧸 JUGUETES (Modelos a escala, carritos de juguete)
  🌀 IMÁGENES MUY BORROSAS o ilegibles

⚠️ SI LA FOTO ES DE PORTADA (IMAGEN 0), SÉ EL DOBLE DE ESTRICTO.

═══ SOLO ACEPTA (ONTOLOGÍA OMNIBUS DE VEHÍCULOS TERRESTRES) ═══
✅ AUTOMÓVILES (Pasajeros Privado):
  - Sedán, Hatchback, SUV, Crossover, Coupe, Convertible, Roadster, Station Wagon
  - Limusinas, Microcoches (Smart, Isetta), Kei Cars
  - Pickups Ligeras (Ranger, Hilux) y Personales (Maverick)

✅ MOTOCICLETAS Y AFINES (Manillar/Triciclos):
  - Motos: Deportiva, Chopper, Cafe Racer, Touring, Enduro, Motocross, Scooter
  - Triciclos: Spyder, Ryker, Tuk-tuks (Mototaxis), Trimotos de carga
  - Cuatrimotos: ATV (All-Terrain Vehicle), Quads

✅ COMERCIALES Y DE CARGA (Trabajo Pesado):
  - Pickups Heavy Duty (F-350, Ram 2500, Dual-Rear Wheels)
  - Furetes/Vans de Carga: Transit, Sprinter, Ducato, Kangoo
  - Camiones Rígidos: Torton, Rabón, Caja Seca, Refrigerada, Mudancero
  - Tractocamiones: Cabina chata (COE), Convencional (con trompa), 5ta Rueda
  - Especiales Carga: Grúas de plataforma, Cisternas (Pipas), Portacoches (Nodrizas/Madrinas)
  - Volteos (Dompes), Camiones de Basura, Hormigoneras (Ollas)

✅ TRANSPORTE DE PASAJEROS (Colectivo):
  - Autobuses Urbanos, Interurbanos, Articulados (Oruga), Trolebuses
  - Microbuses, Vans de Pasajeros (Combis/Colectivos)
  - Autobuses Turísticos, Escolares, Dos Pisos (Double Decker)

✅ INDUSTRIAL Y MAQUINARIA (Fuera de Carretera/Construcción):
  - Movimiento de Tierra: Excavadoras, Retroexcavadoras, Bulldozers, Motoconformadoras
  - Carga: Montacargas (Forklifts), Cargadores Frontales (Payloader), Minicargadores (Bobcat)
  - Agrícola: Tractores Agrícolas, Cosechadoras, Sembradoras
  - Construcción: Aplanadoras, Pavimentadoras, Grúas Industriales Móviles
  - Minería: Camiones Gigantes (Dump Trucks Mineros)

✅ VEHÍCULOS ESPECIALES Y RECREATIVOS (Nicho):
  - Recreativo: UTV (Side-by-Side/RZR/Maverick), Buggies, Areneros (Sand Rails), Motonieves
  - Emergencia: Ambulancias, Patrullas, Camiones de Bomberos, Rescate
  - Servicio: Carros de Golf, Barredoras Viales, Vehículos Funerarios (Carrozas)
  - Militar/Blindado (Civil): Vehículos blindados de transporte valores, Unimog
  - Camping: Casas Rodantes (Motorhomes/RVs), Campers montados

✅ PARTES DE VEHÍCULOS (si la foto es CLARA):
  - Motores, Transmisiones, Chasis
  - Llantas, Rines, Suspensión
  - Interiores (Asientos, Tablero, Volante)
  - Carrocería (Puertas, Cofre, Cajuela)

═══ INSTRUCCIONES DE ANÁLISIS ═══
1. PRIMERO: Verifica si la imagen es un vehículo terrestre motorizado o sus partes.
2. SI NO LO ES: Responde con valid=false y una razón CLARA.
3. SI SÍ LO ES: Extrae toda la información posible:
   - Marca (Brand): Toyota, Ford, Honda, etc. (null si no estás 90% seguro)
   - Modelo (Model): Corolla, F-150, Civic, etc. (null si no estás 90% seguro)
   - Año (Year): Estimado o exacto si es visible (ej: "2020" o "2018-2022")
   - Color: Color predominante del vehículo
   - Tipo: Sedan, SUV, Pickup, Motocicleta, Camión, etc.
   - Categoría: "automovil", "motocicleta", "comercial", "industrial", "transporte", "especial"

═══ EJEMPLOS DE RECHAZO ═══
- Imagen de una planta → "Esta imagen muestra una planta, no un vehículo."
- Foto de una persona → "Esta imagen contiene personas, no vehículos."
- Meme o captura → "No se aceptan memes ni capturas de pantalla."
- Imagen borrosa → "La imagen es muy borrosa para identificar el vehículo."

RESPONDE ÚNICAMENTE CON ESTE JSON (SIN MARKDOWN NI EXPLICACIONES):
{
  "valid": boolean,
  "reason": "Razón específica y profesional si valid=false (en Español)",
  "category": "automovil" | "motocicleta" | "comercial" | "industrial" | "transporte" | "especial" | null,
  "details": {
    "brand": "string" | null,
    "model": "string" | null,
    "year": "string" | null,
    "color": "string" | null,
    "type": "string" | null
  }
}
`;
  }

  try {
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: "image/jpeg",
      },
    };

    const result = await geminiModel.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    console.log("🤖 Respuesta Raw Gemini:", text);

    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON found");
    const jsonString = text.substring(firstBrace, lastBrace + 1);

    try {
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.error("❌ Error parseando JSON de Gemini:", parseError, "Texto recibido:", text);
      return { valid: true };
    }

  } catch (error) {
    console.error("❌ Error CRÍTICO en análisis de imagen:", error);
    return { valid: true };
  }
}

/**
 * Analiza MÚLTIPLES imágenes para obtener datos consolidados
 * @param images Array de imágenes en base64
 * @param type Tipo de publicación ('VEHICLE' | 'BUSINESS')
 * @returns Análisis consolidado
 */
export async function analyzeMultipleImages(images: string[], type: 'VEHICLE' | 'BUSINESS' = 'VEHICLE'): Promise<ImageAnalysisResult> {
  console.log(`🤖 [GEMINI 1.5 FLASH] Analizando ${images.length} imágenes (${type}) - MODO INTELIGENTE ACTIVADO`);

  const vehiclePrompt = `
🚨 MODERADOR DE CONTENIDO AUTOMOTRIZ - MODO ESTRICTO 🚨
Tu trabajo es clasificar CADA IMAGEN individualmente como "VALID" (Vehículo/Parte) o "INVALID" (Cualquier otra cosa).

🛑 REGLAS DE RECHAZO (INVALID):
- Naturaleza: plantas, árboles, flores, pasto, paisajes sin coches.
- Seres vivos: personas, mascotas, animales.
- Objetos no relacionados: comida, muebles, memes, texto, dibujos.

✅ REGLAS DE ACEPTACIÓN (VALID):
- Vehículos terrestres motorizados (autos, motos, camiones, maquinas).
- Partes de vehículos (motor, interior, llantas).
`;

  const businessPrompt = `
🚨 MODERADOR DE CONTENIDO COMERCIAL - MODO FLEXIBLE 🚨
Tu trabajo es clasificar CADA IMAGEN individualmente como "VALID" o "INVALID".

✅ PERMITIDO (VALID):
- Logos, Fachadas, Tarjetas de presentación, Flyers publicitarios.
- Personas trabajando (mecánicos, staff), Clientes.
- Herramientas, Talleres, Instalaciones.
- Memes de marketing o humor apto para todo público.
- Vehículos.

🛑 PROHIBIDO (INVALID):
- Contenido sexual explícito o poses lascivas.
- Violencia extrema, sangre o armas en contexto violento.
- Drogas ilegales o parafernalia.
- Discurso de odio o símbolos prohibidos.
`;

  const prompt = `
${type === 'BUSINESS' ? businessPrompt : vehiclePrompt}

INSTRUCCIONES:
1. Analiza cada imagen recibida (orden 0, 1, 2...).
2. Genera un JSON con un array "analysis" que contenga el resultado para CADA imagen.
3. Si la imagen es válida, extrae sus detalles.

FORMATO DE RESPUESTA REQUERIDO:
{
  "analysis": [
    { "index": 0, "isValid": true, "category": "automovil" },
    { "index": 1, "isValid": false, "reason": "Razón breve" }
  ],
  "globalDetails": {
    "brand": "Toyota",
    "model": "Corolla", 
    "year": "2020",
    "color": "Rojo",
    "transmission": "Automática",
    "fuel": "Gasolina",
    "features": ["Quemacocos", "Rines"]
  }
}
`;

  try {
    const imageParts = images.map(img => ({
      inlineData: {
        data: img,
        mimeType: "image/jpeg",
      },
    }));

    const result = await geminiModel.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    console.log("🤖 Respuesta Raw Gemini (Clasificación):", text);

    // 🛡️ ROBUST JSON EXTRACTION
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("No JSON found in response");
    }

    const jsonString = text.substring(firstBrace, lastBrace + 1);
    const parsed = JSON.parse(jsonString);

    // Mapear al formato que espera el frontend
    const analysis = Array.isArray(parsed.analysis) ? parsed.analysis : [];

    // 🛡️ TYPE SAFETY: Asegurar que invalidIndices son números
    // La IA a veces devuelve "index": "1" (string) y esto rompe el filtro estricto
    const invalidIndices = analysis
      .filter((item: any) => item.isValid === false || item.isValid === "false")
      .map((item: any) => Number(item.index))
      .filter((idx: number) => !isNaN(idx));

    // Verificar si queda alguna válida
    const validCount = analysis.filter((item: any) => item.isValid === true || item.isValid === "true").length;

    return {
      valid: validCount > 0,
      invalidIndices: invalidIndices,
      // Usar los detalles globales extraídos de las fotos válidas
      details: parsed.globalDetails || {},
      category: analysis.find((a: any) => a.isValid)?.category || 'automovil'
    };

  } catch (error) {
    console.error("❌ Error CRÍTICO en análisis multi-foto:", error);
    // Fallback: Si todo falla, no bloqueamos pero no devolvemos indices invalidos
    return { valid: true, invalidIndices: [] };
  }
}
