
type EventType = 'VIEW' | 'CLICK' | 'CONTACT' | 'SEARCH' | 'FAVORITE' | 'SHARE' | 'MAPSTORE_SEARCH' | 'BUSINESS_CLICK'
type EntityType = 'VEHICLE' | 'BUSINESS' | 'APP' | 'PROFILE'

interface TrackOptions {
    entityId?: string
    metadata?: Record<string, any>
}

/**
 * Enviar evento al Cerebro de Estadísticas
 */
export async function trackEvent(
    eventType: EventType,
    entityType: EntityType,
    options: TrackOptions = {}
) {
    try {
        await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventType,
                entityType,
                entityId: options.entityId,
                metadata: options.metadata
            })
        })
    } catch (error) {
        // Fail silently para no afectar UX
        console.error('Analytics fail:', error)
    }
}

/**
 * Tracking específico para MapStore
 */
export async function trackMapStoreSearch(options: {
    category: string          // 'taller_mecanico' | 'refacciones' | etc.
    subcategory?: string      // 'general'
    searchQuery: string       // texto de búsqueda
    city: string
    latitude: number
    longitude: number
    nearestBusinessId?: string
    distanceKm?: number
    clicked?: boolean
}) {
    try {
        await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventType: 'MAPSTORE_SEARCH',
                category: options.category,
                subcategory: options.subcategory || 'general',
                searchQuery: options.searchQuery,
                city: options.city,
                latitude: options.latitude,
                longitude: options.longitude,
                businessId: options.nearestBusinessId,
                distanceKm: options.distanceKm,
                clicked: options.clicked || false
            })
        })
    } catch (error) {
        console.error('MapStore analytics fail:', error)
    }
}

/**
 * Tracking de click en negocio
 */
export async function trackBusinessClick(businessId: string, city: string) {
    try {
        await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventType: 'BUSINESS_CLICK',
                businessId,
                city,
                clicked: true
            })
        })
    } catch (error) {
        console.error('Business click analytics fail:', error)
    }
}
