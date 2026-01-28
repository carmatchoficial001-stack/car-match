import { NextRequest, NextResponse } from 'next/server'
import { analyzeMultipleImages } from '@/lib/ai/imageAnalyzer'

/**
 * Convierte una URL de imagen a base64
 */
async function urlToBase64(url: string): Promise<string> {
    try {
        const response = await fetch(url)
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        return buffer.toString('base64')
    } catch (error) {
        console.error('Error converting URL to base64:', url, error)
        throw new Error(`Failed to fetch image from URL: ${url}`)
    }
}

/**
 * Endpoint para analizar MÚLTIPLES imágenes del vehículo
 * POST /api/ai/validate-images-bulk
 * Body: { images: string[] } // Array de URLs de Cloudinary
 */
export async function POST(request: NextRequest) {
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
