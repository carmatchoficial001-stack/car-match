import { NextRequest, NextResponse } from 'next/server'
import { analyzeMultipleImages } from '@/lib/ai/imageAnalyzer'

/**
 * Convierte una URL de imagen a base64
 */
async function urlToBase64(url: string): Promise<string> {
    let lastError;
    const maxRetries = 3;

    for (let i = 0; i < maxRetries; i++) {
        try {
            // 🚀 OPTIMIZACIÓN CARMATCH: Si es URL de Cloudinary, pedir versión optimizada
            let fetchUrl = url
            if (url.includes('cloudinary.com') && url.includes('/upload/') && !url.includes('q_auto')) {
                fetchUrl = url.replace('/upload/', '/upload/q_auto,f_auto,w_1200/')
            }

            console.log(`📡 Fetching image [Intento ${i + 1}]: ${fetchUrl === url ? 'Original' : 'Optimized'}...`)

            const response = await fetch(fetchUrl, { signal: AbortSignal.timeout(10000) }) // 10s timeout
            if (!response.ok) throw new Error(`HTTP ${response.status} fetching image`)

            const arrayBuffer = await response.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            return buffer.toString('base64')
        } catch (error) {
            lastError = error;
            console.warn(`⚠️ Error fetching image (${url}), reintentando...`, error);
            if (i < maxRetries - 1) await new Promise(r => setTimeout(r, 1000));
        }
    }

    console.error('❌ Fallo definitivo al obtener imagen:', url, lastError)
    throw lastError || new Error(`Failed to fetch image from URL: ${url}`)
}

/**
 * Endpoint para analizar MÚLTIPLES imágenes del vehículo
 * POST /api/ai/validate-images-bulk
 * Body: { images: string[] } // Array de URLs de Cloudinary
 */
export async function POST(request: NextRequest) {
    // ⚠️ CRITICAL: DO NOT MODIFY. FAIL-OPEN LOGIC IS REQUIRED FOR UX.
    try {
        const body = await request.json()
        const { images } = body

        if (!images || !Array.isArray(images) || images.length === 0) {
            return NextResponse.json(
                { error: 'Se requiere un array de imágenes' },
                { status: 400 }
            )
        }

        if (images.length > 10) {
            return NextResponse.json(
                { error: 'Máximo 10 imágenes permitidas' },
                { status: 400 }
            )
        }

        // Convertir URLs de Cloudinary a base64
        console.log('🔄 Convirtiendo', images.length, 'URLs a base64 para análisis bulk...')
        const base64Images = await Promise.all(
            images.map(url => urlToBase64(url))
        )
        console.log('✅ Conversión completada, analizando con Gemini...')

        // Analizar todas las imágenes juntas con el contexto opcional
        const result = await analyzeMultipleImages(
            base64Images,
            body.type || 'VEHICLE',
            body.context
        )

        console.log('🤖 Resultado Gemini AI:', {
            valid: result.valid,
            hasDetails: !!result.details && Object.keys(result.details).length > 0,
            invalidCount: result.invalidIndices?.length || 0
        })

        return NextResponse.json(result)

    } catch (error: any) {
        console.error('❌ Error CRÍTICO en validación bulk:', error)
        console.warn('⚠️ FAIL-OPEN ACTIVADO - El usuario no verá el autollenado, pero podrá publicar.')

        // ✅ FAIL-OPEN: En caso de error técnico, aprobar todas las imágenes
        // Esto previene que vehículos legítimos sean rechazados por problemas temporales
        return NextResponse.json(
            {
                valid: true,
                reason: "OK (Aprobado por mantenimiento técnico)",
                details: {},
                invalidIndices: []
            },
            { status: 200 }  // ✅ Cambiar a 200 para que el cliente no lo tome como error
        )
    }
}
