
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

       📋 DATOS PROPORCIONADOS POR USUARIO (SOLO REFERENCIA):
       - Marca: "${context?.brand || '?'}"
       - Modelo: "${context?.model || '?'}"
       - Año: "${context?.year || '?'}"
       
       ⚠️ REGLA DE ORO: LA IMAGEN ES LA VERDAD ABSOLUTA.
       - Si la foto muestra un vehículo real, APRUÉBALO (isValid: true).
       - IGNORA si la marca/modelo del texto no coinciden con la foto. (Ej: Texto dice "Abarth" pero foto es "Hyundai" -> APROBAR y corregir en "details").
       - SOLO RECHAZA si NO es un vehículo o es contenido inseguro.

       🔍 VALIDACIÓN DE GALERÍA (COHERENCIA):
       - Imagen 0 (Portada) define el vehículo.
       - Imágenes 1..N deben ser del MISMO vehículo (mismo color/modelo).
       - Si una imagen de galería es de OTRO carro diferente al de la portada -> MARCAR COMO INVÁLIDA (isValid: false).

       🚫 MOTIVOS DE RECHAZO:
       - No es un vehículo (Paisajes vacíos, comida, selfies, mascotas).
       - Juguetes, maquetas, capturas de pantalla, fotos a monitores.
       - NSFW, Gore, Violencia.

       Responde ÚNICAMENTE este JSON (sin markdown):
       {
         "isValidCover": boolean,
         "coverReason": "Razón breve si es false",
         "analysis": [
           { "index": number, "isValid": boolean, "reason": "Razón si es false" }
         ],
         "details": {
           "brand": "Marca EXACTA que ves", 
           "model": "Modelo EXACTO que ves", 
           "year": "Año estimado", 
           "color": "Color", 
           "type": "SUV|Sedan|Pickup|Coupe|Hatchback|Van|Moto|Camion"
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
    const imageParts = images.map(img => ({
      inlineData: { data: img, mimeType: "image/jpeg" }
    }));

    // Fix: Analizar hasta 10 imágenes (Portada + 9 Galería)
    const imagesToAnalyze = imageParts.slice(0, 10);

    const result = await geminiModel.generateContent([prompt, ...imagesToAnalyze]);
    const response = await result.response;

    if (response.promptFeedback?.blockReason) {
      return {
        valid: false,
        reason: "Bloqueado por seguridad.",
        invalidIndices: [0]
      };
    }

    const text = response.text();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found");

    const parsed = JSON.parse(match[0]);

    const invalidIndices = (parsed.analysis || [])
      .filter((a: any) => a.isValid === false)
      .map((a: any) => Number(a.index));

    return {
      valid: parsed.isValidCover === true,
      reason: parsed.coverReason,
      invalidIndices: invalidIndices,
      details: parsed.details || {},
      category: 'automovil'
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
      reason: "No pudimos verificar tu imagen. Por favor, intenta nuevamente.",
      invalidIndices: [0]
    };
  }
}
