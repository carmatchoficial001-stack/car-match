import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadBufferToCloudinary } from '@/lib/cloudinary-server'

// 🛡️ VERCEL TIMEOUT FIX
export const maxDuration = 60; // Allow 60 seconds on Vercel for HuggingFace/Cloudinary

function deriveFormatUrl(url: string, format: 'vertical' | 'horizontal' | 'square') {
    if (!url || !url.includes('cloudinary.com')) return url;
    const logoLayer = 'l_carmatch:branding:carmatch_logo_v20,w_220,g_south_east,x_30,y_30,o_90';
    let segment = '';
    if (format === 'vertical') {
        segment = `c_pad,g_auto,h_1920,w_1080,b_auto/${logoLayer}/fl_layer_apply`;
    } else if (format === 'horizontal') {
        segment = `c_pad,g_auto,h_628,w_1200,b_auto/${logoLayer}/fl_layer_apply`;
    } else {
        segment = `c_fill,h_1080,w_1080/q_auto,f_auto/${logoLayer}/fl_layer_apply`;
    }
    return url.replace('/upload/', `/upload/${segment}/`);
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const body = await req.json()
        const { messageId, idx, format, prompt } = body

        if (!messageId || idx === undefined || !format || !prompt) {
            return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 })
        }

        const hfKey = process.env.HUGGINGFACE_API_KEY || "";
        if (!hfKey) {
            return NextResponse.json({ success: false, error: "Missing HUGGINGFACE_API_KEY" }, { status: 500 })
        }

        let w = 1024, h = 1024;
        if (format === 'vertical') { w = 832; h = 1216; }
        else if (format === 'horizontal') { w = 1216; h = 832; }

        const seed = Math.floor(Math.random() * 1000000);
        const p = prompt + `, high quality, masterpiece, variation ${idx}, professional photography, seed ${seed}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        let hfRes;
        try {
            hfRes = await fetch('https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${hfKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ inputs: p, parameters: { width: w, height: h } }),
                signal: controller.signal
            });
        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            throw new Error(`HF fetch failed: ${fetchError.message}`);
        }
        clearTimeout(timeoutId);

        if (!hfRes.ok) {
            const errBody = await hfRes.text();
            throw new Error(`HF error: ${hfRes.status} - ${errBody.substring(0, 100)}`);
        }

        const arrayBuffer = await hfRes.arrayBuffer();
        if (arrayBuffer.byteLength < 5000) throw new Error("Image received is too small");
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
