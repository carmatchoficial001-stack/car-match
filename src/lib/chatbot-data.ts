export type ChatIntent =
    | 'GREETING'
    | 'UPLOAD_VEHICLE'
    | 'PAYMENTS'
    | 'MAP_STORE'
    | 'MODERATION'
    | 'UNKNOWN'

export interface ChatResponse {
    keywords: string[]
    response: string
    intent: ChatIntent
    actionLink?: string
    actionText?: string
}

export const KNOWLEDGE_BASE: ChatResponse[] = [
    {
        keywords: ['hola', 'buenos dias', 'buenas tardes', 'inicio', 'empezar'],
        intent: 'GREETING',
        response: '¡Hola! Somos el Equipo de Soporte de CarMatch. 👨‍💻\nEstamos aquí para ayudarte a vender tu auto, encontrar uno nuevo o gestionar tu negocio en nuestra red social.\n\n¿En qué podemos ayudarte?'
    },
    {
        keywords: ['vender', 'subir', 'publicar', 'anunciar', 'foto'],
        intent: 'UPLOAD_VEHICLE',
        response: 'Para vender tu auto, ve a la sección "Vender". \n\nRecuerda:\n1. Sube fotos claras.\n2. El primer auto es GRATIS por 6 meses.\n3. Nuestro equipo de seguridad verificará tu publicación rápidamente.',
        actionLink: '/sell',
        actionText: 'Ir a Vender'
    },
    {
        keywords: ['precio', 'costo', 'pagar', 'creditos', 'créditos', 'dinero', 'gratis'],
        intent: 'PAYMENTS',
        response: 'Manejamos un sistema híbrido accesible:\n\n- **1er Auto:** Gratis (6 meses).\n- **2do en adelante:** 7 días gratis, luego requieres créditos.\n- **Negocios:** Primer mes gratis.\n\nPuedes adquirir créditos de forma segura para mayor visibilidad.',
        actionLink: '/credits',
        actionText: 'Ver Paquetes'
    },
    {
        keywords: ['mapa', 'negocio', 'taller', 'lavado', 'ubicacion', 'tienda'],
        intent: 'MAP_STORE',
        response: 'MapStore conecta conductores con servicios locales.\n\nSi tienes un taller o autolavado, regístralo para que nuestra comunidad te encuentre fácilmente.',
        actionLink: '/map',
        actionText: 'Explorar Mapa'
    },
    {
        keywords: ['revision', 'pendiente', 'rechazado', 'ia', 'verificacion'],
        intent: 'MODERATION',
        response: 'Nuestro equipo de moderación revisa cuidadosamente todas las publicaciones.\n\nSi está "Pendiente", danos un momento. Si fue "Rechazado", verifica que la foto sea real y corresponda a un vehículo terrestre motorizado.'
    }
]

export function findBestResponse(input: string): ChatResponse {
    const normalizedInput = input.toLowerCase()

    // Buscar la mejor coincidencia basada en palabras clave
    const match = KNOWLEDGE_BASE.find(item =>
        item.keywords.some(keyword => normalizedInput.includes(keyword))
    )

    if (match) return match

    return {
        keywords: [],
        intent: 'UNKNOWN',
        response: 'Entiendo. No estoy seguro de tener la respuesta exacta para eso, pero puedo llevarte al menú principal para que encuentres lo que buscas.',
        actionLink: '/',
        actionText: 'Ir al Inicio'
    }
}
