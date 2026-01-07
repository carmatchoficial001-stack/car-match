
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
  console.log(`🤖 [CARMATCH AI] Analizando ${images.length} imágenes (${type})...`);

  const vehiclePrompt = `
ERES UN MODERADOR INTELIGENTE Y PROTECTOR PARA CARMATCH.
Analiza este set de imágenes (0 es la PORTADA, las demás son galería).

═══ REGLAS DE ORO (TOLERANCIA CERO) ═══
- 🔞 NADA DE CONTENIDO ADULTO O DESNUDOS.
- 🩸 NADA DE VIOLENCIA, SANGRE O ARMAS.
- 🖕 NADA DE ODIO O INSULTOS.
- 🧸 NADA DE JUGUETES O MAQUETAS (deben ser vehículos reales).
- 📺 NADA DE FOTOS A OTRAS PANTALLAS (moiré/píxeles).

═══ REGLAS DE APROBACIÓN (FLEXIBLE PARA FIERROS) ═══
- ✅ ACEPTA: Vehículos completos, motores, llantas, chasis, rines, interiores, transmisiones.
- ✅ ACEPTA: Texto superpuesto (precios, números), capturas reales de buena calidad.
- ✅ COHERENCIA: Verifica que todas las fotos correspondan al mismo vehículo o sus partes.

INSTRUCCIONES:
1. Analiza cada imagen.
2. Determina si la PORTADA (índice 0) es un vehículo o parte real y segura.
3. Extrae detalles técnicos del vehículo principal.

RESPONDE ÚNICAMENTE CON ESTE JSON:
{
  "isValidCover": boolean,
  "coverReason": "Por qué es válida o no",
  "analysis": [
    { "index": number, "isValid": boolean, "reason": "Por qué no" }
  ],
  "isSameVehicle": boolean,
  "details": {
    "brand": "Marca", "model": "Modelo", "year": "Año", "color": "Color", "type": "SUV|Sedan|etc"
  },
  "category": "automovil"
}
`;

  const businessPrompt = `
ERES UN MODERADOR COMERCIAL. Filtra solo contenido adulto, violencia o ilegal.
Permite logos, locales, staff trabajando y vehículos.
RESPONDE JSON con structure: {"isValidCover": true, "analysis": [], "details": {}, "category": "negocio"}
`;

  try {
    const imageParts = images.map(img => ({
      inlineData: { data: img, mimeType: "image/jpeg" }
    }));

    const result = await geminiModel.generateContent([
      type === 'VEHICLE' ? vehiclePrompt : businessPrompt,
      ...imageParts
    ]);

    const response = await result.response;

    // 🛡️ Manejo de bloqueos de seguridad de Google
    if (response.promptFeedback?.blockReason) {
      return {
        valid: false,
        reason: "Imagen bloqueada por seguridad. Por favor, sube fotos aptas para todo público (sin violencia ni contenido adulto).",
        invalidIndices: [0]
      };
    }

    const text = response.text();
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1) throw new Error("No JSON found");

    const parsed = JSON.parse(text.substring(firstBrace, lastBrace + 1));

    // Mapear al formato esperado
    const invalidIndices = (parsed.analysis || [])
      .filter((a: any) => !a.isValid)
      .map((a: any) => a.index);

    return {
      valid: parsed.isValidCover && !invalidIndices.includes(0),
      reason: parsed.coverReason,
      invalidIndices: invalidIndices,
      details: parsed.details || {},
      category: parsed.category || 'automovil'
    };

  } catch (error: any) {
    console.error("❌ Error CRÍTICO en validación AI:", error);

    // Detectar si el error es por contenido bloqueado (Safety)
    if (error.message?.includes('SAFETY') || error.message?.includes('blocked')) {
      return {
        valid: false,
        reason: "Tu imagen fue rechazada por filtros de seguridad (contenido adulto o violento). Por favor sube fotos originales de tu vehículo.",
        invalidIndices: [0]
      };
    }

    // Error de cuota (Rate Limit)
    if (error.message?.includes('429')) {
      return {
        valid: false,
        reason: "Estamos recibiendo muchas solicitudes. Por favor, espera un minuto e intenta de nuevo con la foto del vehículo.",
        invalidIndices: []
      };
    }

    return {
      valid: false,
      reason: "No pudimos procesar la validación. Asegúrate de subir fotos reales de tu vehículo y evita capturas borrosas o contenido ajeno.",
      invalidIndices: []
    };
  }
}
