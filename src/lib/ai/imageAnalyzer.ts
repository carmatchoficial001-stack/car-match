
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
    // 🚗 STRICT VALIDATION FOR VEHICLES (Ultra-Strict Version)
    prompt = `
ERES UN INSPECTOR DE SEGURIDAD ELITE PARA CARMATCH.
TU MISIÓN: Asegurar que NADA que no sea un vehículo terrestre motorizado real entre a la plataforma.

⚠️ TOLERANCIA CERO: Si existe la más mínima duda de que la imagen NO es un vehículo real, REBORDA Y RECHAZA.

═══ CRITERIOS DE RECHAZO ABSOLUTO (INVALID) ═══
🚫 RECHAZA INMEDIATAMENTE SI VES:
- 📺 PANTALLAS: Fotos de televisores, computadoras, celulares o monitores mostrando un coche.
- 📱 CAPTURAS: Screenshots de Facebook Marketplace, Instagram, sitios web o apps. Se nota por bordes negros, iconos de interfaz o texto superpuesto.
- 🧸 JUGUETES/MODELISMO: Coches a escala, Hot Wheels, maquetas, figuras de colección. Se nota por el fondo, la textura o la iluminación.
- 🎨 ARTE/GCI: Renders 3D, dibujos, bocetos, arte generado por IA o ilustraciones.
- 👥 PERSONAS/VIDA: Caras visibles en primer plano, personas posando, animales, mascotas.
- 🏠 HOGAR/CALLE: Muebles, comida, ropa, paisajes sin un vehículo como protagonista.
- 🚲 NO MOTORIZADOS: Bicicletas comunes, patines, patinetas, carretones de caballos.

═══ CRITERIOS DE APROBACIÓN (VALID) ═══
✅ SOLO ACEPTA:
- Vehículos reales (Autos, Motos, Camiones, Tractores, Maquinaria) en su entorno real (calle, cochera, taller).
- Partes mecánicas reales y claras (Motor, Transmisión, Rines con llantas reales).

═══ REGLA DE PORTADA (IMAGEN 0) ═══
- La portada DEBE mostrar el vehículo COMPLETO. Si solo es un volante, una llanta o el tablero, ES INVÁLIDA como portada (aunque sea válida como foto secundaria).

RESPONDE ÚNICAMENTE CON ESTE JSON:
{
  "valid": boolean,
  "reason": "Explicación breve de por qué fue rechazado (en Español)",
  "category": "automovil" | "motocicleta" | "comercial" | "industrial" | "transporte" | "especial" | null,
  "details": {
    "brand": "Marca identificada",
    "model": "Modelo identificado",
    "year": "Año estimado",
    "color": "Color dominante",
    "type": "SUV|Sedan|Pickup|Hatchback|etc"
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
  console.log(`🤖 [GEMINI 1.5 FLASH] Analizando ${images.length} imágenes (${type}) - MODO INTELIGENTE ACTIVADO`);

  // 🔥 PASO 1: VALIDACIÓN ESPECIAL DE PORTADA (Solo para VEHÍCULOS)
  if (type === 'VEHICLE' && images.length > 0) {
    console.log('🔍 [PASO 1] Validando foto de PORTADA...');

    const coverPrompt = `
🚨 VALIDACIÓN DE SEGURIDAD EXTREMA: FOTO DE PORTADA 🚨

ERES UN JUEZ IMPLACABLE. Tu misión es evitar que CUALQUIER imagen que no sea un vehículo real aparezca en el feed principal.

✅ APROBAR (SÓLO vehículos reales):
- Vista exterior COMPLETA o predominante del vehículo.
- Debe verse real, en 3 o 4 dimensiones, con luces, sombras y entorno natural.
- El vehículo debe ser el 60% o más de la imagen.

🚫 RECHAZAR (INVALIDACIÓN AUTOMÁTICA):
- PANTALLAS: Fotos tomadas a monitores, TVs o celulares.
- CAPTURAS: Capturas de pantalla de otras apps o redes sociales.
- JUGUETES: Modelismo, juguetes a escala, Hot Wheels (se nota por el brillo plástico y el entorno desproporcionado).
- INTERIORES SOLOS: Solo el volante, solo el asiento, solo la palanca.
- PARTES SOLAS: Solo el motor (aunque sea real), solo una llanta. Para portada queremos el CARRO completo.
- NO VEHÍCULOS: Comida, personas, paisajes, memes, texto, dibujos.

⚠️ REGLA DE ORO: Si no pondrías este vehículo en un catálogo de lujo por ser falso o de mala calidad (captura/pantalla), RECHAZA.

RESPONDE ÚNICAMENTE ESTE JSON:
{
  "isValidCover": true/false,
  "reason": "Explicación técnica del porqué (en Español)",
  "isToy": true/false,
  "isScreenCapture": true/false
}
`;

    try {
      const coverImagePart = {
        inlineData: {
          data: images[0],
          mimeType: "image/jpeg",
        },
      };

      const coverResult = await geminiModel.generateContent([coverPrompt, coverImagePart]);
      const coverResponse = await coverResult.response;
      const coverText = coverResponse.text();

      console.log("🖼️ Respuesta Validación Portada:", coverText);

      const firstBrace = coverText.indexOf('{');
      const lastBrace = coverText.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace !== -1) {
        const jsonString = coverText.substring(firstBrace, lastBrace + 1);
        const coverAnalysis = JSON.parse(jsonString);

        // Si la portada no es válida, rechazar inmediatamente
        if (coverAnalysis.isValidCover === false) {
          console.log('❌ PORTADA RECHAZADA:', coverAnalysis.reason);

          let specificReason = coverAnalysis.reason;
          if (coverAnalysis.isToy) {
            specificReason = "Esta imagen parece un juguete. En la foto de portada debes poner el vehículo real que vas a vender.";
          } else if (coverAnalysis.isScreenCapture) {
            specificReason = "Las capturas de pantalla no están permitidas. Por favor, sube una foto original de tu vehículo.";
          }

          return {
            valid: false,
            reason: specificReason || 'La foto de portada debe mostrar el vehículo real por seguridad.',
            invalidIndices: [0]
          };
        }
        console.log('✅ Portada aprobada, continuando con el resto...');
      }
    } catch (error) {
      console.error('⚠️ Error validando portada, continuando...', error);
    }
  }

  // 🔥 PASO 2: VALIDACIÓN DE TODAS LAS IMÁGENES (Vehículos válidos)
  const vehiclePrompt = `
🚨 MODERADOR DE CONTENIDO AUTOMOTRIZ - MODO ESTRICTO 🚨
Tu trabajo es clasificar CADA IMAGEN individualmente como "VALID" (Vehículo/Parte) o "INVALID" (Cualquier otra cosa).

🛑 REGLAS DE RECHAZO (INVALID):
- Naturaleza: plantas, árboles, flores, pasto, paisajes sin coches.
- Seres vivos: personas, mascotas, animales.
- Objetos no relacionados: juguetes, miniaturas, comida, muebles, memes, texto, dibujos.
- Contenido inapropiado: sexual, violencia, drogas.

✅ REGLAS DE ACEPTACIÓN (VALID):
- Vehículos terrestres motorizados (autos, motos, camiones, tractores, maquinaria).
- Partes de vehículos: motor, interior completo, llantas, chasis, transmisión.
- Detalles del vehículo: tablero, asientos, maletero, rines.
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
    { "index": 1, "isValid": false, "reason": "La foto de portada debe mostrar el vehículo real que deseas vender" }
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
    let invalidIndices = analysis
      .filter((item: any) => item.isValid === false || item.isValid === "false")
      .map((item: any) => Number(item.index))
      .filter((idx: number) => !isNaN(idx));

    // Verificar si queda alguna válida
    const validCount = analysis.filter((item: any) => item.isValid === true || item.isValid === "true").length;

    // 🔥 PASO 3: VALIDACIÓN DE COHERENCIA (Solo para VEHÍCULOS con 2+ fotos válidas)
    if (type === 'VEHICLE' && validCount >= 2) {
      console.log('🔍 [PASO 3] Validando COHERENCIA entre fotos...');

      const coherencePrompt = `
🔍 VERIFICACIÓN DE COHERENCIA - MISMO VEHÍCULO

Has recibido varias fotos de una publicación. La Imagen 0 es la portada.
Tu trabajo es identificar cuáles de las siguientes fotos (1 en adelante) NO corresponden al MISMO VEHÍCULO que aparece en la Imagen 0.

✅ VÁLIDO:
- El mismo vehículo desde otro ángulo.
- Detalles del mismo vehículo (motor, interior, rines, logo).
- El mismo color, modelo y características.

❌ INVÁLIDO (MARCAR ÍNDICE):
- Un vehículo de diferente marca, modelo o color.
- Un vehículo con placas o detalles que indiquen claramente que es otro ejemplar.

RESPONDE ÚNICAMENTE ESTE JSON:
{
  "isSameVehicle": true/false (solo false si hay intrusos),
  "differentVehicleIndices": [índices de fotos que NO son el mismo vehículo],
  "reason": "Explicación breve"
}
`;

      try {
        const coherenceResult = await geminiModel.generateContent([coherencePrompt, ...imageParts]);
        const coherenceResponse = await coherenceResult.response;
        const coherenceText = coherenceResponse.text();

        console.log("🔍 Respuesta Coherencia:", coherenceText);

        const cohFirstBrace = coherenceText.indexOf('{');
        const cohLastBrace = coherenceText.lastIndexOf('}');

        if (cohFirstBrace !== -1 && cohLastBrace !== -1) {
          const cohJsonString = coherenceText.substring(cohFirstBrace, cohLastBrace + 1);
          const coherenceAnalysis = JSON.parse(cohJsonString);

          // Si hay vehículos diferentes, agregamos esos índices a invalidIndices
          if (coherenceAnalysis.isSameVehicle === false && Array.isArray(coherenceAnalysis.differentVehicleIndices)) {
            console.log('⚠️ Fotos de diferentes vehículos detectadas en índices:', coherenceAnalysis.differentVehicleIndices);

            // Añadir los índices detectados a la lista de inválidos
            coherenceAnalysis.differentVehicleIndices.forEach((idx: number) => {
              if (!invalidIndices.includes(idx)) {
                invalidIndices.push(idx);
              }
            });
          }
        }
      } catch (error) {
        console.error('⚠️ Error validando coherencia, continuando...', error);
      }
    }

    return {
      valid: validCount > 0 && !invalidIndices.includes(0), // Válido si hay alguna y la portada es válida
      invalidIndices: invalidIndices.sort((a: number, b: number) => a - b),
      details: parsed.globalDetails || {},
      category: analysis.find((a: any) => a.isValid)?.category || 'automovil'
    };

  } catch (error) {
    console.error("❌ Error CRÍTICO en análisis multi-foto:", error);
    return {
      valid: false,
      reason: "No pudimos validar la galería. Asegúrate de que la foto de portada sea del vehículo real que deseas vender y no una captura de pantalla o juguete.",
      invalidIndices: []
    };
  }
}
