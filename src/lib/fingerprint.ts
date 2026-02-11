// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

/**
 * 🛡️ Sistema de Huella Digital Anti-Fraude
 * Detecta fraude vs. venta legítima
 * Incluye auto-redirect para fraudulentos
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs'

// Inicializar FingerprintJS
let fpPromise: Promise<any> | null = null

export async function initFingerprint() {
    if (!fpPromise) {
        fpPromise = FingerprintJS.load()
    }
    return fpPromise
}

/**
 * Generar huella digital del dispositivo e inyectar en cookie para el servidor
 */
export async function generateDeviceFingerprint() {
    try {
        const fp = await initFingerprint()
        const result = await fp.get()

        // Componentes de la huella
        const components = result.components
        const visitorId = result.visitorId

        // 🛡️ Guardar en cookie para que el servidor (NextAuth/API) pueda verla
        if (typeof document !== 'undefined') {
            document.cookie = `device-fingerprint=${visitorId}; path=/; max-age=${365 * 24 * 60 * 60}; samesite=lax`
        }

        return {
            visitorId: visitorId, // ID único del dispositivo
            confidence: result.confidence.score, // 0-1

            // Detalles del dispositivo
            platform: components.platform?.value || 'unknown',
            screenResolution: `${components.screenResolution?.value?.[0]}x${components.screenResolution?.value?.[1]}`,
            timezone: components.timezone?.value || 'unknown',
            language: components.languages?.value?.[0]?.[0] || 'unknown',
            hardwareConcurrency: components.hardwareConcurrency?.value || 0,
            deviceMemory: components.deviceMemory?.value || 0,

            // Hashes únicos
            canvasHash: components.canvas?.value || '',
            webglHash: components.webgl?.value || '',

            // Timestamp
            createdAt: new Date().toISOString()
        }
    } catch (error) {
        console.error('Error generating fingerprint:', error)
        return null
    }
}

/**
 * Calcular hash perceptual de imagen (pHash)
 * Detecta imágenes similares incluso con modificaciones
 */
export async function calculateImageHash(imageUrl: string): Promise<string> {
    try {
        // Usar canvas para generar hash perceptual
        const img = new Image()
        img.crossOrigin = 'Anonymous'

        return new Promise((resolve, reject) => {
            img.onload = () => {
                const canvas = document.createElement('canvas')
                const size = 32 // Reducir a 32x32 para comparación
                canvas.width = size
                canvas.height = size

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject('Canvas context not available')
                    return
                }

                // Dibujar y convertir a escala de grises
                ctx.drawImage(img, 0, 0, size, size)
                const imageData = ctx.getImageData(0, 0, size, size)

                // Calcular hash simple basado en píxeles
                let hash = ''
                for (let i = 0; i < imageData.data.length; i += 4) {
                    const gray = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3
                    hash += gray > 128 ? '1' : '0'
                }

                resolve(hash)
            }

            img.onerror = () => reject('Failed to load image')
            img.src = imageUrl
        })
    } catch (error) {
        console.error('Error calculating image hash:', error)
        return ''
    }
}

/**
 * Comparar similitud entre dos hashes perceptuales
 */
export function compareImageHashes(hash1: string, hash2: string): number {
    if (!hash1 || !hash2 || hash1.length !== hash2.length) return 0

    let matches = 0
    for (let i = 0; i < hash1.length; i++) {
        if (hash1[i] === hash2[i]) matches++
    }

    return (matches / hash1.length) * 100 // % de similitud
}

/**
 * Calcular distancia entre dos puntos GPS
 */
export function calculateGPSDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371e3 // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lng2 - lng1) * Math.PI / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distancia en metros
}

/**
 * Analizar patrón de ubicación GPS
 */
export function analyzeGPSPattern(
    originalLat: number,
    originalLng: number,
    newLat: number,
    newLng: number
) {
    const distance = calculateGPSDistance(originalLat, originalLng, newLat, newLng)

    if (distance < 50) {
        return {
            verdict: 'SAME_LOCATION',
            distance,
            confidence: 95,
            fraudProbability: 90,
            reason: 'Misma casa/edificio'
        }
    } else if (distance < 1000) {
        return {
            verdict: 'SAME_NEIGHBORHOOD',
            distance,
            confidence: 70,
            fraudProbability: 60,
            reason: 'Misma colonia/barrio'
        }
    } else if (distance < 10000) {
        return {
            verdict: 'SAME_CITY',
            distance,
            confidence: 40,
            fraudProbability: 30,
            reason: 'Misma ciudad, zonas diferentes'
        }
    } else {
        return {
            verdict: 'DIFFERENT_CITY',
            distance,
            confidence: 80,
            fraudProbability: 10,
            reason: 'Ciudades diferentes'
        }
    }
}

/**
 * Comparar estilo de escritura entre dos textos
 */
export function compareWritingStyle(text1: string, text2: string): number {
    // Normalizar textos
    const normalize = (text: string) => text.toLowerCase().trim()
    const t1 = normalize(text1)
    const t2 = normalize(text2)

    // Indicadores
    const indicators = {
        // 1. Longitud similar
        lengthSimilarity: 1 - Math.abs(t1.length - t2.length) / Math.max(t1.length, t2.length),

        // 2. Emojis
        emojiCount1: (t1.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length,
        emojiCount2: (t2.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length,

        // 3. Puntuación
        punctuation1: (t1.match(/[.!?]/g) || []).length,
        punctuation2: (t2.match(/[.!?]/g) || []).length,

        // 4. Palabras únicas comunes
        words1: new Set(t1.split(/\s+/)),
        words2: new Set(t2.split(/\s+/))
    }

    // Calcular intersección de palabras
    const commonWords = new Set(
        [...indicators.words1].filter(word => indicators.words2.has(word))
    )
    const wordSimilarity = (commonWords.size * 2) /
        (indicators.words1.size + indicators.words2.size)

    // Similitud de emojis
    const emojiSimilarity = indicators.emojiCount1 === indicators.emojiCount2 ? 1 : 0

    // Similitud de puntuación
    const punctuationSimilarity = 1 - Math.abs(indicators.punctuation1 - indicators.punctuation2) / 10

    // Promedio ponderado
    const similarity = (
        wordSimilarity * 0.5 +
        indicators.lengthSimilarity * 0.2 +
        emojiSimilarity * 0.15 +
        punctuationSimilarity * 0.15
    ) * 100

    return Math.min(100, similarity)
}

/**
 * Detectar si es una venta legítima vs fraude
 */
export function isLegitimateResale(params: {
    daysPassed: number
    gpsDistance: number
    priceDifference: number
    descriptionSimilarity: number
    imageSimilarity: number
    originalMarkedSold: boolean
}): { score: number, isLegit: boolean, reason: string } {
    let score = 0
    const reasons: string[] = []

    // 1. Tiempo transcurrido
    if (params.daysPassed > 30) {
        score += 20
        reasons.push('Más de 30 días después')
    } else if (params.daysPassed > 7) {
        score += 10
        reasons.push('Más de 7 días después')
    }

    // 2. Distancia GPS
    if (params.gpsDistance > 5000) {
        score += 25
        reasons.push('Ubicación muy diferente (5km+)')
    } else if (params.gpsDistance > 1000) {
        score += 15
        reasons.push('Ubicación diferente')
    }

    // 3. Cambio de precio
    if (params.priceDifference > 10) {
        score += 15
        reasons.push('Precio modificado significativamente')
    }

    // 4. Descripción diferente
    if (params.descriptionSimilarity < 70) {
        score += 15
        reasons.push('Estilo de escritura diferente')
    }

    // 5. Imágenes diferentes
    if (params.imageSimilarity < 80) {
        score += 10
        reasons.push('Fotos diferentes')
    }

    // 6. Marcado como vendido
    if (params.originalMarkedSold) {
        score += 5
        reasons.push('Publicación original marcada como vendida')
    }

    return {
        score,
        isLegit: score > 60,
        reason: reasons.join(', ')
    }
}

/**
 * Helper: Generar hash de vehículo único
 */
export function generateVehicleHash(vehicle: {
    brand: string
    model: string
    year: number
    color?: string
}): string {
    const data = `${vehicle.brand}-${vehicle.model}-${vehicle.year}-${vehicle.color || ''}`
    return btoa(data).substring(0, 20)
}
