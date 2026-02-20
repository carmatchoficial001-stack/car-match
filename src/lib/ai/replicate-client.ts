import Replicate from 'replicate'

// Initialize Replicate client
// Requires REPLICATE_API_TOKEN in .env
// We initialize lazily or check for token to avoid build failures
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN || 'MISSING_TOKEN_DURING_BUILD',
})

/**
 * Generate High-End Video using Luma Ray or Minimax via Replicate
 * @param prompt - The scene description
 * @param duration - Target duration (approximate)
 */
export async function generateRealVideo(prompt: string, aspectRatio: '9:16' | '16:9' = '9:16'): Promise<string> {
    if (!process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_TOKEN === 'MISSING_TOKEN_DURING_BUILD') {
        console.warn('⚠️ No REPLICATE_API_TOKEN found. Falling back to simulation.')
        throw new Error('MISSING_API_KEY')
    }

    console.log(`[REPLICATE] Iniciando generación de video real con Luma/Minimax... Prompt: "${prompt.substring(0, 50)}..."`)

    try {
        // MODEL: Minimax (High quality, reliable for public use)
        // Luma Ray can also be used but Minimax is great for motion
        const output = await replicate.run(
            "minimax/video-01",
            {
                input: {
                    prompt: prompt,
                    prompt_optimizer: true
                }
            }
        )

        // Kling/Minimax usually returns a string URL or an array with the URL
        console.log('[REPLICATE] Video generado RAW:', output)

        if (Array.isArray(output) && output.length > 0) {
            return String(output[0])
        }

        if (typeof output === 'object' && output !== null && 'url' in output) {
            return String((output as any).url)
        }

        // VALIDATION: Ensure it looks like a URL
        const outputStr = String(output)
        if (outputStr.startsWith('http')) {
            return outputStr
        }

        console.warn('[REPLICATE] Output is not a URL:', outputStr)
        throw new Error('INVALID_OUTPUT_URL')

    } catch (error: any) {
        console.error('[REPLICATE] Error generating video:', error.message || error)
        if (error.status === 402) {
            console.error('❌ REPLICATE ERROR: Faltan créditos o método de pago (402 Payment Required)');
        }
        throw error
    }
}

/**
 * Generate Photorealistic Image using Flux-Schnell via Replicate
 * @param prompt - The image description
 * @param aspectRatio - Target aspect ratio
 */
export async function generateRealImage(prompt: string, width: number, height: number): Promise<string> {
    if (!process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_TOKEN === 'MISSING_TOKEN_DURING_BUILD') {
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
                    megapixels: "1",
                    output_format: "jpg",
                    output_quality: 90,
                    disable_safety_checker: true
                }
            }
        )

        // Flux returns a ReadableStream or URL depending on version, check types
        // Usually returns an array of URLs [url1, url2]
        console.log('[REPLICATE] Imagen generada RAW:', output)

        if (Array.isArray(output) && output.length > 0) {
            return String(output[0])
        }

        if (typeof output === 'object' && output !== null && 'url' in output) {
            return String((output as any).url)
        }

        return String(output)

    } catch (error: any) {
        console.error('[REPLICATE] Error generating image:', error.message || error)
        if (error.status === 402) {
            console.error('❌ REPLICATE ERROR: Faltan créditos o método de pago (402 Payment Required)');
        }
        throw error
    }
}


/**
 * ASYNC VIDEO GENERATION (Bypasses Vercel 10s Limit)
 */
export async function createVideoPrediction(prompt: string, aspectRatio: '9:16' | '16:9' = '9:16'): Promise<string> {
    if (!process.env.REPLICATE_API_TOKEN) {
        console.error('[REPLICATE] ERROR: Missing REPLICATE_API_TOKEN');
        throw new Error('MISSING_API_KEY');
    }

    try {
        // 🎯 CLEAN PROMPT: Trust Gemini/Ruben 100%. No more hardcoded "styles".
        const cleanPrompt = prompt.trim();

        console.log('[REPLICATE] Iniciando generación de video (Minimax)...');

        const prediction = await replicate.predictions.create({
            model: "minimax/video-01",
            input: {
                prompt: cleanPrompt,
                prompt_optimizer: true
            }
        });
        console.log('[REPLICATE] Predicción de video iniciada:', prediction.id);
        return prediction.id;
    } catch (error: any) {
        console.error('[REPLICATE] Error al crear predicción de video:', error.message || error);
        if (error.message?.includes('402') || error.status === 402) {
            throw new Error('REPLICATE_PAYMENT_REQUIRED');
        }
        if (error.message?.includes('401') || error.status === 401) {
            throw new Error('REPLICATE_AUTH_FAILED');
        }
        throw error;
    }
}

/**
 * ASYNC IMAGE GENERATION (Flux via Predictions)
 */
export async function createImagePrediction(prompt: string, width: number, height: number): Promise<string> {
    if (!process.env.REPLICATE_API_TOKEN) throw new Error('MISSING_API_KEY');

    let aspect_ratio = "1:1"
    if (width > height) aspect_ratio = "16:9"
    if (height > width) aspect_ratio = "9:16"

    try {
        // 🎯 CLEAN PROMPT: Trust Gemini/Ruben 100%. No more hardcoded "styles".
        const cleanPrompt = prompt.trim();

        console.log(`[REPLICATE] Imagen Predicción iniciada (${aspect_ratio})`);

        // 🎯 USE MODEL HANDLE: Always points to latest version and prevents 422 errors.
        const prediction = await replicate.predictions.create({
            model: "black-forest-labs/flux-schnell",
            input: {
                prompt: cleanPrompt,
                aspect_ratio: aspect_ratio,
                go_fast: true,
                output_format: "jpg",
                output_quality: 90,
                disable_safety_checker: true
            }
        });

        console.log(`[REPLICATE] Predicción de imagen OK:`, prediction.id);
        return prediction.id;
    } catch (error: any) {
        console.error(`[REPLICATE] Error crítico en predicción (${aspect_ratio}):`, error.message || error);
        if (error.message?.includes('402') || error.status === 402) {
            throw new Error('REPLICATE_PAYMENT_REQUIRED');
        }
        if (error.message?.includes('401') || error.status === 401) {
            throw new Error('REPLICATE_AUTH_FAILED');
        }
        throw error;
    }
}

export async function checkPrediction(id: string): Promise<{ status: string; output?: any; error?: any; created_at?: string }> {
    if (!process.env.REPLICATE_API_TOKEN) throw new Error('MISSING_API_KEY');

    const prediction = await replicate.predictions.get(id);

    return {
        status: prediction.status,
        output: prediction.output,
        error: prediction.error,
        created_at: prediction.created_at
    };
}
