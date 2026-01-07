
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

RESPONDE ÚNICAMENTE CON ESTE JSON:
{
  "valid": boolean,
  "reason": "Explicación breve (en Español)",
  "category": "automovil" | "motocicleta" | "comercial" | "industrial" | "transporte" | "especial" | null,
  "details": {
    "brand": "Marca",
    "model": "Modelo",
    "year": "Año",
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
export async function analyzeMultipleImages(images: string[], type: 'VEHICLE' | 'BUSINESS' = 'VEHICLE'): Promise<ImageAnalysisResult> {
  console.log(`🤖 AI Multi-Moderación: Analizando ${images.length} imágenes...`);

  const prompt = type === 'VEHICLE'
    ? `ERES UN MODERADOR AUTOMOTRIZ. Recibes un set de fotos (0 es PORTADA, 1-9 son GALERÍA).

       REGLAS PARA IMAGEN 0 (PORTADA):
       - DEBE ser un vehículo o parte real. 
       - Si es basura/NSFW/violencia/juguete, marca isValid: false.
       - Esta imagen es OBLIGATORIA.

       REGLAS PARA IMÁGENES 1-9 (GALERÍA):
       - Sé más relajado. Si ves basura, simplemente márcala como isValid: false. 
       - No bloquees el proceso por estas fotos, solo identifícalas para filtrarlas.

       SEGURIDAD (APLICA A TODAS):
       - Rechaza (isValid: false): Desnudez, violencia, odio, juguetes.

       Responde JSON: {
         "isValidCover": boolean, 
         "coverReason": "Solo si es inválida",
         "analysis": [
           { "index": number, "isValid": boolean }
         ],
         "details": { "brand": "Marca", "model": "Modelo", "year": "Año", "color": "Color", "type": "SUV|Sedan|etc" },
         "category": "automovil"
       }`
    : `MODERADOR COMERCIAL. Aprueba todo lo SFW. Responde JSON simple.`;

  try {
    const imageParts = images.map(img => ({
      inlineData: { data: img, mimeType: "image/jpeg" }
    }));

    // Enviamos todas las imágenes
    const result = await geminiModel.generateContent([prompt, ...imageParts]);
    const response = await result.response;

    if (response.promptFeedback?.blockReason) {
      return { valid: false, reason: "Bloqueado por seguridad de Google.", invalidIndices: [0] };
    }

    const text = response.text();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found");

    const parsed = JSON.parse(match[0]);
    const invalidIndices = (parsed.analysis || [])
      .filter((a: any) => a.isValid === false)
      .map((a: any) => Number(a.index));

    return {
      // Solo es inválido si la portada falla
      valid: parsed.isValidCover || !invalidIndices.includes(0),
      reason: parsed.coverReason || (invalidIndices.includes(0) ? "La foto de portada no es válida." : ""),
      invalidIndices: invalidIndices,
      details: parsed.details || {},
      category: parsed.category || 'automovil'
    };

  } catch (error: any) {
    console.error("❌ AI Multi-Error:", error.message);

    if (!error.message?.includes('SAFETY') && !error.message?.includes('blocked')) {
      return { valid: true, reason: "", invalidIndices: [], details: {}, category: 'automovil' };
    }

    return { valid: false, reason: "Error de seguridad en el análisis.", invalidIndices: [0] };
  }
}
