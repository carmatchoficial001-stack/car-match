import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadBufferToCloudinary } from '@/lib/cloudinary-server'

// 🛡️ VERCEL TIMEOUT FIX
export const maxDuration = 60; // Allow 60 seconds on Vercel for Fal.ai/Cloudinary

function deriveFormatUrl(url: string, format: 'vertical' | 'horizontal' | 'square') {
    if (!url || !url.includes('cloudinary.com')) return url;

    // Si quieres apagar el logo para pruebas, puedes poner esta variable en true en Vercel
    if (process.env.DISABLE_STUDIO_BRANDING === 'true') return url;

    /* 
    // ⚠️ DISABLED: Watermarking corner removed in favor of organic prompt-based branding
    const logoLayer = 'l_carmatch_logo,w_220,g_south_east,x_30,y_30,o_90';
    let segment = '';
    if (format === 'vertical') {
        segment = `c_pad,g_auto,h_1920,w_1080,b_auto/${logoLayer}/fl_layer_apply`;
    } else if (format === 'horizontal') {
        segment = `c_pad,g_auto,h_628,w_1200,b_auto/${logoLayer}/fl_layer_apply`;
    } else {
        segment = `c_fill,h_1080,w_1080/q_auto,f_auto/${logoLayer}/fl_layer_apply`;
    }
    return url.replace('/upload/', `/upload/${segment}/`);
    */
    return url;
}

export async function POST(req: NextRequest) {
    try {
        await prisma.systemLog.create({
            data: { level: 'INFO', message: 'API-ROUTE: Inicio de generación solicitada', source: 'API-ROUTE' }
        });

        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const body = await req.json()
        const { messageId, idx, format, prompt } = body

        if (!messageId || idx === undefined || !format || !prompt) {
            return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 })
        }

        const falKey = process.env.FAL_KEY || "";
        if (!falKey) {
            return NextResponse.json({ success: false, error: "FAL_KEY is not configured. Please add it to your .env file." }, { status: 500 })
        }

        let w = 1024, h = 1024;
        if (format === 'vertical') { w = 768; h = 1344; } // Optimized for FLUX.schnell
        else if (format === 'horizontal') { w = 1344; h = 768; }

        const seed = Math.floor(Math.random() * 1000000);
        const p = prompt + `, high quality, masterpiece, variation ${idx}, professional photography`;

        const startTime = Date.now();
        console.log(`[FAL-AI] Requesting Generation: p=${p.substring(0, 60)}...`);

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

        console.log(`[FAL-AI] Status: ${falRes.status} in ${Date.now() - startTime}ms`);

        if (!falRes.ok) {
            const errBody = await falRes.text();
            throw new Error(`Fal.ai error: ${falRes.status} - ${errBody}`);
        }

        const data = await falRes.json();
        const imageUrl = data.images?.[0]?.url;

        if (!imageUrl) throw new Error("No image URL received from Fal.ai");

        // Fetch the image from Fal.ai to upload it to Cloudinary (to keep everything in your storage)
        const imageRes = await fetch(imageUrl);
        const arrayBuffer = await imageRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const upload = await uploadBufferToCloudinary(buffer);
        if (!upload.success) throw new Error(`Upload to Cloudinary failed: ${upload.error || 'Unknown Cloudinary Error'}`);

        // Update Database
        const msg = await prisma.studioMessage.findUnique({ where: { id: messageId } });
        if (!msg) throw new Error("Message not found details");
        const upImages = (msg.images as any) || {};

        const squareBrandedUrl = deriveFormatUrl(upload.secure_url!, 'square');
        const verticalUrl = deriveFormatUrl(upload.secure_url!, 'vertical');
        const horizontalUrl = deriveFormatUrl(upload.secure_url!, 'horizontal');

        upImages[`img_${idx}_square`] = squareBrandedUrl;
        upImages['square'] = squareBrandedUrl; // Legacy
        upImages[`img_${idx}_vertical`] = verticalUrl;
        upImages[`img_${idx}_horizontal`] = horizontalUrl;

        if (idx === 0) {
            upImages['vertical'] = verticalUrl;
            upImages['horizontal'] = horizontalUrl;
        }

        upImages['_lastUpdate'] = Date.now();
        await prisma.studioMessage.update({ where: { id: messageId }, data: { images: upImages } });

        return NextResponse.json({ success: true, url: upload.secure_url })

    } catch (e: any) {
        console.error("[HF-API-ROUTE] Error:", e)
        return NextResponse.json({ success: false, error: e.message }, { status: 500 })
    }
}
