import Replicate from 'replicate'

// Initialize Replicate client
// Requires REPLICATE_API_TOKEN in .env
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
})

/**
 * Generate High-End Video using Luma Ray or Minimax via Replicate
 * @param prompt - The scene description
 * @param duration - Target duration (approximate)
 */
export async function generateRealVideo(prompt: string, aspectRatio: '9:16' | '16:9' = '9:16'): Promise<string> {
    if (!process.env.REPLICATE_API_TOKEN) {
        console.warn('⚠️ No REPLICATE_API_TOKEN found. Falling back to simulation.')
        throw new Error('MISSING_API_KEY')
    }

    console.log(`[REPLICATE] Iniciando generación de video real con Luma/Minimax... Prompt: "${prompt.substring(0, 50)}..."`)

    try {
        // MODEL: Luma Ray / Minimax / Kling
        // Using Minimax (currently very strong for 5s clips) or Luma
        // Let's use Minimax for high stability and motion
        const output = await replicate.run(
            "kwaivgi/kling-v1.6-pro", // Or Minimax/Luma equivalent endpoint
            {
                input: {
                    prompt: prompt,
                    aspect_ratio: aspectRatio,
                    duration: 5 // Start with 5s clips for speed/cost balance
                }
            }
        )

        // Kling/Minimax usually returns a string URL or an array with the URL
        console.log('[REPLICATE] Video generado:', output)
        return String(output)

    } catch (error) {
        console.error('[REPLICATE] Error generating video:', error)
        throw error
    }
}

/**
 * Generate Photorealistic Image using Flux-Schnell via Replicate
 * @param prompt - The image description
 * @param aspectRatio - Target aspect ratio
 */
export async function generateRealImage(prompt: string, width: number, height: number): Promise<string> {
    if (!process.env.REPLICATE_API_TOKEN) {
        throw new Error('MISSING_API_KEY')
    }

    console.log(`[REPLICATE] Iniciando generación de imagen real con Flux... Prompt: "${prompt.substring(0, 50)}..."`)

    try {
        // MODEL: Flux-Schnell (Fast, High Quality)
        // aspect_ratio mapping
        let aspect_ratio = "1:1"
        if (width > height) aspect_ratio = "16:9"
        if (height > width) aspect_ratio = "9:16"

        const output = await replicate.run(
            "black-forest-labs/flux-schnell",
            {
                input: {
                    prompt: prompt,
                    aspect_ratio: aspect_ratio,
                    go_fast: true,
                    megapixels: "1"
                }
            }
        )

        // Flux returns a ReadableStream or URL depending on version, check types
        // Usually returns an array of URLs [url1, url2]
        if (Array.isArray(output) && output.length > 0) {
            console.log('[REPLICATE] Imagen generada:', output[0])
            return String(output[0]) // Ensure string
        }

        return String(output)

    } catch (error) {
        console.error('[REPLICATE] Error generating image:', error)
        throw error
    }
}
