
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
    "type": "SUV|Sedan|Pickup|etc",
    "transmission": "Manual|Automática",
    "fuel": "Gasolina|Diésel|Eléctrico|Híbrido",
    "engine": "Especificación (ej: 2.7L V6)",
    "traction": "FWD|RWD|4x4|AWD",
    "doors": 2|3|4|5,
    "condition": "Nuevo|Seminuevo|Usado"
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
    ? `ERES UN EXPERTO ANALISTA TÉCNICO DE VEHÍCULOS PARA CARMATCH.
       TU ÚNICO OBJETIVO: Evitar fraudes y asegurar que todas las fotos correspondan AL MISMO vehículo.

       📋 DATOS DEL USUARIO (COMO REFERENCIA SOLAMENTE):
       - Marca: "${context?.brand || '?'}", Modelo: "${context?.model || '?'}", Año: "${context?.year || '?'}"
       
       🚀 REGLAS MAESTRAS DE CARMATCH (TOLERANCIA CERO):
       1. LA PORTADA (@Index 0) ES LA VERDAD ABSOLUTA: Identifica Marca, Modelo, Generación, Color y Tipo basándote ÚNICAMENTE en la foto 0. 
       2. FILTRADO POR MARCA Y ESTILO: Si la portada muestra un SUV Hyundai, y otra foto muestra un Jeep o un Sedán Toyota, ¡ESA OTRA FOTO ES UN FRAUDE!
       3. CONSISTENCIA OBLIGATORIA (0 vs 1-6): Compara cada foto del resto de la galería con la Portada (0).
          - SI la foto es de un vehículo DIFERENTE (otra marca, otro modelo, o estilo incompatible), DEBES poner "isValid": false y "reason": "Vehículo diferente al de la portada".
          - SI la foto es del MISMO vehículo pero de otro ángulo, motor, rines o interior, es "isValid": true.
       4. CONSOLIDACIÓN DE DATOS: Extrae los detalles técnicos (cilindraje, transmisión, combustible) de TODAS las fotos válidas, pero NUNCA mezcles datos de una foto que marcaste como inválida.
       5. PRIORIDAD VISUAL: Si la foto 0 es un carro real pero no coincide con lo que el usuario escribió, la foto 0 MANDA. Tú corriges al usuario.

       Responde ÚNICAMENTE este JSON (sin markdown y sin texto extra):
       {
         "isValidCover": boolean,
         "coverReason": "OK" o razón del rechazo,
         "analysis": [
           { "index": number, "isValid": boolean, "reason": "OK" o "Vehículo diferente (Ej: es un Jeep y la portada es Hyundai)" }
         ],
         "details": {
            "brand": "Marca (Basada en Foto 0)",
            "model": "Modelo (Basado en Foto 0)",
            "year": "Año estimado (Basado en Foto 0)",
            "color": "Color predominante",
            "type": "SUV|Sedan|Pickup|Coupe|Hatchback|Van|Moto|Camion",
            "transmission": "Manual|Automática",
            "fuel": "Gasolina|Diésel|Eléctrico|Híbrido",
            "engine": "Especificación (ej: 2.7L V6)",
            "hp": 200,
            "torque": "250 lb-ft",
            "aspiration": "Natural|Turbo|Twin-Turbo|Supercharged",
            "cylinders": 6,
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
      const sovereignContext = {
        brand: coverResult.details?.brand,
        model: coverResult.details?.model,
        year: coverResult.details?.year
      };

      const galleryImages = images.slice(1, 6); // Límite de seguridad
      const galleryPrompt = `
        ERES UN MODERADOR DE CONSISTENCIA PARA CARMATCH.
        TU TRABAJO: Comparar la galería con el VEHÍCULO SOBERANO (la portada).

        🚗 VEHÍCULO SOBERANO (PORTADA):
        - Marca: "${sovereignContext.brand || '?'}", Modelo: "${sovereignContext.model || '?'}", Año: "${sovereignContext.year || '?'}"

        📋 REGLAS:
        - Cada imagen de la galería DEBE ser del MISMO vehículo.
        - Se aceptan ángulos diferentes, rines, motor, interior.
        - RECHAZA (isValid: false) si ves un vehículo de OTRA marca o modelo diferente.
        - RECHAZA si la imagen es borrosa, ofensiva o no es un vehículo.

        Responde con este JSON:
        {
          "analysis": [
            { "index": number, "isValid": boolean, "reason": "OK" o razón }
          ],
          "details": {
             "transmission": "Manual|Automática",
             "fuel": "Gasolina|Diésel|Eléctrico|Híbrido",
             "engine": "Ej: 2.0L Turbo",
             "hp": 150,
             "traction": "FWD|RWD|4x4|AWD",
             "doors": 5
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
          index: a.index + 1 // Ajustar índice porque slice comenzó en 1
        }));

        const invalidIndices = galleryAnalysis
          .filter((a: any) => a.isValid === false)
          .map((a: any) => a.index);

        // Combinar detalles (Portada manda, Galería complementa técnica)
        return {
          valid: true,
          reason: "OK",
          invalidIndices: invalidIndices,
          details: {
            ...coverResult.details,
            ...galleryParsed.details,
            // Aseguramos que marca/modelo/año NO cambien por la galería
            brand: coverResult.details?.brand,
            model: coverResult.details?.model,
            year: coverResult.details?.year
          },
          category: coverResult.category
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
