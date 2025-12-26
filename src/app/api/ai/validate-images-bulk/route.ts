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
        console.log('🔄 Convirtiendo', images.length, 'URLs a base64...')
        const base64Images = await Promise.all(
            images.map(url => urlToBase64(url))
        )
        console.log('✅ Conversión completada, analizando con Gemini...')

        // Analizar todas las imágenes juntas
        const result = await analyzeMultipleImages(base64Images, body.type || 'VEHICLE')

        return NextResponse.json(result)

    } catch (error) {
        console.error('Error en validación bulk:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error al analizar imágenes' },
            { status: 500 }
        )
    }
}
