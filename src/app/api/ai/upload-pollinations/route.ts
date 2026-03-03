import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// ---------------------------------------------------------
// /api/ai/upload-pollinations
// Proxy que descarga una imagen de Pollinations.ai desde
// el servidor con headers de navegador y la sube a Cloudinary.
// Esto sortea el bloqueo 530 de Cloudflare que afecta a IPs
// de centros de datos cuando el <img> tag intenta cargar la URL.
// ---------------------------------------------------------

if (process.env.CLOUDINARY_API_KEY) {
    cloudinary.config({
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    })
}

// Headers que simulan un navegador Chrome real para pasar el challenge de Cloudflare
const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://pollinations.ai/',
    'Origin': 'https://pollinations.ai',
    'Sec-Fetch-Dest': 'image',
    'Sec-Fetch-Mode': 'no-cors',
    'Sec-Fetch-Site': 'same-site',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
}

const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1469285994282-454cbe0daa37?auto=format&fit=crop&w=1080&q=80',
]

function getRandomFallback() {
    return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)]
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { pollinationsUrl, imageBase64, contentType: bodyContentType } = body

        // ─── MODO 1: El browser ya descargó la imagen y nos envía base64 ────────
        // Este es el camino preferido: el browser pasa el challenge de Cloudflare,
        // nosotros solo subimos el blob recibido a Cloudinary.
        if (imageBase64) {
            if (!process.env.CLOUDINARY_API_KEY) {
                console.warn('[PROXY] Sin Cloudinary keys. No se puede subir base64.')
                return NextResponse.json({ success: false, error: 'Sin Cloudinary keys' })
            }

            try {
                // imageBase64 ya viene como data URI (data:image/...;base64,...)
                console.log('[PROXY] Subiendo imagen pre-fetcheada por browser a Cloudinary...')
                const uploadResult = await cloudinary.uploader.upload(imageBase64, {
                    folder: 'carmatch/ai_generated',
                    resource_type: 'image',
                    quality: 'auto:good',
                    fetch_format: 'auto',
                })
                console.log('[PROXY] ✅ Upload exitoso (browser-fetched):', uploadResult.secure_url)
                return NextResponse.json({ success: true, cloudinaryUrl: uploadResult.secure_url })
            } catch (uploadError: any) {
                console.error('[PROXY] Error subiendo base64 a Cloudinary:', uploadError.message)
                return NextResponse.json({
                    success: false,
                    fallbackUrl: getRandomFallback(),
                    error: uploadError.message
                }, { status: 500 })
            }
        }

        // ─── MODO 2: Descarga desde URL (fallback legacy) ────────────────────────
        if (!pollinationsUrl || typeof pollinationsUrl !== 'string') {
            return NextResponse.json({ success: false, error: 'pollinationsUrl o imageBase64 requerida' }, { status: 400 })
        }

        // Si ya es una URL de Cloudinary, devolvemos directo
        if (pollinationsUrl.includes('res.cloudinary.com')) {
            return NextResponse.json({ success: true, cloudinaryUrl: pollinationsUrl })
        }

        // Si no hay keys de Cloudinary, no podemos subir
        if (!process.env.CLOUDINARY_API_KEY) {
            console.warn('[PROXY] Sin Cloudinary keys. Devolviendo URL original.')
            return NextResponse.json({ success: false, fallbackUrl: pollinationsUrl })
        }

        console.log('[PROXY] Descargando imagen de Pollinations con headers de navegador...')

        // Intentar descargar con timeout de 25s (Pollinations puede tardar)
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 25000)

        let imageBuffer: ArrayBuffer
        try {
            const response = await fetch(pollinationsUrl, {
                headers: BROWSER_HEADERS as HeadersInit,
                signal: controller.signal,
            })
            clearTimeout(timeout)

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} al descargar imagen`)
            }

            const contentType = response.headers.get('content-type') || 'image/jpeg'
            if (!contentType.startsWith('image/')) {
                throw new Error(`Tipo de contenido inválido: ${contentType}`)
            }

            imageBuffer = await response.arrayBuffer()
            console.log(`[PROXY] Imagen descargada: ${(imageBuffer.byteLength / 1024).toFixed(1)}KB`)
        } catch (downloadError: any) {
            clearTimeout(timeout)
            console.error('[PROXY] Error descargando imagen:', downloadError.message)
            const fallbackUrl = getRandomFallback()
            return NextResponse.json({
                success: false,
                fallbackUrl,
                error: `No se pudo descargar la imagen generada. Usando imagen de stock.`
            })
        }

        const base64 = Buffer.from(imageBuffer).toString('base64')
        const dataUri = `data:image/jpeg;base64,${base64}`

        console.log('[PROXY] Subiendo a Cloudinary...')
        const uploadResult = await cloudinary.uploader.upload(dataUri, {
            folder: 'carmatch/ai_generated',
            resource_type: 'image',
            quality: 'auto:good',
            fetch_format: 'auto',
        })

        console.log('[PROXY] ✅ Subida exitosa:', uploadResult.secure_url)
        return NextResponse.json({ success: true, cloudinaryUrl: uploadResult.secure_url })

    } catch (error: any) {
        console.error('[PROXY] Error general:', error)
        return NextResponse.json({
            success: false,
            fallbackUrl: getRandomFallback(),
            error: error.message
        }, { status: 500 })
    }
}
