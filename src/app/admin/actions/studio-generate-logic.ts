import { prisma } from '@/lib/db'
import { uploadUrlToCloudinary } from '@/lib/cloudinary-server'

/**
 * Core image generation logic shared between API Route and Worker
 */


/**
 * Triggers asynchronous generation on Fal.ai using webhooks to bypass Vercel timeouts.
 */
export async function triggerFalAsyncGeneration(params: {
    messageId: string;
    idx: number;
    format: 'vertical' | 'horizontal' | 'square';
    prompt: string;
    webhookUrl: string;
}) {
    const { messageId, idx, format, prompt, webhookUrl } = params;
    const falKey = process.env.FAL_KEY || "";
    
    let w = 1024, h = 1024;
    if (format === 'vertical') { w = 768; h = 1344; } 
    else if (format === 'horizontal') { w = 1344; h = 768; }

    const seed = Math.floor(Math.random() * 1000000);
    const p = prompt + `, high quality, masterpiece, variation ${idx}, professional photography`;

    // 🧪 Use Fal.ai Queue API (Asynchronous)
    const response = await fetch('https://queue.fal.run/fal-ai/flux/schnell', {
        method: 'POST',
        headers: {
            'Authorization': `Key ${falKey}`,
            'Content-Type': 'application/json',
            'X-Fal-Webhook-Url': webhookUrl
        },
        body: JSON.stringify({
            prompt: p,
            image_size: { width: w, height: h },
            seed: seed,
            num_inference_steps: 4,
            enable_safety_checker: true,
            // Custom metadata to handle the result in the webhook
            metadata: { messageId, idx, format }
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Fal Queue Error: ${response.status} - ${err}`);
    }

    return await response.json();
}

export async function performFalGeneration(params: {
    messageId: string;
    idx: number;
    format: 'vertical' | 'horizontal' | 'square';
    prompt: string;
}) {
    const { messageId, idx, format, prompt } = params;

    const falKey = process.env.FAL_KEY || "";
    if (!falKey) {
        throw new Error("FAL_KEY is not configured.");
    }

    let w = 1024, h = 1024;
    if (format === 'vertical') { w = 768; h = 1344; } 
    else if (format === 'horizontal') { w = 1344; h = 768; }

    const seed = Math.floor(Math.random() * 1000000);
    const p = prompt + `, high quality, masterpiece, variation ${idx}, professional photography`;

    console.log(`[FAL-CORE] Generating [${idx}/${format}]: ${p.substring(0, 40)}...`);

    const falRes = await fetch('https://fal.run/fal-ai/flux/schnell', {
        method: 'POST',
        headers: {
            'Authorization': `Key ${falKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt: p,
            image_size: { width: w, height: h },
            seed: seed,
            num_inference_steps: 4,
            enable_safety_checker: true
        })
    });

    if (!falRes.ok) {
        const errBody = await falRes.text();
        throw new Error(`Fal.ai error: ${falRes.status} - ${errBody}`);
    }

    const data = await falRes.json();
    const imageUrl = data.images?.[0]?.url;
    if (!imageUrl) throw new Error("No image URL received from Fal.ai");

    // 🚀 Speed Optimization: Direct URL-to-Cloudinary upload (Skip fetch to buffer)
    const upload = await uploadUrlToCloudinary(imageUrl);
    if (!upload.success) throw new Error(`Upload to Cloudinary failed: ${upload.error}`);

    // Update Database: AI-Native Branding (no Cloudinary overlays)
    const rawUrl = upload.secure_url!;

    const imagesToMerge: Record<string, any> = {
        [`img_${idx}_${format}`]: rawUrl,
        '_lastUpdate': Date.now()
    };

    if (format === 'square') imagesToMerge['square'] = rawUrl;
    if (idx === 0) {
        if (format === 'vertical') imagesToMerge['vertical'] = rawUrl;
        if (format === 'horizontal') imagesToMerge['horizontal'] = rawUrl;
    }

    const jsonToMerge = JSON.stringify(imagesToMerge);

    await prisma.$executeRawUnsafe(
        `UPDATE "StudioMessage" SET images = COALESCE(images, '{}'::jsonb) || $1::jsonb WHERE id = $2`,
        jsonToMerge,
        messageId
    );

    return { success: true, url: upload.secure_url };
}
