export const DOPAMINE_MESSAGE_TEMPLATES = {
    MAP_VIEW: [
        "Alguien miró tu negocio en el mapa",
        "Tu negocio fue visualizado en MapStore",
        "Una persona exploró tu ubicación",
        "Alguien revisó los detalles de tu negocio",
        "Un usuario cercano vio tu perfil"
    ],

    CATEGORY_SEARCH: [
        "Alguien buscó {category} en tu zona",
        "Tu categoría fue buscada cerca de ti",
        "Búsqueda activa de {category} en {city}",
        "Usuario buscando {category} vio tu negocio",
        "Búsqueda de {category} coincide con tu perfil"
    ],

    NEARBY_ACTIVITY: [
        "{count} personas exploraron negocios cerca del tuyo",
        "Alta actividad en tu zona ({city})",
        "Movimiento en MapStore cerca de tu ubicación",
        "{count} búsquedas en tu área hoy",
        "Tráfico de usuarios detectado en tu zona"
    ],

    ENGAGEMENT: [
        "Tu negocio destaca en búsquedas de {category}",
        "Tu visibilidad ha aumentado esta semana",
        "Apareciste en {count} búsquedas de {category}",
        "Tu negocio es popular en {city}",
        "Tu perfil está ganando tracción"
    ],

    GENERAL: [
        "Alguien está interesado en tus servicios",
        "Nueva visualización de tu perfil",
        "Actividad reciente en tu negocio",
        "Tu negocio llamó la atención",
        "Un cliente potencial vio tu información"
    ]
}

export function generateDopamineMessage(business: any): string {
    const categories = Object.keys(DOPAMINE_MESSAGE_TEMPLATES)
    const randomCategory = categories[Math.floor(Math.random() * categories.length)]
    const templates = DOPAMINE_MESSAGE_TEMPLATES[randomCategory as keyof typeof DOPAMINE_MESSAGE_TEMPLATES]
    const template = templates[Math.floor(Math.random() * templates.length)]

    // Reemplazar placeholders
    return template
        .replace('{category}', business.category || 'servicios automotrices')
        .replace('{city}', business.city || 'tu zona')
        .replace('{count}', String(Math.floor(Math.random() * 8) + 3)) // 3-10
}
