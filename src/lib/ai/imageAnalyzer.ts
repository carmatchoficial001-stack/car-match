
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
    engine?: string; // Ej: "V6 3.5L"
    hp?: number; // Caballos de fuerza
    torque?: string; // Ej: "350 lb-ft"
    aspiration?: string; // Turbo, Atmosférico, Eléctrico, etc.
    cylinders?: number; // 4, 6, 8, etc.
    traction?: string; // FWD, RWD, 4x4, AWD
    doors?: number;
    passengers?: number;
    batteryCapacity?: number; // kWh (eléctricos)
    range?: number; // km (eléctricos)
    weight?: number; // kg
    axles?: number; // Ejes (camiones)
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
    // 🚗 VALIDATION FOR VEHICLES
    prompt = `
ERES UN MODERADOR INTELIGENTE Y PROTECTOR PARA CARMATCH.
TU MISIÓN: Asegurar que las imágenes sean PARTES/VEHÍCULOS reales y, sobre todo, SEGURAS PARA TODA LA FAMILIA (incluyendo menores).

═══ CRITERIOS DE APROBACIÓN (SFW - SEGURO) ═══
✅ ACEPTA:
- Vehículos reales completos o piezas mecánicas (Motores, chasis, llantas, rines, transmisiones).
- Fotos con texto de venta o capturas de buena calidad.

═══ CRITERIOS DE RECHAZO ABSOLUTO (TOLERANCIA CERO) ═══
🚫 RECHAZA INMEDIATAMENTE:
- 🔞 CONTENIDO ADULTO: Desnudez, poses lascivas o ropa sugerente. La app es para niños y jóvenes también.
- 🩸 VIOLENCIA: Sangre, accidentes reales grotescos, gore o armas.
- 🖕 CONTENIDO OFENSIVO: Odio, racismo o lenguaje vulgar.
- 🧸 JUGUETES o maquetas.
- 📺 FOTOS A PANTALLAS.
- 👥 IRRELEVANTE: Memes, animales, comida o personas como protagonistas.
- 📅 FLEXIBILIDAD TOTAL EN AÑOS: Muchos vehículos permanecen visualmente IDÉNTICOS por periodos de 5 a 10 años (mismas generaciones). No rechaces por error de año si la marca, modelo y generación visual coinciden. Sé muy flexible: el año es informativo, no un criterio de exclusión a menos que sea físicamente imposible (ej: un carro moderno marcado como 1950).

RESPONDE ÚNICAMENTE CON ESTE JSON:
{
  "valid": boolean,
  "reason": "Explicación breve (en Español)",
  "category": "automovil" | "motocicleta" | "comercial" | "industrial" | "transporte" | "especial" | null,
  "details": {
    "brand": "Marca",
    "model": "Modelo",
    "year": "Año estimado",
    "color": "Color",
    "type": "SUV|Sedan|Pickup|etc"
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
      return { valid: false, reason: "Error de validación técnica. Intenta con otra foto." };
    }

  } catch (error) {
    console.error("❌ Error CRÍTICO en análisis de imagen:", error);
    return { valid: false, reason: "El servicio de seguridad no está disponible. Reintenta en un momento." };
  }
}

/**
 * Analiza MÚLTIPLES imágenes para obtener datos consolidados
 * @param images Array de imágenes en base64
 * @param type Tipo de publicación ('VEHICLE' | 'BUSINESS')
 * @returns Análisis consolidado
 */
export async function analyzeMultipleImages(
  images: string[],
  type: 'VEHICLE' | 'BUSINESS' = 'VEHICLE',
  context?: { brand?: string, model?: string, year?: string }
): Promise<ImageAnalysisResult> {
  console.log(`🤖 AI Contextual: Analizando ${images.length} imágenes...`);

  const vehicleContextPrompt = context?.brand
    ? `\nGUÍA DE CONTEXTO: El usuario dice tener un ${context.brand} ${context.model || ''} ${context.year || ''}.
       Usa esto para ayudarte a identificar si es un vehículo real, pero sé FLEXIBLE.
       Si el usuario se equivoca de año o modelo pero sube un carro real, ¡APRUÉBALO! (Puede ser error humano).`
    : '';

  const prompt = type === 'VEHICLE'
    ? `ERES UN EXPERTO ANALISTA DE VEHÍCULOS PARA CARMATCH.
       TU ÚNICO OBJETIVO: Confirmar que las fotos sean de vehículos reales y seguros.

       📋 DATOS DEL USUARIO (REFERENCIA):
       - Marca: "${context?.brand || '?'}", Modelo: "${context?.model || '?'}", Año: "${context?.year || '?'}"
       
       🚀 REGLAS MAESTRAS DE CARMATCH:
       1. PORTADA @Index 0 ES EL LÍDER: Identifica si es un VEHÍCULO MOTORIZADO TERRESTRE real. Su marca/modelo/año/color definen el anuncio.
       2. CONSISTENCIA OBLIGATORIA: Compara todas las fotos 1 al 9 con la Portada (0). 
          - SI una foto es de un vehículo DIFERENTE al de la portada, ¡MÁRCALA COMO INVALIDA! (isValid: false).
          - SI la foto es del MISMO vehículo (aunque sea de otro ángulo, motor o interior), ¡ES VÁLIDA!.
       3. ENRIQUECER FICHA TÉCNICA: Usa las fotos válidas para extraer datos técnicos.
       4. PRIORIDAD VISUAL: Si la portada es un vehículo real pero no coincide con el texto del usuario, ¡ES VÁLIDO! (la imagen manda).

       Responde ÚNICAMENTE este JSON (sin markdown):
       {
         "isValidCover": boolean,
         "coverReason": "Razón si no es vehículo motorizado terrestre",
         "analysis": [
           { "index": number, "isValid": boolean, "reason": "OK o 'Vehículo diferente al de portada'" }
         ],
         "details": {
            "brand": "Marca",
            "model": "Modelo",
            "year": "Año",
            "color": "Color",
            "type": "SUV|Sedan|Pickup|Coupe|Hatchback|Van|Moto|Camion",
            "transmission": "Manual|Automática",
            "fuel": "Gasolina|Diésel|Eléctrico|Híbrido",
            "engine": "Especificación (ej: 2.5L 4cil)",
            "hp": 180,
            "torque": "190 lb-ft",
            "aspiration": "Natural|Turbo|Twin-Turbo|Supercharged",
            "cylinders": 4,
            "traction": "FWD|RWD|4x4|AWD",
            "doors": 5,
            "passengers": 5
         }
       }`
    : `ERES UN MODERADOR DE CONTENIDO PARA PERFILES DE NEGOCIO.
       TU MISIÓN: Permitir libertad creativa total, FILTRANDO SOLO CONTENIDO ILEGAL O PELIGROSO.
       
       ✅ APRUEBA TODO ESTO (Ejemplos):
       - Memes, Logotipos, Carteles.
       - Fotos de personas, selfies, manos, pies.
       - Objetos random (sacapuntas, herramientas, comida).
       - Edificios, calles, mapas.
       - CUALQUIER IMAGEN que no viole las reglas de abajo.

       🚫 SOLO RECHAZA (isValid: false):
       - Pornografía explícita o desnudez total.
       - Violencia extrema, gore, sangre real.
       - Contenido de odio o símbolos terroristas.

       Si es una foto "rara" o "fea" pero segura -> APRUÉBALA.

       Responde ÚNICAMENTE este JSON (sin markdown):
       {
         "isValidCover": boolean,
         "coverReason": "OK" o razón breve de rechazo,
         "analysis": [
           { "index": number, "isValid": boolean, "reason": "OK" }
         ],
         "details": { "category": "negotioc" }
       }`;

  try {
    // 🚀 OPTIMIZACIÓN CARMATCH: Solo enviamos la portada y el resto de la galería 
    // pero limitamos a 6 fotos para no saturar memoria de Vercel (Payload too large)
    const imagesToAnalyze = images.slice(0, 6);
    const imageParts = imagesToAnalyze.map(img => ({
      inlineData: { data: img, mimeType: "image/jpeg" }
    }));

    const result = await geminiModel.generateContent([prompt, ...imageParts]);
    const response = await result.response;

    if (response.promptFeedback?.blockReason) {
      return {
        valid: false,
        reason: "Bloqueado por seguridad.",
        invalidIndices: [0]
      };
    }

    const text = response.text();
    console.log("🤖 Respuesta Gemini (Bulk):", text);

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      console.warn("⚠️ No se encontró JSON en respuesta de Gemini:", text);
      throw new Error("No JSON found");
    }

    const parsed = JSON.parse(match[0]);

    // 🛡️ REGLA RUBEN: La portada manda. Si no es válida o no hay datos, fallamos portada.
    const isValidCover = parsed.isValidCover === true;

    const invalidIndices = (parsed.analysis || [])
      .filter((a: any) => a.isValid === false)
      .map((a: any) => Number(a.index));

    // Si la IA dice que la portada es inválida pero no da razón, ponemos una genérica
    const coverReason = parsed.coverReason || "La foto de portada debe ser un vehículo motorizado terrestre claro.";

    return {
      valid: isValidCover,
      reason: coverReason,
      invalidIndices: invalidIndices,
      details: parsed.details || {},
      category: parsed.details?.type || 'Automóvil'
    };

  } catch (error: any) {
    console.error("❌ Error crítico en validación de imagen:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    if (error.message?.includes('SAFETY') || error.message?.includes('blocked')) {
      return { valid: false, reason: "Contenido bloqueado por seguridad.", invalidIndices: [0] };
    }

    // 🛡️ FAIL-SAFE: Rechazar por defecto si hay error
    // Esto previene que imágenes inválidas pasen cuando la IA falla
    return {
      valid: false,
      reason: `Error del Asesor Real: ${error.message || 'El servidor está saturado. Intenta subir menos fotos o fotos menos pesadas.'}`,
      invalidIndices: [0]
    };
  }
}
