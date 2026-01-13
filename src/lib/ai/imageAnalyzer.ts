
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
  analysis?: { index: number; isValid: boolean; reason: string }[];
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
═══ REGLAS DE RECHAZO (TOLERANCIA CERO) ═══
- NO ES UN VEHÍCULO (Ej: TVs, muebles, pantallas, artículos del hogar, personas solas). RECHAZO INMEDIATO.
- ES UN JUGUETE O DIBUJO. RECHAZO INMEDIATO.
- CONTENIDO INSEGURO (Desnudez, armas, violencia). RECHAZO INMEDIATO.

═══ PROTOCOLO DE ANÁLISIS (PASO A PASO) ═══
1. OLVIDA EL TEXTO: Ignora cualquier marca o modelo dado por el usuario.
2. ESCANEO VISUAL: Identifica silueta, parrilla, faros y logotipos.
3. IDENTIFICACIÓN PURA: Determina qué vehículo es basándote *solo* en la imagen.
4. COMPARACIÓN CRÍTICA: Si el contexto dice "Hyundai" pero ves un "Jeep Wrangler", reporte JEEP WRANGLER.

RESPONDE ÚNICAMENTE CON ESTE JSON:
{
  "valid": boolean (false si es un artículo del hogar como una TV),
  "reason": "OK o razón de rechazo (Ej: 'Contenido no es un vehículo (TV)')",
  "category": "automovil" | "motocicleta" | "comercial" | "industrial" | "transporte" | "especial",
  "details": {
    "brand": "Marca REAL identificada visualmente",
    "model": "Modelo REAL identificado visualmente",
    "year": "Año o generación",
    "color": "Color",
    "type": "SUV|Sedan|Pickup|Coupe|Hatchback|Van|Moto|Camion",
    "transmission": "Manual|Automática",
    "fuel": "Gasolina|Diésel|Eléctrico|Híbrido",
    "engine": "Especificación motor (ej: 2.0L Turbo)",
    "displacement": "Cilindrada (ej: 2400cc o 2.4L)",
    "traction": "FWD|RWD|4x4|AWD",
    "doors": 2|3|4|5,
    "passengers": 2|5|7|9,
    "hp": "Potencia (CV/HP)",
    "torque": "Torque (lb-ft o Nm)",
    "aspiration": "Natural|Turbo|Twin-Turbo|Supercharged",
    "cylinders": 3|4|5|6|8|10|12,
    "batteryCapacity": "Capacidad kWh (si es eléctrico)",
    "range": "Autonomía km (si es eléctrico/híbrido)",
    "weight": "Peso aproximado (kg)",
    "axles": "Ejes (si es pesado)",
    "cargoCapacity": "Capacidad de carga kg (si es comercial)",
    "operatingHours": "Horas de uso (si es maquinaria)",
    "condition": "Nuevo|Usado"
  }
}

IMPORTANTE: Investiga a fondo. Una vez identificado el vehículo en la portada, utiliza tu CONOCIMIENTO GENERAL TÉCNICO para llenar TODO el JSON. Si un dato es auténticamente desconocido o incierto para ese modelo específico, responde null. NO INVENTES si no hay base técnica, pero sé lo más completo posible. PROHIBIDO usar "N/A".
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
    ? `ERES UN ANALISTA FORENSE TÉCNICO DE VEHÍCULOS.
       TU MISIÓN: Descubrir fraudes. El usuario puede intentar engañarte con el texto, pero la imagen es la única verdad.

       📋 DATOS DEL USUARIO (POSIBLEMENTE FALSOS O ERRÓNEOS):
       - Marca: "${context?.brand || '?'}", Modelo: "${context?.model || '?'}", Año: "${context?.year || '?'}"
       
       🚀 PROTOCOLO DE AUDITORÍA VISUAL:
       1. VISIÓN SOBERANA (@Index 0): Identifica el vehículo basándote *solo* en su silueta, parrilla, faros y logos.
       2. SI VES UN JEEP PERO EL TEXTO DICE "${context?.brand || '?'}", TU RESPUESTA DEBE SER JEEP. No alucines con el texto del usuario.
       3. CONSISTENCIA: Todas las fotos deben ser del mismo vehículo que la portada.
       4. CORRECCIÓN AGRESIVA: Si el usuario escribió mal el modelo, tú pones el modelo CORRECTO basado en lo que ves.

       Responde ÚNICAMENTE este JSON:
       {
         "isValidCover": boolean,
         "coverReason": "OK" o razón del rechazo,
         "analysis": [
           { "index": number, "isValid": boolean, "reason": "OK" o "Vehículo diferente" }
         ],
         "details": {
            "brand": "Marca REAL identificada",
            "model": "Modelo REAL identificado",
            "year": "Año/Generación REAL",
            "color": "Color predominante",
            "type": "SUV|Sedan|Pickup|Coupe|Hatchback|Van|Moto|Camion",
            "transmission": "Manual|Automática",
            "fuel": "Gasolina|Diésel|Eléctrico|Híbrido",
            "engine": "Ej: 2.0L Turbo",
            "traction": "FWD|RWD|4x4|AWD",
            "doors": 5,
            "passengers": 5
         }
       }
       
       IMPORTANTE: Si un dato técnico no es visible o es incierto, usa null. PROHIBIDO usar "N/A".`
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

  let lastError: any;
  const maxRetries = 2;

  // 🚀 REGLA RUBEN: PARA VEHÍCULOS, LA PORTADA SE ANALIZA PRIMERO Y MANDA
  if (type === 'VEHICLE' && images.length > 0) {
    console.log("🛡️ Seguridad CarMatch: Aplicando análisis secuencial (Portada Primero)");

    try {
      // 1. ANALIZAR PORTADA (Index 0)
      const coverResult = await analyzeImage(images[0], 'VEHICLE');

      if (!coverResult.valid) {
        return {
          valid: false,
          reason: coverResult.reason || "La foto de portada no es válida.",
          invalidIndices: [0],
          details: coverResult.details
        };
      }

      // Si solo hay una imagen, terminamos aquí
      if (images.length === 1) {
        return coverResult;
      }

      // 2. ANALIZAR GALERÍA (Contexto de Portada)
      // La portada es la ÚNICA fuente de verdad para la identidad (Marca/Modelo/Año).
      // La galería solo sirve para confirmar que es el mismo coche y extraer datos técnicos.
      const IDENTIDAD_SOBERANA_DE_PORTADA = {
        brand: coverResult.details?.brand,
        model: coverResult.details?.model,
        year: coverResult.details?.year,
        type: coverResult.details?.type
      };

      const galleryImages = images.slice(1, 11); // Analizar hasta 10 fotos en total (1 portada + 9 galería)
      const galleryPrompt = `
        ERES UN AUDITOR DE CONSISTENCIA VISUAL PARA CARMATCH.
        TU MISIÓN: Validar que cada foto de la galería sea EXACTAMENTE el mismo vehículo que la portada.

        🚗 VEHÍCULO SOBERANO (IDENTIDAD CREADA EN PORTADA):
        - Marca: "${IDENTIDAD_SOBERANA_DE_PORTADA.brand || '?'}"
        - Modelo: "${IDENTIDAD_SOBERANA_DE_PORTADA.model || '?'}"
        - Estilo: "${IDENTIDAD_SOBERANA_DE_PORTADA.type || '?'}"

        📋 REGLAS DE AUDITORÍA (TOLERANCIA CERO):
        - LA PORTADA MANDANTE: La identidad de arriba es la ÚNICA válida para este anuncio.
        - CUALQUIER IMAGEN QUE NO SEA EL MISMO VEHÍCULO MENCIONADO EN LA PORTADA DEBE SER MARCADA AS "isValid": false.
        - RECHAZA CONTENIDO NO FOTOGRÁFICO: Si ves dibujos, bocetos, memes o arte digital, "isValid": false.
        - RECHAZA CONTENIDO NO VEHICULAR: Si ves animales, personas solas, o captura de menús/apps, "isValid": false.
        - IMPORTANTE: Si la foto es un vehículo pero es DIFERENTE al de la portada (ej: la portada es Tahoe y ves un Hyundai), MARCA "isValid": false para esa foto de la galería. 
        - LA PORTADA NUNCA ES INVÁLIDA POR CULPA DE LA GALERÍA. SIEMPRE PREVALECE LA PORTADA.

        Responde con este JSON:
        {
          "analysis": [
            { "index": number, "isValid": boolean, "reason": "OK" o razón }
          ],
          "details": {
             "transmission": "Manual|Automática",
             "fuel": "Gasolina|Diésel|Eléctrico|Híbrido",
             "engine": "Ej: 2.0L Turbo",
             "displacement": "Cilindrada",
             "traction": "FWD|RWD|4x4|AWD",
             "doors": 5,
             "passengers": 5,
             "hp": number,
             "torque": "string",
             "aspiration": "Natural|Turbo|Twin-Turbo|Supercharged",
             "cylinders": number,
             "batteryCapacity": number,
             "range": number,
             "weight": number,
             "axles": number,
             "cargoCapacity": number,
             "operatingHours": number
           }
         }
      `;

      const imageParts = galleryImages.map(img => ({
        inlineData: { data: img, mimeType: "image/jpeg" }
      }));

      const galleryResultRaw = await geminiModel.generateContent([galleryPrompt, ...imageParts]);
      const galleryResponse = await galleryResultRaw.response;
      const galleryText = galleryResponse.text();

      const galleryMatch = galleryText.match(/\{[\s\S]*\}/);
      if (galleryMatch) {
        const galleryParsed = JSON.parse(galleryMatch[0]);
        const galleryAnalysis = (galleryParsed.analysis || []).map((a: any) => ({
          ...a,
          index: a.index + 1
        }));

        const invalidIndices = galleryAnalysis
          .filter((a: any) => a.isValid === false)
          .map((a: any) => a.index);

        // BLINDAJE FINAL: Los detalles de identidad (Marca/Modelo/Año/Tipo) NUNCA vienen de la galería.
        // Solo aceptamos enriquecimiento técnico (motor/transmisión).
        return {
          valid: coverResult.valid, // La validez general depende de la portada
          reason: coverResult.reason || "OK",
          invalidIndices: invalidIndices,
          details: {
            ...coverResult.details, // Identidad Soberana
            ...galleryParsed.details, // Enriquecimiento Técnico
            // Forzamos que la identidad sea la de la portada, sin importar qué dijo la galería
            brand: IDENTIDAD_SOBERANA_DE_PORTADA.brand,
            model: IDENTIDAD_SOBERANA_DE_PORTADA.model,
            year: IDENTIDAD_SOBERANA_DE_PORTADA.year,
            type: IDENTIDAD_SOBERANA_DE_PORTADA.type
          },
          category: coverResult.category,
          analysis: galleryAnalysis
        };
      }

      return coverResult; // Fallback a solo portada si el resto falla

    } catch (error) {
      console.error("❌ Error en análisis secuencial:", error);
      // Si el análisis secuencial falla por algún motivo técnico, intentamos el método tradicional
    }
  }

  // MÉTODO TRADICIONAL (Para Business o Fallback)
  for (let i = 0; i < maxRetries; i++) {
    try {
      // 🚀 OPTIMIZACIÓN CARMATCH: Solo enviamos la portada y el resto de la galería 
      // pero limitamos a 6 fotos para no saturar memoria de Vercel (Payload too large)
      const imagesToAnalyze = images.slice(0, 6);
      const imageParts = imagesToAnalyze.map(img => ({
        inlineData: { data: img, mimeType: "image/jpeg" }
      }));

      const result = await geminiModel.generateContent([prompt, ...imageParts]);
      const response = await result.response;

      return await processGeminiResponse(response); // Moviendo lógica a una función auxiliar para limpieza
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error.message?.includes("429") || error.message?.includes("quota");

      if (isRateLimit && i < maxRetries - 1) {
        const waitTime = 2000 * (i + 1); // Esperar 2 o 4 segundos
        console.warn(`⚠️ Cuota de IA excedida. Reintentando en ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      break;
    }
  }

  // Si llegamos aquí es porque fallaron los reintentos
  console.error("❌ Error definitivo tras reintentos en analyzeMultipleImages:", lastError);

  const isQuota = lastError.message?.includes("429") || lastError.message?.includes("quota");
  return {
    valid: false,
    reason: isQuota
      ? "El sistema de IA está recibiendo muchas solicitudes. Por favor, espera un minuto e intenta subir las fotos de nuevo."
      : `Error del Asesor Real: ${lastError.message || 'El servidor está saturado.'}`,
    invalidIndices: [0]
  };
}

/**
 * Procesa la respuesta de Gemini para extraer el análisis consolidado
 */
async function processGeminiResponse(response: any): Promise<ImageAnalysisResult> {
  if (response.promptFeedback?.blockReason) {
    return { valid: false, reason: "Bloqueado por seguridad.", invalidIndices: [0] };
  }

  const text = response.text();
  console.log("🤖 Respuesta Gemini (Bulk):", text);

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    console.warn("⚠️ No se encontró JSON en respuesta de Gemini:", text);
    throw new Error("No JSON found in AI response");
  }

  const parsed = JSON.parse(match[0]);
  const isValidCover = parsed.isValidCover === true;
  const invalidIndices = (parsed.analysis || [])
    .filter((a: any) => a.isValid === false)
    .map((a: any) => Number(a.index));

  const coverReason = parsed.coverReason || "La foto de portada debe ser un vehículo motorizado terrestre claro.";

  return {
    valid: isValidCover,
    reason: coverReason,
    invalidIndices: invalidIndices,
    details: parsed.details || {},
    category: parsed.details?.type || 'Automóvil'
  };
}
