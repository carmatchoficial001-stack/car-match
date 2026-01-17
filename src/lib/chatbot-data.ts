export type ChatIntent = 'GREETING' | 'UPLOAD_VEHICLE' | 'MAP_STORE' | 'MODERATION' | 'PAYMENTS' | 'ADVICE' | 'SAFETY' | 'BUSINESS' | 'UNKNOWN'

export interface ChatResponse {
    keywords: string[]
    intent: ChatIntent
    response: string
    actionLink?: string
    actionText?: string
}

const JOIN_INVITATION = '\n\n¡Únete a la comunidad de CarMatch y aprovecha todas nuestras herramientas profesionales!'
const AUTH_LINK = '/auth'
const AUTH_TEXT = 'Ingresar / Registrarme'

export const KNOWLEDGE_BASE: ChatResponse[] = [
    // --- GREETINGS & INTRO ---
    {
        keywords: ['hola', 'buenos dias', 'buenas tardes', 'inicio', 'empezar', 'quien eres', 'ayuda'],
        intent: 'GREETING',
        response: '¡Hola! Soy tu Asesor CarMatch. 👨‍💻\n\nEstoy entrenado para ayudarte a:\n✅ Vender tu auto rápido y gratis.\n✅ Encontrar el taller o desponchadora más cercana.\n✅ Darte consejos de mecánica y seguridad.\n✅ Crecer tu negocio automotriz.\n\n¿Qué tienes en mente hoy?' + JOIN_INVITATION,
        actionLink: AUTH_LINK,
        actionText: AUTH_TEXT
    },

    // --- SELLING & PUBLISHING ---
    {
        keywords: ['vender', 'subir', 'publicar', 'anunciar', 'foto', 'publico', 'venta', 'anuncio', 'carro', 'auto', 'camioneta', 'moto', 'tractor'],
        intent: 'UPLOAD_VEHICLE',
        response: '¡Excelente decisión! En CarMatch tu primera publicación es GRATIS por 6 meses.\n\n💡 **Tip del Asesor:** Sube al menos 5 fotos (frente, trasera, laterales e interior) y detalla si tiene extras como sonido o rines. ¡Eso acelera la venta un 40%!' + JOIN_INVITATION,
        actionLink: AUTH_LINK,
        actionText: 'Publicar Ahora'
    },
    {
        keywords: ['precio', 'costo', 'pagar', 'creditos', 'créditos', 'dinero', 'gratis', 'cuanto'],
        intent: 'PAYMENTS',
        response: 'En CarMatch apoyamos tu economía:\n\n🔹 **1er Auto:** Totalmente GRATIS (6 meses).\n🔹 **2do en adelante:** 7 días gratis para probar.\n🔹 **Negocios:** Tu primer mes en el mapa es GRATIS.\n\nSin letras chiquitas. Queremos que vendas.',
        actionLink: AUTH_LINK,
        actionText: 'Crear Cuenta Gratis'
    },

    // --- MAP & SERVICES (MAPSTORE) ---
    {
        keywords: ['mapa', 'negocio', 'taller', 'lavado', 'ubicacion', 'tienda', 'cerca', 'desponchadora', 'llantera', 'grua', 'emergencia', '24 horas', 'domicilio'],
        intent: 'MAP_STORE',
        response: '📍 **MapStore activo.** Tenemos la red más grande de talleres, desponchadoras 24/7 y servicios a domicilio.\n\nSi te quedaste tirado o buscas un servicio especializado, regístrate para ver quién está abierto cerca de ti justo ahora.' + JOIN_INVITATION,
        actionLink: '/map-store',
        actionText: 'Abrir MapStore'
    },

    // --- MECHANICAL ADVICE (BLOG-STYLE) ---
    {
        keywords: ['falla', 'ruido', 'humo', 'calienta', 'frenos', 'aceite', 'check engine', 'transmision', 'bateria'],
        intent: 'ADVICE',
        response: '🔧 **Asesoría Técnica:**\n\n- **Humo Negro:** Mezcla rica en gasolina (posible falla de sensores).\n- **Pedal de freno esponjoso:** Podría ser aire en las líneas o falta de líquido.\n- **Ruido al girar:** Posiblemente juntas homocinéticas o falta de grasa.\n\nNo arriesgues tu auto. Busca un experto certificado en nuestro mapa.',
        actionLink: '/map-store',
        actionText: 'Buscar Mecánico'
    },
    {
        keywords: ['comprar', 'revisar', 'usado', 'checar', 'papeles', 'factura', 'vin'],
        intent: 'ADVICE',
        response: '🛡️ **Guía de Compra Segura:**\n1. Revisa que el VIN del tablero coincida con el de la puerta y el motor.\n2. La factura debe ser original o tener copia de la de origen.\n3. Prueba el auto en frío; ahí es cuando salen los ruidos reales.',
        actionLink: AUTH_LINK,
        actionText: 'Ver Autos Disponibles'
    },

    // --- SAFETY ---
    {
        keywords: ['seguro', 'robo', 'fraude', 'seguridad', 'cita', 'reunion', 'sos'],
        intent: 'SAFETY',
        response: '👮 **Protocolo de Seguridad CarMatch:**\n\nContamos con **Cita Segura** y botón **SOS**. Siempre te recomendamos:\n1. Verse en lugares públicos (centros comerciales).\n2. No ir solo.\n3. Usar nuestro botón SOS si algo se siente mal; notificaremos a tu contacto y a las autoridades.' + JOIN_INVITATION,
        actionLink: AUTH_LINK,
        actionText: 'Ver Más de Seguridad'
    },

    // --- BUSINESS GROWTH ---
    {
        keywords: ['negocio', 'registrar mi taller', 'clientes', 'promocionar', 'publicidad', 'crecer'],
        intent: 'BUSINESS',
        response: '📈 **Para Dueños de Negocios:**\nEstar en CarMatch te pone frente a miles de conductores locales. \n\n**Tip Pro:** Sube fotos de tus trabajos terminados y especifica si das servicio a domicilio o 24/7. Eso te dará prioridad en las búsquedas.' + JOIN_INVITATION,
        actionLink: '/my-businesses',
        actionText: 'Registrar Mi Negocio'
    },

    // --- PWA / APP ---
    {
        keywords: ['descargar', 'app', 'iphone', 'android', 'instalar', 'tienda'],
        intent: 'UNKNOWN',
        response: '📱 **¡Lleva CarMatch en tu bolsillo!**\nNo necesitas buscar en la Play Store. \n\n1. Entra desde tu navegador.\n2. Dale a "Instalar CarMatch" en el menú.\n3. ¡Listo! Tendrás acceso rápido y alertas en tiempo real.',
        actionLink: AUTH_LINK,
        actionText: 'Instalar Aplicación'
    }
]

export const findBestResponse = (query: string): ChatResponse => {
    const normalizedQuery = query.toLowerCase()

    // Buscar el mejor match basado en la cantidad de palabras clave encontradas
    let bestMatch: ChatResponse | null = null
    let maxKeywords = 0

    for (const item of KNOWLEDGE_BASE) {
        const matches = item.keywords.filter(kw => normalizedQuery.includes(kw)).length
        if (matches > maxKeywords) {
            maxKeywords = matches
            bestMatch = item
        }
    }

    return bestMatch || {
        keywords: [],
        intent: 'UNKNOWN',
        response: 'Interesante pregunta... 🤔 No tengo el dato exacto ahora, pero soy un Asesor en constante aprendizaje.\n\n¿Te gustaría saber sobre cómo comprar o vender un carro, consejos de mecánica o encontrar algún negocio en el mapa?\n\n¡Regístrate para que no te pierdas de nada!',
        actionLink: AUTH_LINK,
        actionText: AUTH_TEXT
    }
}
