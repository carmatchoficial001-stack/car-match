import { prisma } from '@/lib/db'
import { uploadBufferToCloudinary } from '@/lib/cloudinary-server'

/**
 * Core image generation logic shared between API Route and Worker
 */
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

    // Fetch and Upload to Cloudinary
    const imageRes = await fetch(imageUrl);
    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const upload = await uploadBufferToCloudinary(buffer);
    if (!upload.success) throw new Error(`Upload to Cloudinary failed: ${upload.error}`);

    // Update Database
    const msg = await prisma.studioMessage.findUnique({ where: { id: messageId } });
    if (!msg) throw new Error("Message not found in DB");
    
    const upImages = (msg.images as any) || {};

    // Internal branding logic (Organic)
    const brandedUrl = upload.secure_url!; 

    upImages[`img_${idx}_${format}`] = brandedUrl;
    if (format === 'square') upImages['square'] = brandedUrl;
    
    if (idx === 0) {
        if (format === 'vertical') upImages['vertical'] = brandedUrl;
        if (format === 'horizontal') upImages['horizontal'] = brandedUrl;
    }

    upImages['_lastUpdate'] = Date.now();
    
    await prisma.studioMessage.update({ 
        where: { id: messageId }, 
        data: { images: upImages } 
    });

    return { success: true, url: brandedUrl };
}
