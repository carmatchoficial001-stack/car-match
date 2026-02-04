
import { geminiPro, geminiFlash } from "./geminiClient"; // ✅ Modelos para análisis


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
ERES UN ANALISTA EXPERTO DE VEHÍCULOS.
CONTEXTO SUGERIDO POR EL USUARIO: "${contextHint || 'Desconocido'}"

═══ REGLAS DE APROBACIÓN (VEHÍCULOS MOTORIZADOS TERRESTRES) ═══
✅ APRUEBA AUTOMÁTICAMENTE SI VES CUALQUIERA DE ESTOS:
- Autos (sedanes, hatchbacks, coches deportivos, cupés)
- Camionetas y SUVs (GMC, Chevrolet, Ford, Toyota, Jeep, etc.)
- Pickups (F-150, Silverado, Ram, Tundra, etc.)
- Vans (minivans, furgonetas, vans de pasajeros)
- Motocicletas, scooters, motonetas, cuatrimotos (ATVs)
- Camiones (carga, volteo, trailer, tractor-camión)
- Vehículos comerciales (ambulancias, autobuses, patrullas)
- Maquinaria pesada CON LLANTAS (excavadoras, grúas, tractores agrícolas)
- Vehículos clásicos, antiguos, modificados o de colección
- **CUALQUIER COSA CON MOTOR Y LLANTAS QUE SE MUEVA EN TIERRA**

❌ RECHAZA INMEDIATAMENTE SI LA PORTADA (@Index 0) ES:
- **DOCUMENTOS O TEXTO**: Comprobantes de transferencia, recibos de luz/agua, facturas, capturas de pantalla de bancos, o puras imágenes de texto.
- **CONTENIDO NO VEHICULAR**: Muebles, electrodomésticos, comida, ropa, personas solas.
- **DIBUJOS O JUGUETES**: Ilustraciones, Hot Wheels, maquetas, pantallas de otros dispositivos.

❌ RECHAZA EN LA GALERÍA (@Index 1-9) SI:
- Es un vehículo diferente al de la portada.
- Es contenido prohibido o no relacionado.

IMPORTANTE: Si la portada NO es un vehículo terrestre motorizado real (con llantas/motor), "valid" debe ser false y el autollenado se cancela.

═══ PROTOCOLO DE ANÁLISIS (PASO A PASO) ═══
1. 🧠 ANÁLISIS CONTEXTUAL: El usuario dice que es un "${contextHint}". Úsalo como pista fuerte. Si la imagen es borrosa pero coincide con la silueta de un "${contextHint}", APRUÉBALA.
2. ESCANEO VISUAL: Identifica silueta, parrilla, faros y logotipos.
3. IDENTIFICACIÓN PURA: Determina qué vehículo es basándote *solo* en la imagen. Intenta identificar la VERSIÓN/TRIM específica (ej: Touring, Denali, GTI).
4. COMPARACIÓN CRÍTICA: Si el contexto dice "Hyundai" pero ves un "Jeep Wrangler", reporte JEEP WRANGLER.
5. 🧞‍♂️ MODO ENCICLOPEDIA (AGENCY KNOWLEDGE):
   - UNA VEZ IDENTIFICADO EL MODELO EXACTO (Ej: "Mustang GT 2018"), ¡YA SABES TODO SOBRE ÉL!
   - NO TE LIMITES A LO QUE VES. Tú sabes que un Mustang GT 2018 tiene un V8 5.0L, 460 HP, Tracción Trasera, etc.
   - ¡LLENA TODOS LOS CAMPOS TÉCNICOS BASÁNDOTE EN TU BASE DE DATOS INTERNA!
   - Si es una versión específica (ej: "High Country"), usa las specs de ESA versión.

RESPONDE ÚNICAMENTE CON ESTE JSON:
{
  "valid": boolean (true si es un vehículo real, false solo si NO es vehículo o contenido prohibido),
  "reason": "Si valid=false, DÍ EXACTAMENTE QUÉ ES LO QUE VES. Formato OBLIGATORIO: 'Esto es [OBJETO QUE VES], solo se permiten vehículos motorizados terrestres. Vuelve a intentarlo'. Ej: 'Esto es una mascota, solo se permiten vehículos motorizados terrestres. Vuelve a intentarlo'.",
  "category": "automovil" | "motocicleta" | "comercial" | "industrial" | "transporte" | "especial",
  "details": {
    "brand": "Marca REAL identificada visualmente",
    "model": "Modelo REAL (Ej: F-150, Silverado, Civic)",
    "version": "Versión/Trim/Edición específica (Ej: King Ranch, Raptor, Laramie, Denali, GTI, Rubicon). ¡MUY IMPORTANTE!",
    "year": "Año o generación",
    "color": "Color",
    "type": "SUV|Sedan|Pickup|Coupe|Hatchback|Van|Moto|Camion",
    "transmission": "Manual|Automática",
    "fuel": "Gasolina|Diésel|Eléctrico|Híbrido",
    "engine": "Especificación motor (Ej: 3.5L V6 EcoBoost o 6.2L V8) - ¡USAR DATOS DE CATALOGO!",
    "displacement": "Cilindrada (ej: 3500cc)",
    "traction": "FWD|RWD|4x4|AWD",
    "doors": 2|3|4|5,
    "passengers": 2|5|7|9,
    "hp": "Potencia (HP) - ¡SACAR DE CATALOGO!",
    "torque": "Torque - ¡SACAR DE CATALOGO!",
    "aspiration": "Natural|Turbo|Twin-Turbo|Supercharged",
    "cylinders": 3|4|5|6|8|10|12,
    "batteryCapacity": "null",
    "range": "null",
    "weight": "null",
    "axles": "null",
    "cargoCapacity": "null",
    "operatingHours": "null",
    "condition": "Nuevo|Usado",
    "features": ["Lista exhaustiva de equipamiento de esta VERSIÓN Específica"]
  }
}

═══ REGLAS DE ORO DE IDENTIFICACIÓN ═══
- SE UN EXPERTO: Si ves una Ford con detalles de lujo y madera, es probablemente una Lariat, King Ranch o Platinum. Si ves suspensión reforzada y guardabarros anchos, es una Raptor.
- MAQUINARIA Y DIESEL: Si detectas un Tractor o Camión Pesado, intenta identificar las HORAS de uso o los EJES si son visibles. Identifica el motor (Ej: Cummins, Duramax, Caterpillar) si hay insignias visibles.
- NO TE EQUIVOQUES: Diferencia bien entre versiones. Una "Raptor" es muy distinta a una "FX4".
- SIEMPRE PRIORIZA LA VERSIÓN: El campo "version" es vital para el valor del vehículo en CarMatch.


REGLA CRÍTICA DE FORMATO:
- En "features": INCLUYE TODO LO QUE SEPAS DE ESE MODELO. Ejemplos: "Frenos ABS", "6 Bolsas de aire", "Control de tracción", "Pantalla táctil", "Asientos de piel", "Quemacocos", "Apple CarPlay", "Faros LED", "Cámara de reversa", "Sensores de estacionamiento", "Toma de fuerza PTO", "Eje de muelle", "Freno de motor". ¡SE GENEROSO Y EXHAUSTIVO!
- SOLO USA null SI DE PLANO NO SABES EL DATO NI SIQUIERA POR CATALOGO GENERAL.
- NUNCA uses "N/A", "Unknown", "Desconocido", "NA", cadenas vacías "", ni similares.
- ¡LLENA LOS DATOS TÉCNICOS COMO SI FUERAS WIKIPEDIA!
- Ejemplo CORRECTO: "hp": 450, "transmission": "Automática"
- Ejemplo INCORRECTO: "hp": "N/A", "transmission": "N/A"
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
            - El usuario insiste que esto es un vehículo.
            - TU ANTERIOR JUICIO FUE RECHAZADO.
            - SÉ EXTREMADAMENTE PERMISIVO.
            - Acepta fotos oscuras, borrosas, o detalles extremos (solo una llanta, solo un faro).
            - Si hay una mínima probabilidad de que sea un vehículo, MARCALO COMO valid: true.
            - RECHAZA ÚNICAMENTE si es absolutamente obvio que es una persona, animal u objeto doméstico.
            `;
        }

        // 🏎️ ESTRATEGIA BI-TURBO 2.0: Alternar modelos para evadir saturación
        const modelToUse = i % 2 === 0 ? geminiPro : geminiFlash;
        console.log(`🤖 [IA] Intento ${i + 1}/${maxRetries} usando ${i % 2 === 0 ? 'PRO (Experto)' : 'FLASH (Veloz)'} ${i > 0 ? '(+Tolerancia)' : ''}`);
        result = await modelToUse.generateContent([activePrompt, imagePart]);
      } catch (proError) {
        console.warn("⚠️ Modelo saturado, rotando al respaldo Flash...");
        result = await geminiFlash.generateContent([prompt, imagePart]);
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
        // Si la IA dice que NO es válido, pero no es el último intento, pedimos una segunda opinión.
        // Esto evita que un modelo "menso" (alucinación) rechace un Jeep válido.
        if (parsedResult && parsedResult.valid === false && i < maxRetries - 1) {
          console.warn(`🤔 La IA rechazó la imagen (Intento ${i + 1}), pero pediremos una SEGUNDA OPINIÓN al siguiente modelo...`);
          throw new Error("Rejected by first opinion - seeking consensus"); // Forzar retry
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

  // ❌ FAIL-CLOSED PROFESIONAL: Solo después de intentos fallidos
  console.error("⚠️ ERROR TÉCNICO DEFINITIVO - RECHAZANDO");
  return {
    valid: false,
    reason: "No detectamos un vehículo. Solo se permiten vehículos motorizados terrestres. Vuelve a intentarlo.",
    details: {}
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
    ? `ERES UN ANALISTA FORENSE TÉCNICO DE VEHÍCULOS.
       TU MISIÓN: Descubrir fraudes. El usuario puede intentar engañarte con el texto, pero la imagen es la única verdad.

       📋 DATOS DEL USUARIO (POSIBLEMENTE FALSOS O ERRÓNEOS):
       - Marca: "${context?.brand || '?'}", Modelo: "${context?.model || '?'}", Año: "${context?.year || '?'}"
       
        🚀 PROTOCOLO DE AUDITORÍA VISUAL:
        1. VISIÓN SOBERANA (@Index 0): Esta es la FOTO MANDANTE. Identifica el vehículo ignorando el texto del usuario.
        2. SOBERANÍA ABSOLUTA: Si la portada (@Index 0) es un vehículo, "isValidCover" DEBE SER true, sin importar si las otras fotos (@Index 1, 2...) coinciden o no.
        3. LIMPIEZA DE GALERÍA: Si las fotos de la galería (@Index 1+) no coinciden con la portada (@Index 0), marca esas fotos de la galería como "isValid": false, pero NUNCA invalides la portada por este motivo.
        4. CORRECCIÓN: Tu JSON "details" debe basarse ÚNICAMENTE en lo que ves en la portada (@Index 0).

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
            "version": "Versión/Trim/Edición específica (Ej: King Ranch, Raptor, Denali, GTI, Rubicon, Carbon Edition). ¡SÉ MUY PRECISO!",
            "year": "Año o generación",
            "color": "Color predominante",
            "type": "SUV|Sedan|Pickup|Coupe|Hatchback|Van|Moto|Camion",
            "transmission": "Manual|Automática",
            "fuel": "Gasolina|Diésel|Eléctrico|Híbrido",
            "engine": "Especificación motor (ej: 3.5L V6 o Cummins 6.7)",
            "traction": "FWD|RWD|4x4|AWD",
            "doors": 2|3|4|5,
            "passengers": 2|5|7|9,
            "hp": "Potencia",
            "cargoCapacity": "Capacidad en toneladas (si aplica)",
            "operatingHours": "Horas de uso (si aplica)",
            "features": ["Lista exhaustiva de equipamiento detectado y estándar de esta versión"]
          }
        }
       
        REGLA CRÍTICA DE FORMATO: 
        - Para datos técnicos NO visibles o INCIERTOS: usa null (sin comillas).
        - NUNCA uses "N/A", "Unknown", "Desconocido", "NA", "", ni similares.
        - Ejemplo: "hp": null, "torque": null`
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

      // 2. ANALIZAR GALERÍA (Contexto de Portada)
      // La portada es la ÚNICA fuente de verdad para la identidad (Marca/Modelo/Año).
      // La galería solo sirve para confirmar que es el mismo coche y extraer datos técnicos.
      const IDENTIDAD_SOBERANA_DE_PORTADA = {
        brand: coverResult.details?.brand,
        model: coverResult.details?.model,
        version: coverResult.details?.version,
        year: coverResult.details?.year,
        type: coverResult.details?.type
      };


      const galleryImages = images.slice(1, 10); // Analizar las 9 fotos de la galería (Total 10 con portada)

      const galleryPrompt = `
        ERES UN AUDITOR DE CONSISTENCIA Y UN EXPERTO EN CATALOGACIÓN AUTOMOTRIZ.
        TU MISIÓN: 
        1. Validar que las fotos de la galería pertenezcan al mismo vehículo que la portada (o sean detalles del mismo).
        2. EXTRAER CADA DETALLE TÉCNICO VISIBLE en estas fotos para completar la ficha del auto.

        🚗 VEHÍCULO SOBERANO (IDENTIDAD DE PORTADA):
        - Marca: "${IDENTIDAD_SOBERANA_DE_PORTADA.brand || '?'}"
        - Modelo: "${IDENTIDAD_SOBERANA_DE_PORTADA.model || '?'}"
        - Versión/Edición: "${IDENTIDAD_SOBERANA_DE_PORTADA.version || '?'}"
        - Estilo: "${IDENTIDAD_SOBERANA_DE_PORTADA.type || '?'}"

        ESTÁS RECIBIENDO ${galleryImages.length} IMÁGENES SECUNDARIAS.

        📋 REGLAS DE AUDITORÍA (SÉ INTELIGENTE Y TOLERANTE):
        - ✅ ACEPTA DETALLES: Tableros, motores, asientos, llantas, cajuelas, techos. ¡Son partes del auto! No las rechaces porque no se ve el auto entero.

        - ✅ ACEPTA ÁNGULOS DISTINTOS: Frente, vualta, perfil, desde arriba.
        - ✅ ACEPTA DIFERENCIAS DE ILUMINACIÓN: Luz de día vs sombra puede cambiar el tono del color.Sé flexible.
        - ❌ RECHAZA SOLO SI ES OBVIAMENTE OTRO CARRO: Un Ford rojo vs un Toyota blanco.Una camioneta vs un compacto.
        - ❌ RECHAZA BASURA: Memes, screenshots de celulares, gente posando sola(sin auto), comida, objetos random.

        🕵️‍♂️ MODO DETECTIVE(LLENADO DE DATOS):
      - Mira las fotos del interior: ¿Es automático o estándar ? ¿Tiene piel ? ¿Quemacocos ? ¿Pantalla ?
        - Mira el motor: ¿Ves insignias "V8", "Turbo", "Hemi", "EcoBoost" ?
        🧞‍♂️ MODO ENCICLOPEDIA(AGENCY KNOWLEDGE):
      - ¡OJO! Ahora que tienes MÁS FOTOS, puedes confirmar la versión exacta(ej: viste la insignia "Limited").
        - UNA VEZ CONFIRMADA LA VERSIÓN, usa tu base de datos interna para llenar HP, Torque, Motor, etc.
        - ¡COMPLETA LA FICHA TÉCNICA COMO SI FUERAS EL FABRICANTE!
        - Mira la parte trasera: ¿Dice "4x4", "Limited", ing "Platinum" ?
          - USA ESTA INFO PARA CORREGIR O COMPLETAR LOS DATOS DEL VEHÍCULO.

        Responde con este JSON:
      {
        "analysis": [
          { "index": number, "isValid": boolean, "reason": "OK" }
        ],
          "category": "automovil|motocicleta|comercial|industrial|transporte|especial",
            "details": {
          "brand": "Marca (Confirmada)",
            "model": "Modelo (Confirmado)",
              "year": number,
                "version": "Versión exacta detectada en conjunto",
                  "color": "Color",
                    "type": "SUV|Sedan|Pickup|Coupe|Hatchback|Van|Moto|Camion",
                      "transmission": "Manual|Automática (Busca la palanca en fotos interiores)",
                        "fuel": "Gasolina|Diésel|Eléctrico|Híbrido",
                          "engine": "Especificación motor (¡USAR CONOCIMIENTO DE AGENCIA!)",
                            "displacement": "Cilindrada",
                              "traction": "FWD|RWD|4x4|AWD (Busca palancas o botones 4x4)",
                                "doors": 2 | 3 | 4 | 5,
                                  "passengers": 2 | 5 | 7 | 9,
                                    "hp": "Potencia",
                                      "torque": "Torque",
                                        "aspiration": "Natural|Turbo|Twin-Turbo|Supercharged",
                                          "cylinders": 3 | 4 | 5 | 6 | 8 | 10 | 12,
                                            "batteryCapacity": null,
                                              "range": null,
                                                "weight": null,
                                                  "axles": null,
                                                    "cargoCapacity": null,
                                                      "operatingHours": null,
                                                        "condition": "Nuevo|Usado",
                                                          "features": ["Lista MUY COMPLETA de equipamiento detectado en TODAS las fotos (portada + galería)"]
        }
      }
      `;

      const imageParts = galleryImages.map(img => ({
        inlineData: { data: img, mimeType: "image/jpeg" }
      }));

      let galleryResultRaw;
      try {
        // 🏎️ Usar Flash primero para eficiencia (cascada del orquestador)
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
        const galleryAnalysis = (galleryParsed.analysis || []).map((a: any) => ({
          ...a,
          index: Number(a.index) + 1 // 🚀 MAPEO CRÍTICO: El index 0 de galería es el index 1 global
        }));

        const invalidIndices = galleryAnalysis
          .filter((a: any) => a.isValid === false)
          .map((a: any) => a.index)
          .filter((idx: number) => idx !== 0); // PROTECCIÓN: El índice 0 NUNCA es inválido por culpa de la galería

        // 🧠 MEZCLA MAESTRA (MERGE): 
        // Combinar equipamiento de portada y galería sin duplicados
        const combinedFeatures = Array.from(new Set([
          ...(coverResult.details?.features || []),
          ...(galleryParsed.details?.features || [])
        ]));

        return {
          valid: coverResult.valid,
          reason: coverResult.reason || "OK",
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
