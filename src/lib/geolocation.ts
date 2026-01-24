/**
 * Biblioteca de funciones de geolocalización para CarMatch
 * Soporta:
 * - Cálculo de distancias con fórmula de Haversine
 * - Obtención de ubicación GPS del navegador
 * - Geocodificación reversa (coordenadas → ciudad)
 */

export interface Coordinates {
    latitude: number
    longitude: number
}

export interface LocationData extends Coordinates {
    city?: string
    state?: string
    country?: string
    countryCode?: string
}

/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
 * @param lat1 Latitud del punto 1
 * @param lon1 Longitud del punto 1
 * @param lat2 Latitud del punto 2
 * @param lon2 Longitud del punto 2
 * @returns Distancia en kilómetros
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371 // Radio de la Tierra en km
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c
    return Math.round(distance * 10) / 10 // Redondear a 1 decimal
}

/**
 * Convierte grados a radianes
 */
function toRad(degrees: number): number {
    return degrees * (Math.PI / 180)
}

/**
 * Obtiene la ubicación GPS actual del usuario usando la API del navegador
 * @returns Promise con las coordenadas o error
 */
// Helper para envolver getCurrentPosition en Promise
function getPosition(options?: PositionOptions): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                })
            },
            (error) => {
                reject(error)
            },
            options
        )
    })
}

/**
 * Obtiene la ubicación aproximada basada en la IP del usuario (Fallback 3)
 */
async function getLocationFromIP(): Promise<Coordinates> {
    try {
        const response = await fetch('https://ipapi.co/json/')
        const data = await response.json()
        if (data.latitude && data.longitude) {
            return {
                latitude: data.latitude,
                longitude: data.longitude
            }
        }
        throw new Error('IP localization failed')
    } catch (error) {
        // Fallback final: Ciudad de México si todo falla
        return {
            latitude: 19.4326,
            longitude: -99.1332
        }
    }
}

export async function getUserLocation(): Promise<Coordinates> {
    if (!navigator.geolocation) {
        throw new Error('Geolocalización no soportada en este navegador')
    }

    try {
        // Intento 1: Alta precisión (Aumentado a 15s para dar más tiempo)
        return await getPosition({
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        })
    } catch (error: any) {
        console.warn('⚠️ Falló GPS alta precisión:', error.message, '- Reintentando con baja precisión...')

        try {
            // Intento 2: Baja precisión (Wifi/Cell/IP) - Más rápido y robusto
            return await getPosition({
                enableHighAccuracy: false,
                timeout: 60000, // 60s timeout para fallback (muy tolerante)
                maximumAge: Infinity // Aceptamos cualquier posición cacheada
            })
        } catch (retryError: any) {
            console.warn('⚠️ Falló GPS baja precisión. Intentando fallback por IP...')

            try {
                // Intento 3: Ubicación por IP (Fallback final para PCs sin GPS)
                return await getLocationFromIP()
            } catch (ipError: any) {
                let message = 'Error al obtener ubicación. Intenta ingresarla manualmente.'
                const finalError = ipError || retryError || error

                if (finalError.code === 1) message = 'Permiso de ubicación denegado. Actívalo en tu navegador.'
                else if (finalError.code === 2) message = 'Ubicación no disponible en este momento.'
                else if (finalError.code === 3) message = 'Se agotó el tiempo. La señal GPS es débil.'

                throw new Error(message)
            }
        }
    }
}
/**
 * Convierte coordenadas GPS a nombre de ciudad usando MapBox Geocoding API
 * @param latitude Latitud
 * @param longitude Longitud
 * @returns Promise con información de ubicación
 */
export async function reverseGeocode(
    latitude: number,
    longitude: number
): Promise<LocationData> {
    try {
        const response = await fetch(
            `/api/geolocation?lat=${latitude}&lng=${longitude}`
        )

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `Error ${response.status}: Error en geocodificación`)
        }

        const data = await response.json()
        return {
            latitude,
            longitude,
            city: data.city,
            state: data.state,
            country: data.country,
            countryCode: data.countryCode,
        }
    } catch (error) {
        console.error('Error en reverseGeocode:', error)
        return {
            latitude,
            longitude,
        }
    }
}

/**
 * Filtra vehículos dentro de un radio específico
 * @param userLat Latitud del usuario
 * @param userLng Longitud del usuario
 * @param vehicles Lista de vehículos con coordenadas
 * @param radiusKm Radio de búsqueda en kilómetros (default: 12km)
 * @returns Vehículos dentro del radio con distancia calculada
 */
export function filterNearbyVehicles<T extends { latitude?: number | null; longitude?: number | null }>(
    userLat: number,
    userLng: number,
    vehicles: T[],
    radiusKm: number = 12
): Array<T & { distance: number }> {
    return vehicles
        .filter(v => v.latitude != null && v.longitude != null)
        .map(vehicle => ({
            ...vehicle,
            distance: calculateDistance(
                userLat,
                userLng,
                vehicle.latitude!,
                vehicle.longitude!
            ),
        }))
        .filter(v => v.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance)
}

/**
 * Formatea la distancia para mostrar al usuario
 * @param km Distancia en kilómetros
 * @returns String formateado (ej: "1.5 km", "500 m")
 */
export function formatDistance(km: number): string {
    if (km < 1) {
        return `${Math.round(km * 1000)} m`
    }
    return `${km.toFixed(1)} km`
}

/**
 * Busca una ciudad por nombre (Forward Geocoding)
 * @param query Nombre de la ciudad (ej. "Monterrey", "Paris TX")
 * @returns Promise con coordenadas y datos del lugar
 */
export async function searchCity(query: string): Promise<LocationData | null> {
    try {
        const response = await fetch(`/api/geolocation?q=${encodeURIComponent(query)}&limit=1`)
        if (!response.ok) return null
        return await response.json()
    } catch (error) {
        console.error('Error en searchCity:', error)
        return null
    }
}

/**
 * Busca múltiples ciudades candidatas por nombre (para desambiguación)
 * @param query Nombre de la ciudad (ej. "Delicias")
 * @returns Promise con lista de ubicaciones candidatas
 */
export async function searchCities(query: string): Promise<LocationData[]> {
    try {
        const response = await fetch(`/api/geolocation?q=${encodeURIComponent(query)}&limit=5`)
        if (!response.ok) return []
        const data = await response.json()
        if (Array.isArray(data)) return data
        // Si la API devuelve un solo objeto (no array), lo envolvemos
        if (data && data.latitude) return [data]
        return []
    } catch (error) {
        console.error('Error en searchCities:', error)
        return []
    }
}

export const EXPANSION_TIERS = [12, 50, 100, 250, 500, 1000, 5000, 10000]

/**
 * Normaliza el código de país a formato ISO de 2 letras (MX, US, etc)
 * para garantizar la "Frontera Digital" estricta y evitar mostrar autos
 * de otros países a menos que se seleccione explícitamente.
 */
export function normalizeCountryCode(country?: string | null): string {
    if (!country) return 'MX' // Default to MX if undefined

    // Limpiar caracteres no alfanuméricos (evita corruptos como M\0 o M%0)
    const clean = upper.replace(/[^A-Z]/g, '')

    if (clean === 'MX' || clean.includes('MEX') || clean.includes('M')) return 'MX'
    if (clean === 'US' || clean === 'USA' || clean.includes('UNIT') || clean.includes('ESTAD') || clean.includes('EEUU')) return 'US'
    if (clean === 'CA' || clean === 'CAN' || clean.includes('CANADA')) return 'CA'
    if (clean === 'CO' || clean === 'COL' || clean.includes('COLOMBIA')) return 'CO'

    if (clean.length === 2) return clean

    return 'MX'
}
