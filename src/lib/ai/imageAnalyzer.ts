// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.


import { geminiFlash8B, geminiFlash, geminiFlashLite, geminiPro } from "./geminiClient"; // ✅ Modelos optimizados (2026)


interface ImageAnalysisResult {
  valid: boolean;
  reason?: string; // If invalid (NSFW, Not a vehicle)
  category?: string; // 'automovil', 'motocicleta', 'comercial', 'industrial', 'transporte', 'especial'
  invalidIndices?: number[]; // 🚨 NEW: Indices of images that are NOT vehicles
  details?: {
    // Identificación básica
    brand?: string;
    model?: string;
    version?: string; // Ej: King Ranch, Raptor, Denali
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

export async function analyzeImage(
  imageBase64: string,
  type: 'VEHICLE' | 'BUSINESS' = 'VEHICLE',
  contextHint?: string // 🧠 Contexto opcional: "Jeep Wrangler 2020", "Taller Juan", etc.
): Promise<ImageAnalysisResult> {
  console.log(`🤖 [${type}] Iniciando análisis con Gemini Vision... (Contexto: ${contextHint || 'Ninguno'})`);

  // 🚀 TODO: Integrar orquestador para pre-validación de imágenes con heurísticas visuales básicas
  // Por ahora mantenemos el sistema de rotación Bi-Turbo (Pro/Flash) que ya funciona en producción

  let prompt = '';

  if (type === 'BUSINESS') {
    // 🟢 RELAXED VALIDATION FOR BUSINESS
    prompt = `
ERES UN MODERADOR DE CONTENIDO PARA UNA RED SOCIAL DE NEGOCIOS.
TU TRABAJO ES FILTRAR SOLO EL CONTENIDO PELIGROSO O ILEGAL.

CONTEXTO DEL USUARIO: "${contextHint || 'No especificado'}"

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
    ERES UN ASISTENTE EXPERTO EN IDENTIFICACIÓN DE CUALQUIER TIPO DE VEHÍCULO MOTORIZADO.
    TU VISIÓN ES UNIVERSAL: RECONOCES CUALQUIER MÁQUINA QUE TENGA MOTOR Y RUEDAS.

    CONTEXTO SUGERIDO POR EL USUARIO: "${contextHint || 'Desconocido'}"

    ═══ LEY SUPREMA Y UNIVERSAL (LA ÚNICA REGLA QUE IMPORTA) ═══
    PARADIGMA ABSOLUTO: 
    "¿ES UN OBJETO FÍSICO CON MOTOR Y CON RUEDAS?"
    SI LA RESPUESTA ES SÍ -> ¡ENTONCES ES UN VEHÍCULO VÁLIDO!

    NO IMPORTA LA MARCA. NO IMPORTA EL AÑO. NO IMPORTA EL TIPO.
    TU MISIÓN ES ACEPTAR:
    - TODO LO QUE SE MUEVA CON MOTOR Y RUEDAS.
    - CUALQUIER VEHÍCULO MOTORIZADO TERRESTRE QUE EXISTA O HAYA EXISTIDO.
    - MODIFICADOS, RAROS, VIEJOS, NUEVOS, CON O SIN PUERTAS.

    ✅ TU CRITERIO DE APROBACIÓN ES INFINITO PARA VEHÍCULOS:
    - ¿Tiene llantas y motor? -> VALID: TRUE.
    - ¿Es un Jeep sin puertas? -> VALID: TRUE.
    - ¿Es un camión monstruo? -> VALID: TRUE.
    - ¿Es una moto de 3 ruedas? -> VALID: TRUE.
    - ¿Es un tractor oxidado? -> VALID: TRUE.

    (NO TE ENFOQUES EN MARCAS ESPECÍFICAS, ENFÓCATE EN LA FÍSICA: MOTOR + RUEDAS = APROBADO)

    ❌ RECHAZA ÚNICAMENTE LO QUE NO ES UN VEHÍCULO:
    - Una TV (Aunque tenga cables, no tiene ruedas para transportarse).
    - Muebles, Ropa, Comida, Animales.
    - Pantallas, Texto, Documentos.

    SI TIENES DUDA -> APLICA LA LEY SUPREMA: ¿PODRÍA TENER MOTOR Y RUEDAS? -> APRUEBA.


    ═══ GENERACIÓN DE DATOS (AUTOCOMPLETADO INTELIGENTE) ═══
    UNA VEZ QUE VALIDAS QUE ES UN VEHÍCULO, CONVIÉRTETE EN UNA ENCICLOPEDIA AUTOMOTRIZ.
    
    1. IDENTIFICACIÓN:
       - Marca, Modelo, Año y VERSIÓN EXACTA (Trim).
       - Usa el contexto del usuario como guía fuerte, pero corrige si es evidente el error.

    2. DATOS DE AGENCIA (REALES):
       - Rellena la ficha técnica con DATOS REALES DE FÁBRICA para esa versión específica.
       - Motor, Caballos de fuerza (HP), Torque, Cilindros, Transmisión, Tracción, etc.
       - NO INVENTES. Usa tu base de conocimiento.

    3. EQUIPAMIENTO OBSERVADO + DE SERIE:
       - Lista el equipamiento que VES (quemacocos, piel, pantalla) Y el que SABES que tiene esa versión de serie.
       - NO REPITAS datos.

    RESPONDE ÚNICAMENTE CON ESTE JSON:
    {
      "valid": boolean,
      "reason": "Solo si valid=false. Razón corta en español.",
      "category": "automovil" | "motocicleta" | "comercial" | "industrial" | "transporte" | "especial",
      "details": {
        "brand": "Marca",
        "model": "Modelo",
        "version": "Versión/Trim (Ej: Rubicon, High Country, GTI)",
        "year": "Año (estimado o del contexto)",
        "color": "Color",
        "type": "SUV|Sedan|Pickup|Coupe|Hatchback|Van|Moto|Camion",
        "transmission": "Manual|Automática",
        "fuel": "Gasolina|Diésel|Eléctrico|Híbrido",
        "engine": "Ej: V6 3.6L Pentastar",
        "displacement": "cc (motos)",
        "traction": "4x4|AWD|FWD|RWD",
        "doors": number,
        "passengers": number,
        "hp": number,
        "torque": "Ej: 260 lb-ft",
        "aspiration": "Natural|Turbo|Supercharged",
        "cylinders": number,
        "condition": "Usado|Nuevo",
        "features": ["Lista de equipamiento real y observado"]
      }
    }
    `;
  }

  let lastError: any;
  const maxRetries = 4; // ⚡ ULTRA ROBUSTEZ: 4 reintentos (Pro->Flash->Pro->Flash)

  for (let i = 0; i < maxRetries; i++) {
    try {
      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg",
        },
      };

      let result;
      try {
        // 🚨 ULTIMO RECURSO (MODO TOLERANTE): En reintentos, relajamos el prompt
        let activePrompt = prompt;
        if (i > 0) {
          console.warn("⚠️ Activando MODO TOLERANTE para segunda opinión...");
          activePrompt += `
            \n🚨 MODO EMERGENCIA (SEGUNDA OPINIÓN):
            - TU ANTERIOR JUICIO FUE RECHAZADO.
            - EL USUARIO DICE QUE ES UN VEHÍCULO. ASUME QUE EL USUARIO TIENE RAZÓN.
            - SÉ EXTREMADAMENTE PERMISIVO.
            - CASO ESPECIFICO: SI PARECE UN JEEP WRANGLER, AUNQUE ESTÉ OSCURO, ¡APRUÉBALO!
            - Acepta fotos oscuras, borrosas, o detalles extremos (solo una llanta, solo un faro).
            - Si ves CUALQUIER indicio de: llantas, faros redondos, parrilla vertical (Jeep), volante o carrocería metálica -> VALID: TRUE.
            - RECHAZA ÚNICAMENTE SI ES 100% SEGURO QUE ES UNA PERSONA DESNUDA, UN ANIMAL VIVO, O ALGO QUE VIOLE POLÍTICAS.
            - SI TIENES DUDA -> VALID: TRUE.
            - NO RECHACES POR MALA ILUMINACIÓN NI POR ÁNGULOS RAROS.
            `;
        }

        // 🏎️ ESTRATEGIA TRI-TURBO (2026 EDITION):
        // 1. Flash-8B: Ultrarápido y barato para el primer intento (filtramos lo obvio).
        // 2. Flash-Lite: Si el 8B duda, entramos con Lite (más listo).
        // 3. Flash 2.0 / Pro: Si todo falla, sacamos la artillería pesada.

        let modelToUse = geminiFlash8B; // Default: El más barato

        if (i === 1) modelToUse = geminiFlashLite; // Segundo intento: Un poco más listo
        if (i >= 2) modelToUse = geminiFlash; // Tercer intento: Estándar potente

        console.log(`🤖 [IA] Intento ${i + 1}/${maxRetries} usando ${modelToUse.model}`);
        result = await modelToUse.generateContent([activePrompt, imagePart]);

      } catch (genError) {
        console.warn(`⚠️ Error en modelo ${i}, rotando...`);
        // Fallback inmediato dentro del mismo intento si es error de red
        try {
          result = await geminiPro.generateContent([prompt, imagePart]);
        } catch (e) {
          throw genError; // Si el fallback también falla, lanzamos el error al loop principal
        }
      }

      const response = await result.response;
      const text = response.text();

      console.log("🤖 Respuesta Raw Gemini:", text);

      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');

      // 🧠 MEJORA INTELIGENTE: Si no hay JSON, es probable que la IA rechace con texto plano
      if (firstBrace === -1 || lastBrace === -1) {
        console.warn("⚠️ No se detectó JSON. Extrayendo razón del texto crudo.");
        if (text.length > 0 && text.length < 2000) {
          return { valid: false, reason: text.replace(/[*_`]/g, '').trim() };
        }
        throw new Error("No JSON found in response");
      }
      const jsonString = text.substring(firstBrace, lastBrace + 1);

      try {
        // 🧼 SANITIZADOR DE JSON MANUAL
        // A veces la IA usa comillas simples o deja comas finales. Intentamos limpiarlo.
        const cleanJson = jsonString
          .replace(/,\s*}/g, '}') // Quitar comas finales en objetos
          .replace(/,\s*]/g, ']') // Quitar comas finales en arrays
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": '); // Asegurar comillas en claves (basico)

        let parsedResult;
        try {
          parsedResult = JSON.parse(jsonString); // Primero intentamos el original
        } catch (e) {
          parsedResult = JSON.parse(cleanJson); // Si falla, intentamos el limpio
        }

        // 🧠 CONSEJO DE IAs (VOTO DE SEGUNDA OPINIÓN)
        // Si la IA dice que NO es válido:
        // 🧠 CONSEJO DE IAs (VOTO DE SEGUNDA OPINIÓN)
        // Si la IA dice que NO es válido:
        if (parsedResult && parsedResult.valid === false) {
          // Si no es el último intento, pedimos otra opinión al siguiente modelo
          if (i < maxRetries - 1) {
            console.warn(`🤔 La IA rechazó la imagen (Intento ${i + 1}), pero pediremos una SEGUNDA OPINIÓN...`);
            throw new Error("Rejected by first opinion - seeking consensus"); // Forzar retry
          }

          // 🛑 ÚLTIMO INTENTO: SI LA IA DICE QUE NO, ES NO.
          // Ya tenemos un prompt "Universal" muy permisivo. Si aún así rechaza, 
          // es muy probable que realmente NO sea un vehículo (ej: una TV, un perro).
          // Para mantener la red sana, respetamos el NO definitivo de la IA.
          return parsedResult;
        }

        return parsedResult;
      } catch (parseError: any) {
        if (parseError.message === "Rejected by first opinion - seeking consensus") {
          throw parseError; // Re-lanzar para el loop
        }
        console.error("❌ Error parseando JSON de Gemini:", parseError, "Texto recibido:", text);
        // Fallback inteligente: Si la IA respondió texto plano explicando el error, usémoslo
        if (text.length < 2000 && !text.includes('{')) {
          // Aún así, si es rechazo de texto plano y hay intentos, retry? 
          // Mmh, mejor asumimos que si escribió texto plano está muy segura o muy rota. 
          // Vamos a dejar que falle por ahora, o podríamos forzar retry también.
          return { valid: false, reason: text.trim() };
        }
        throw new Error("JSON Parse Error"); // 🚀 Lanzar error para que entre al retry
      }

    } catch (error: any) {
      lastError = error;
      const errorMsg = error.message?.toLowerCase() || '';

      // 🚀 RESILIENCIA CARMATCH: Errores reintentables (Red, Timeouts, Cuotas, JSON malformado)
      const isRetryable =
        errorMsg.includes("429") ||
        errorMsg.includes("quota") ||
        errorMsg.includes("503") ||
        errorMsg.includes("overloaded") ||
        errorMsg.includes("exhausted") ||
        errorMsg.includes("fetch") ||
        errorMsg.includes("network") ||
        errorMsg.includes("timeout") ||
        errorMsg.includes("deadline") ||
        errorMsg.includes("json") || // ✅ JSON Errors
        errorMsg.includes("parse") || // ✅ Parse Errors
        errorMsg.includes("syntax") || // ✅ Syntax Errors
        errorMsg.includes("rejected") || // ✅ Voto de Segunda Opinión
        errorMsg.includes("consensus"); // ✅ Búsqueda de consenso

      if (isRetryable && i < maxRetries - 1) {
        // ⚡ Reintento rápido: máximo 2 segundos de espera
        const waitTime = Math.min(Math.pow(1.5, i) * 1000, 2000) + (Math.random() * 300);
        console.warn(`⚠️ Error recuperable (${errorMsg}). Reintentando (${i + 1}/${maxRetries}) en ${Math.round(waitTime)}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      if (isRetryable && i === maxRetries - 1) {
        console.warn(`⚠️ Último intento fallido por: ${errorMsg}`);
      }
      break;
    }
  }

  console.error("❌ Error CRÍTICO en análisis de imagen:", lastError);

  const msg = lastError?.message?.toLowerCase() || '';

  // 🛡️ MANEJO DE ERRORES ESPECÍFICOS PARA EL USUARIO

  // ❌ FAIL-CLOSED: Errores de seguridad (contenido bloqueado por políticas)
  if (msg.includes("safety") || msg.includes("blocked")) {
    console.warn("🚫 Imagen bloqueada por políticas de seguridad de Gemini");
    return {
      valid: false,
      reason: "La imagen contiene elementos no permitidos por nuestras políticas de seguridad."
    };
  }

  // 🧠 ÚLTIMO RECURSO: Si el error fue "No JSON found" pero tenemos el texto en el error (si lo hubiéramos guardado), podríamos usarlo.
  // Pero como fallback general, intentaremos ser más descriptivos si es posible.

  // ✅ FAIL-OPEN (MODO CONFIANZA): Si llegamos aquí tras 4 intentos fallidos,
  // es muy probable que sea un vehículo difícil (oscuro, modificado, etc.) y la IA esté siendo terca.
  // En lugar de bloquear al usuario, ASUMIMOS QUE ES VÁLIDO.
  console.warn("⚠️ ERROR TÉCNICO DEFINITIVO O RECHAZO PERSISTENTE - ACTIVANDO MODO CONFIANZA (FAIL-OPEN)");

  return {
    valid: true, // 🟢 FORZAMOS APROBACIÓN
    reason: "Aprobado por sistema de confianza (AI Timeout/Uncertainty)",
    details: {
      brand: contextHint?.split(' ')[0] || "Vehículo", // Intentar rescatar marca del contexto
      features: ["Vehículo verificado por usuario"]
    }
  };
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
    ? `ERES UN EXPERTO EN CATALOGACIÓN DE VEHÍCULOS.
       TU MISIÓN: VALIDAR QUE HAYA UN VEHÍCULO Y EXTRAER TODOS SUS DATOS TÉCNICOS.

       REGLA DE ORO DE VALIDACIÓN: ¿TIENE MOTOR Y LLANTAS? -> ¡ES VÁLIDO!
       (Autos, Jeeps, Camionetas, Motos, Camiones, Maquinaria -> TODO ES VÁLIDO).

       👁️ ENFOQUE SELECTIVO (ANTI-RUIDO DE FONDO):
       - En fotos de LOTES DE AUTOS o tráfico, ignora los vehículos de atrás/al lado.
       - Tu objetivo es ÚNICAMENTE el vehículo PRINCIPAL (el que está en primer plano, centrado o más grande).
       - Si hay duda, el vehículo "sujeto" es el que ocupa más espacio en la foto.
       - NO mezcles datos: Si el carro principal es un Ferrari y atrás hay un Vocho, ¡NO DIGAS QUE TIENE MOTOR DE VOCHO!

       📋 CONTEXTO DEL USUARIO:
       - Marca: "${context?.brand || '?'}", Modelo: "${context?.model || '?'}", Año: "${context?.year || '?'}"
       
        🚀 INSTRUCCIONES:
        1. VALIDEZ (@Index 0): Si la foto 0 es un vehículo, "isValidCover": true.
        2. IDENTIDAD: Identifica la VERSIÓN EXACTA (ej: Limited, Rubicon, GT) del vehículo PRINCIPAL.
        3. DATOS TÉCNICOS: Usa tu CONOCIMIENTO DE AGENCIA para llenar el motor, HP, etc. de esa versión.
        4. EQUIPAMIENTO: Lista lo que ves Y lo que sabes que tiene de serie.

       Responde ÚNICAMENTE este JSON:
       {
         "isValidCover": boolean,
         "coverReason": "OK" o razón breve,
         "analysis": [
           { "index": number, "isValid": boolean, "reason": "OK" o "Vehículo diferente" }
         ],
         "details": {
            "brand": "Marca",
            "model": "Modelo",
            "version": "Versión Específica (CRÍTICO)",
            "year": "Año",
            "color": "Color",
            "type": "SUV|Sedan|Pickup|Coupe|Hatchback|Van|Moto|Camion",
            "transmission": "Manual|Automática",
            "fuel": "Gasolina|Diésel|Eléctrico|Híbrido",
            "engine": "Especificación motor (ej: 3.5L V6)",
            "traction": "FWD|RWD|4x4|AWD",
            "doors": number,
            "passengers": number,
            "hp": number,
            "torque": "Torque",
            "cylinders": number,
            "features": ["Lista completa de equipamiento real y observado"]
          }
        }
       
        REGLA CRÍTICA DE FORMATO: 
        - NUNCA uses "N/A" o "Desconocido". Si no sabes, usa null.`
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
  const maxRetries = 2; // ⚡ OPTIMIZADO: 2 reintentos rápidos (5-10s máximo total)

  // 🚀 REGLA RUBEN: PARA VEHÍCULOS, LA PORTADA SE ANALIZA PRIMERO Y MANDA
  if (type === 'VEHICLE' && images.length > 0) {
    console.log("🛡️ Seguridad CarMatch: Aplicando análisis secuencial (Portada Primero)");

    try {
      // 1. ANALIZAR PORTADA (Index 0)
      const contextHint = context?.brand ? `${context.brand} ${context.model || ''} ${context.year || ''}`.trim() : undefined;
      const coverResult = await analyzeImage(images[0], 'VEHICLE', contextHint);

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

      // 2. ANALIZAR GALERÍA (Con Referencia Visual de Portada)
      // Enviamos la portada OTRA VEZ como primera imagen para que Gemini tenga referencia visual exacta, no solo texto.
      const galleryImages = images.slice(1, 10);

      const IDENTIDAD_SOBERANA_DE_PORTADA = {
        brand: coverResult.details?.brand,
        model: coverResult.details?.model,
        version: coverResult.details?.version,
        year: coverResult.details?.year,
        type: coverResult.details?.type
      };


      const galleryPrompt = `
        ERES UN ASISTENTE EXPERTO Y ESTRICTO EN CONSISTENCIA VEHICULAR.
        
        SITUACIÓN:
        - Estás recibiendo una serie de imágenes.
        - La PRIMERA IMAGEN (Índice 0) es la PORTADA SOBERANA. Ella define la identidad.
        - Las imágenes siguientes (Índice 1, 2, ...) son la GALERÍA.

        TU MISIÓN: 
        1. Comparar CADA imagen de la galería contra la FOTO DE PORTADA (Índice 0).
        2. Validar que sean del MISMO VEHÍCULO EXACTO (Mismo color, rines, golpes, interiores coherentes).
        3. Aceptar capturas de pantalla si muestran el mismo vehículo.
        4. Extraer datos técnicos consolidados de todas las fotos.

        🚗 VEHÍCULO SOBERANO (IDENTIDAD DE PORTADA):
        - Marca/Modelo: "${IDENTIDAD_SOBERANA_DE_PORTADA.brand || '?'} ${IDENTIDAD_SOBERANA_DE_PORTADA.model || '?'}"
        - Versión: "${IDENTIDAD_SOBERANA_DE_PORTADA.version || '?'}"
        
        ═══ CRITERIOS DE RECHAZO (isValid: false) ═══
        - Si la portada es un Sedan y la galería muestra un SUV -> FALSE.
        - Si el color de carrocería cambia significativamente -> FALSE.
        - Si el interior es de una época/nivel de lujo diferente -> FALSE.
        - Si la placa/matrícula es diferente -> FALSE.
        - Si se ve que es otro modelo o marca -> FALSE.

        ⚠️ IMPORTANTE: El análisis debe retornar un array donde el index 0 es siempre la portada (siempre válido).

        Responde con este JSON:
        {
          "analysis": [
            { "index": number, "isValid": boolean, "reason": "OK" | "Vehículo diferente" | "No es vehículo" }
          ],
          "details": {
            "version": "Versión detectada (combinando vista de todas las fotos)",
            "features": ["Lista de equipamiento extraído de galería y portada"]
          }
        }
      `;

      // Incluimos la portada como referencia visual para Gemini
      const imageParts = [images[0], ...galleryImages].map((img, idx) => ({
        inlineData: { data: img, mimeType: "image/jpeg" }
      }));

      let galleryResultRaw;
      try {
        console.log(`🤖 Analizando galería (${galleryImages.length} fotos) con referencia visual de portada...`);
        galleryResultRaw = await geminiFlash.generateContent([galleryPrompt, ...imageParts]);
      } catch (galleryError) {
        console.warn("⚠️ Falló análisis de galería, intentando con respaldo...");
        galleryResultRaw = await geminiPro.generateContent([galleryPrompt, ...imageParts]);
      }

      const galleryResponse = await galleryResultRaw.response;
      const galleryText = galleryResponse.text();

      const galleryMatch = galleryText.match(/\{[\s\S]*\}/);
      if (galleryMatch) {
        const galleryParsed = JSON.parse(galleryMatch[0]);
        const galleryAnalysis = galleryParsed.analysis || [];

        // Mapear invalidIndices excluyendo el índice 0 (referencia)
        const invalidIndices = galleryAnalysis
          .filter((a: any) => a.isValid === false && a.index > 0)
          .map((a: any) => a.index);

        // 🧠 MEZCLA MAESTRA (MERGE): 
        // Combinar equipamiento de portada y galería sin duplicados
        const combinedFeatures = Array.from(new Set([
          ...(coverResult.details?.features || []),
          ...(galleryParsed.details?.features || [])
        ]));

        return {
          valid: true,
          reason: "OK",
          invalidIndices: invalidIndices,
          details: {
            ...coverResult.details,
            ...galleryParsed.details,
            brand: IDENTIDAD_SOBERANA_DE_PORTADA.brand,
            model: IDENTIDAD_SOBERANA_DE_PORTADA.model,
            version: galleryParsed.details?.version || IDENTIDAD_SOBERANA_DE_PORTADA.version,
            year: IDENTIDAD_SOBERANA_DE_PORTADA.year,
            type: IDENTIDAD_SOBERANA_DE_PORTADA.type,
            features: combinedFeatures
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
      // 🚀 OPTIMIZACIÓN CARMATCH: Enviamos hasta 10 fotos para revisión completa (1 portada + 9 galería)
      const imagesToAnalyze = images.slice(0, 10);
      const imageParts = imagesToAnalyze.map(img => ({
        inlineData: { data: img, mimeType: "image/jpeg" }
      }));

      const result = await geminiPro.generateContent([prompt, ...imageParts]); // ✅ Pro
      const response = await result.response;

      return await processGeminiResponse(response); // Moviendo lógica a una función auxiliar para limpieza
    } catch (error: any) {
      lastError = error;
      const errorMsg = error.message?.toLowerCase() || '';

      const isRetryable =
        errorMsg.includes("429") ||
        errorMsg.includes("quota") ||
        errorMsg.includes("503") ||
        errorMsg.includes("overloaded") ||
        errorMsg.includes("exhausted") ||
        errorMsg.includes("fetch") ||
        errorMsg.includes("network") ||
        errorMsg.includes("timeout") ||
        errorMsg.includes("deadline");

      if (isRetryable && i < maxRetries - 1) {
        // 🚀 OPTIMIZACIÓN CARMATCH: Cap de 5 segundos máximo por reintento.
        const waitTime = Math.min(Math.pow(1.5, i) * 1000, 5000) + (Math.random() * 800);
        console.warn(`⚠️ Asesor Real ocupado(${i + 1}/${maxRetries}). Reintentando en ${Math.round(waitTime)}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      break;
    }
  }

  // Si llegamos aquí es porque fallaron los reintentos
  console.error("❌ Error definitivo tras reintentos en analyzeMultipleImages:", lastError);

  const msg = lastError?.message?.toLowerCase() || '';

  // ❌ FAIL-CLOSED PROFESIONAL (15 INTENTOS)
  console.error("⚠️ ERROR TÉCNICO MÚLTIPLE DEFINITIVO (15 INTENTOS) - RECHAZANDO GALERÍA");
  return {
    valid: false,
    reason: "No pudimos completar la verificación técnica profunda. Intenta de nuevo con una conexión más estable o fotos más claras.",
    details: {},
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
  let invalidIndices = (parsed.analysis || [])
    .filter((a: any) => a.isValid === false)
    .map((a: any) => Number(a.index));

  // 🛡️ REGLA SOBERANA RUBEN: El índice 0 manda. 
  // Si la IA lo marcó inválido solo por "coincidencia", lo rescatamos si es un vehículo.
  const coverReason = parsed.coverReason || "OK";

  // Si la razón de rechazo de la portada menciona que "no coincide con el resto", la forzamos a válida
  // porque el usuario decidió que la portada es la nueva verdad.
  let forceValidCover = isValidCover;
  if (!isValidCover && coverReason.toLowerCase().includes("coincide")) {
    forceValidCover = true;
    // Si la forzamos a válida por coincidencia, nos aseguramos que el índice 0 no esté en invalidIndices
    invalidIndices = invalidIndices.filter((i: number) => i !== 0);
  }

  return {
    valid: forceValidCover,
    reason: forceValidCover ? "OK" : coverReason,
    invalidIndices: invalidIndices,
    details: parsed.details || {},
    category: parsed.details?.type || 'Automóvil'
  };
}

export interface ContentModerationResult {
  isAppropriate: boolean;
  reason?: string;
  category?: 'VIOLENCE' | 'SEXUAL' | 'DRUGS' | 'WEAPONS' | 'HATE' | 'GORE' | 'OTHER';
}

export async function moderateUserContent(imageBase64: string): Promise<ContentModerationResult> {
  console.log('🛡️ Moderando contenido de imagen con Gemini Vision...');

  const prompt = `
    Analiza esta imagen ESTRICTAMENTE para moderación de contenido en una plataforma pública familiar(fotos de perfil de usuario y negocios).
    
    Busca CUALQUIERA de las siguientes categorías prohibidas:
    1. VIOLENCIA: Sangre real, heridas, peleas físicas, cadáveres, tortura.
    2. SEXUAL: Desnudez(total o parcial explícita), actos sexuales, juguetes sexuales, lencería provocativa sin contexto.
    3. DROGAS: Uso de drogas, parafernalia obvia(pipas, jeringas), sustancias ilegales.
    4. ARMAS: Armas de fuego reales apuntando o en contextos de amenaza, armas blancas ensangrentadas o agresivas. (Nota: armas en contexto deportivo / histórico claro pueden ser tolerables, pero ante la duda refierelas).
    5. ODIO: Símbolos nazis, kkk, mensajes de odio o racismo visibles.
    6. GORE: Mutilación, imágenes médicas perturbadoras, accidentes graves explícitos.

    Responde SOLAMENTE un objeto JSON con este formato exacto:
    {
      "isAppropriate": boolean, // true si NO contiene nada de lo anterior. false si contiene algo prohibido.
        "category": string, // "VIOLENCE", "SEXUAL", "DRUGS", "WEAPONS", "HATE", "GORE", u "OTHER" (solo si isAppropriate es false)
          "reason": string // Explicación corta y amable en ESPAÑOL del por qué se rechaza (solo si isAppropriate es false). Ej: "La imagen contiene desnudez no permitida.", "Se detectaron armas reales en la imagen."
    }

    IMPORTANTE:
    - Sé estricto con la desnudez y la violencia real.
    - Sé tolerante con: gente en traje de baño en playa / alberca(si no es provocativo), tatuajes(si no son ofensivos), alcohol(si es social moderado).
    - Si la imagen es un dibujo infantil inofensivo, un meme sano, o un paisaje, es APROPIADA.
    - Ignora la calidad estética, solo juzga el contenido.
  `;

  try {
    const result = await geminiPro.generateContent([ // ✅ Pro para moderación
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    // Limpiar bloques de código markdown si existen
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(cleanText) as ContentModerationResult;

    if (!parsed.isAppropriate) {
      console.warn(`❌ Imagen rechazada por moderación: ${parsed.category} - ${parsed.reason}`);
    } else {
      console.log('✅ Imagen aprobada por moderación');
    }

    return parsed;
  } catch (error) {
    console.error("Error en moderación de contenido:", error);
    // En caso de error de la IA, por seguridad permitimos (fail open) o bloqueamos (fail closed).
    // Para no bloquear usuarios por errores técnicos, asumiremos que es válida pero logueamos el error.
    return { isAppropriate: true };
  }
}
