// Parser de búsqueda inteligente con IA local
// Extrae filtros de búsqueda del lenguaje natural del usuario

interface SearchFilters {
    vehicleType?: string
    color?: string
    doors?: number
    transmission?: string
    fuel?: string
    brand?: string
}

// Diccionario de sinónimos para vehículos
const VEHICLE_SYNONYMS: Record<string, string[]> = {
    pickup: ["pickup", "troca", "camioneta", "pick up", "pik up"],
    suv: ["suv", "camioneta", "4x4", "cuatro por cuatro"],
    sedan: ["sedan", "sedán", "auto", "carro"],
    van: ["van", "minivan", "combi"],
    compact: ["compacto", "compact", "pequeño"],
    sportive: ["deportivo", "sport", "racing"]
}

const COLOR_SYNONYMS: Record<string, string[]> = {
    rojo: ["rojo", "red", "colorado"],
    azul: ["azul", "blue"],
    negro: ["negro", "black", "oscuro"],
    blanco: ["blanco", "white"],
    gris: ["gris", "gray", "grey", "plata", "plateado"],
    verde: ["verde", "green"],
    amarillo: ["amarillo", "yellow"],
    naranja: ["naranja", "orange"]
}

const BRAND_SYNONYMS: Record<string, string[]> = {
    Toyota: ["toyota"],
    Honda: ["honda"],
    Ford: ["ford"],
    Chevrolet: ["chevrolet", "chevy"],
    Nissan: ["nissan"],
    Mazda: ["mazda"],
    Volkswagen: ["volkswagen", "vw", "volks"],
    Hyundai: ["hyundai"],
    Kia: ["kia"],
    BMW: ["bmw"],
    "Mercedes-Benz": ["mercedes", "benz", "mercedes benz", "mercedes-benz"],
    Audi: ["audi"]
}

export function parseNaturalSearch(query: string): SearchFilters {
    const lowerQuery = query.toLowerCase()
    const filters: SearchFilters = {}

    // Detectar tipo de vehículo
    for (const [canonical, synonyms] of Object.entries(VEHICLE_SYNONYMS)) {
        if (synonyms.some(syn => lowerQuery.includes(syn))) {
            // Mapear a nombre correcto
            const typeMap: Record<string, string> = {
                pickup: "Pickup",
                suv: "SUV",
                sedan: "Sedán",
                van: "Van",
                compact: "Compacto",
                sportive: "Deportivo"
            }
            filters.vehicleType = typeMap[canonical]
            break
        }
    }

    // Detectar color
    for (const [canonical, synonyms] of Object.entries(COLOR_SYNONYMS)) {
        if (synonyms.some(syn => lowerQuery.includes(syn))) {
            // Capitalizar primera letra
            filters.color = canonical.charAt(0).toUpperCase() + canonical.slice(1)
            break
        }
    }

    // Detectar número de puertas
    const doorsPatterns = [
        /(\d+)\s*puertas?/i,
        /de\s*(\d+)\s*puertas?/i,
        /(\d+)p/i
    ]
    for (const pattern of doorsPatterns) {
        const match = lowerQuery.match(pattern)
        if (match) {
            const doors = parseInt(match[1])
            if (doors >= 2 && doors <= 5) {
                filters.doors = doors
            }
            break
        }
    }

    // Detectar transmisión
    if (lowerQuery.includes("automatica") || lowerQuery.includes("automática") || lowerQuery.includes("automatic")) {
        filters.transmission = "Automática"
    } else if (lowerQuery.includes("manual") || lowerQuery.includes("estandar") || lowerQuery.includes("estándar")) {
        filters.transmission = "Manual"
    }

    // Detectar combustible
    if (lowerQuery.includes("diesel") || lowerQuery.includes("diésel")) {
        filters.fuel = "Diésel"
    } else if (lowerQuery.includes("gasolina") || lowerQuery.includes("gas")) {
        filters.fuel = "Gasolina"
    } else if (lowerQuery.includes("hibrido") || lowerQuery.includes("híbrido") || lowerQuery.includes("hybrid")) {
        filters.fuel = "Híbrido"
    } else if (lowerQuery.includes("electrico") || lowerQuery.includes("eléctrico") || lowerQuery.includes("electric")) {
        filters.fuel = "Eléctrico"
    }

    // Detectar marca
    for (const [canonical, synonyms] of Object.entries(BRAND_SYNONYMS)) {
        if (synonyms.some(syn => lowerQuery.includes(syn))) {
            filters.brand = canonical
            break
        }
    }

    return filters
}

// Ejemplos de uso:
// parseNaturalSearch("quiero una troca azul de 4 puertas")
// → { vehicleType: "Pickup", color: "Azul", doors: 4 }
//
// parseNaturalSearch("busco un sedan toyota automatico")
// → { vehicleType: "Sedán", brand: "Toyota", transmission: "Automática" }
//
// parseNaturalSearch("quiero una camioneta negra diesel")
// → { vehicleType: "Pickup", color: "Negro", fuel: "Diésel" }
// ... (existing code)

interface BusinessFilters {
    categories: string[]
    services: string[]
}

const PROBLEM_KEYWORDS: Record<string, { category: string, services: string[] }> = {
    // Mecánica
    "suena raro": { category: "mecanico", services: ["Diagnóstico por Computadora", "Motor"] },
    "ruido": { category: "mecanico", services: ["Diagnóstico por Computadora", "Suspensión"] },
    "motor": { category: "mecanico", services: ["Motor", "Afinación"] },
    "aceite": { category: "mecanico", services: ["Cambio de Aceite"] },
    "frenos": { category: "mecanico", services: ["Frenos"] },
    "no arranca": { category: "mecanico", services: ["Diagnóstico por Computadora", "Motor", "Baterías"] },
    "calienta": { category: "mecanico", services: ["Motor", "Sistema de Enfriamiento"] },
    "humo": { category: "mecanico", services: ["Motor", "Afinación"] },

    // Estética
    "pintar": { category: "estetica", services: ["Hojalatería y pintura"] },
    "pintura": { category: "estetica", services: ["Hojalatería y pintura"] },
    "lavar": { category: "estetica", services: ["Car Wash", "Lavado Exterior"] },
    "sucio": { category: "estetica", services: ["Car Wash", "Lavado de Interiores"] },
    "pulir": { category: "estetica", services: ["Detailing / Pulido"] },
    "golpe": { category: "estetica", services: ["Hojalatería y pintura", "Restauración de Choques"] },
    "choque": { category: "estetica", services: ["Hojalatería y pintura", "Restauración de Choques"] },
    "rayones": { category: "estetica", services: ["Detailing / Pulido", "Pintura de Piezas"] },

    // Llantas
    "llanta": { category: "llantas", services: ["Venta de Llantas", "Vulcanizadoras / Ponchadura"] },
    "ponchada": { category: "llantas", services: ["Vulcanizadoras / Ponchadura"] },
    "aire": { category: "llantas", services: ["Vulcanizadoras / Ponchadura"] },
    "alineacion": { category: "llantas", services: ["Alineación y balanceo"] },
    "vibracion": { category: "llantas", services: ["Alineación y balanceo", "Suspensión"] },

    // Eléctrico
    "bateria": { category: "electrico", services: ["Baterías"] },
    "luz": { category: "electrico", services: ["Luces", "Electricidad automotriz"] },
    "foco": { category: "electrico", services: ["Luces"] },
    "aire acondicionado": { category: "electrico", services: ["Aires acondicionados"] },
    "calor": { category: "electrico", services: ["Aires acondicionados"] },
    "alarma": { category: "electrico", services: ["Alarmas"] },

    // Refacciones
    "pieza": { category: "refacciones", services: ["Refaccionarias / Autopartes"] },
    "refaccion": { category: "refacciones", services: ["Refaccionarias / Autopartes"] },
    "accesorio": { category: "refacciones", services: ["Accesorios automotrices"] },
    "stereo": { category: "refacciones", services: ["Audio y alarmas"] },
    "sonido": { category: "refacciones", services: ["Audio y alarmas"] },

    // Cristales
    "vidrio": { category: "cristales", services: ["Reemplazo de cristales"] },
    "parabrisas": { category: "cristales", services: ["Reparación de parabrisas"] },
    "polarizado": { category: "cristales", services: ["Polarizado"] },
}

export function parseBusinessSearch(query: string): BusinessFilters {
    const lowerQuery = query.toLowerCase()
    const filters: BusinessFilters = {
        categories: [],
        services: []
    }

    for (const [keyword, mapping] of Object.entries(PROBLEM_KEYWORDS)) {
        if (lowerQuery.includes(keyword)) {
            if (!filters.categories.includes(mapping.category)) {
                filters.categories.push(mapping.category)
            }
            mapping.services.forEach(service => {
                if (!filters.services.includes(service)) {
                    filters.services.push(service)
                }
            })
        }
    }

    return filters
}
