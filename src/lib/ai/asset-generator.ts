import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary only if keys exist
if (process.env.CLOUDINARY_API_KEY) {
    cloudinary.config({
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    })
}

// Automotive fallback images (Unsplash direct photo URLs - always work)
const AUTOMOTIVE_FALLBACKS = [
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1469285994282-454cbe0daa37?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1485291571150-772bcfc10da5?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1080&q=80',
]

function getRandomFallback(): string {
    return AUTOMOTIVE_FALLBACKS[Math.floor(Math.random() * AUTOMOTIVE_FALLBACKS.length)]
}

export async function generatePollinationsImage(prompt: string, width: number = 1080, height: number = 1350): Promise<string> {

    // 1. DIRECT GENERATION (Pollinations.ai)
    // This is now purely a fallback/free generator. 
    // The Replicate logic is handled in the parent function (ai-content-actions.ts)
    // to avoid circular dependencies and ensure clean fallback.

    // 2. Fallback: Pollinations.ai (Free, good quality)
    try {
        console.log('[AI-GEN] Attempting Pollinations Image...');

        // Limit prompt length to avoid URL errors (Pollinations/Browser limit)
        const safePrompt = prompt.trim().substring(0, 800)
        const encodedPrompt = encodeURIComponent(safePrompt)

        // Add random seed to ensure variety
        const randomSeed = Math.floor(Math.random() * 1000000)

        // Construct URL with high quality parameters
        // Model: flux (best for realism)
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&seed=${randomSeed}&nologo=true`

        // 🛡️ PERSISTENCE: Pollinations generates on-the-fly when the URL is hit. 
        // We MUST upload it to Cloudinary so that the UI can load it instantly without crashing or getting 530s from Cloudflare.
        if (process.env.CLOUDINARY_API_KEY) {
            console.log('[AI-GEN] Downloading Pollinations image to Vercel memory...');
            try {
                // Fetch the image to NextJS server memory directly
                const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
                if (!imgRes.ok) throw new Error(`Pollinations returned ${imgRes.status}`);

                const arrayBuffer = await imgRes.arrayBuffer();

                // 🛡️ SECURITY & VALIDATION: Cloudflare might return a 200 OK but the body is HTML (CAPTCHA).
                // A real 1080x1080 JPEG is > 50KB. If it's smaller than 10KB, it's definitely not an image.
                if (arrayBuffer.byteLength < 10000) {
                    throw new Error(`Invalid image payload from Pollinations (size: ${arrayBuffer.byteLength} bytes)`);
                }

                const buffer = Buffer.from(arrayBuffer);
                const base64Str = `data:image/jpeg;base64,${buffer.toString('base64')}`;

                console.log('[AI-GEN] Uploading base64 buffer to Cloudinary...');
                const uploadResult = await cloudinary.uploader.upload(base64Str, {
                    folder: 'carmatch/ai_images',
                    resource_type: 'image'
                });
                return uploadResult.secure_url;
            } catch (upError) {
                console.warn('[AI-GEN] Cloudinary upload/fetch failed, returning fallback.', upError);
                return getRandomFallback();
            }
        }

        // 🛡️ VALIDATION CHECK for RAW URL (if Cloudinary is NOT configured)
        try {
            const check = await fetch(imageUrl, { method: 'HEAD', signal: AbortSignal.timeout(4000) });
            if (!check.ok) {
                console.warn(`[AI-GEN] Pollinations check failed (${check.status}). Using Stock Fallback.`);
                return getRandomFallback();
            }
        } catch (validationErr) {
            console.warn('[AI-GEN] Pollinations unreachable. Using automotive stock fallback.');
            return getRandomFallback();
        }

        return imageUrl
    } catch (error) {
        console.error('Error generating image URL:', error)
        // Fallback to a high-quality automotive stock image
        return getRandomFallback();
    }
}

/**
 * Creates a 15-second Ken Burns style video from an AI generated image using Cloudinary's dynamic video generation.
 * This completely avoids doing local rendering, saving RAM on the host machine.
 */
export async function generateCloudinaryKenBurnsVideo(prompt: string, width: number = 1080, height: number = 1920): Promise<string> {
    try {
        console.log('[AI-VIDEO] Step 1: Generating base image via Pollinations...');
        const imageUrl = await generatePollinationsImage(prompt, width, height);

        if (!process.env.CLOUDINARY_API_KEY) {
            console.warn('[AI-VIDEO] No Cloudinary keys found. Returning base image instead of video.');
            return imageUrl;
        }

        console.log('[AI-VIDEO] Step 2: Uploading image to Cloudinary for Video Conversion...');
        const uploadResult = await cloudinary.uploader.upload(imageUrl, {
            folder: 'carmatch/ai_videos',
            resource_type: 'image'
        });

        console.log('[AI-VIDEO] Step 3: Generating Zoompan MP4 URL...');
        // Cloudinary syntax to convert an image to an MP4 with a pan/zoom effect
        // e.g. https://res.cloudinary.com/cloud_name/image/upload/e_zoompan/v12345/carmatch/ai_videos/xyz.mp4
        const videoUrl = cloudinary.url(uploadResult.public_id, {
            resource_type: 'image',
            format: 'mp4',
            transformation: [
                { effect: 'zoompan' }
            ]
        });

        return videoUrl;
    } catch (e: any) {
        console.error('[AI-VIDEO] Error generating Cloudinary Video:', e);
        // Fallback: If video conversion fails, just give them a stock image
        return getRandomFallback();
    }
}

