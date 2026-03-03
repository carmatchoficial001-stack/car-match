import { NextRequest, NextResponse } from 'next/server'

// ---------------------------------------------------------
// /api/ai/proxy-image
// CORS proxy: el browser llama a este endpoint con una URL de Pollinations,
// el servidor descarga la imagen y la devuelve como image/jpeg.
// Esto resuelve el bloqueo CORS que impide al browser leer blobs de Pollinations.
// ---------------------------------------------------------

const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://pollinations.ai/',
    'Origin': 'https://pollinations.ai',
    'Cache-Control': 'no-cache',
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const imageUrl = searchParams.get('url')

    if (!imageUrl) {
        return NextResponse.json({ error: 'url param requerida' }, { status: 400 })
    }

    // Solo permitir URLs de Pollinations o dominios seguros conocidos
    const allowedDomains = ['image.pollinations.ai', 'pollinations.ai']
    const isAllowed = allowedDomains.some(d => imageUrl.includes(d))
    if (!isAllowed) {
        return NextResponse.json({ error: 'Dominio no permitido' }, { status: 403 })
    }

    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 30000)

        const response = await fetch(imageUrl, {
            headers: BROWSER_HEADERS as HeadersInit,
            signal: controller.signal,
        })
        clearTimeout(timeout)

        if (!response.ok) {
            return NextResponse.json(
                { error: `HTTP ${response.status} al obtener imagen` },
                { status: response.status }
            )
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg'
        if (!contentType.startsWith('image/')) {
            return NextResponse.json({ error: 'Respuesta no es imagen' }, { status: 422 })
        }

        const buffer = await response.arrayBuffer()
        console.log(`[PROXY-IMAGE] Proxied: ${(buffer.byteLength / 1024).toFixed(1)}KB`)

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*',
            }
        })
    } catch (error: any) {
        console.error('[PROXY-IMAGE] Error:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
