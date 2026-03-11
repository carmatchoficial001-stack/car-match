import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { uploadUrlToCloudinary } from '@/lib/cloudinary-server';

/**
 * Webhook handler for Fal.ai asynchronous generation
 */
export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        
        // Fal.ai usually sends data in this format for webhooks
        // We'll pass custom metadata (messageId, idx, format) in the request
        const { request_id, status, payload, metadata } = data;

        if (status !== 'OK') {
            console.error(`[STUDIO-WEBHOOK] Generation failed for request ${request_id}:`, data);
            return NextResponse.json({ ok: false });
        }

        const imageUrl = payload?.images?.[0]?.url;
        if (!imageUrl) {
            console.error(`[STUDIO-WEBHOOK] No image URL in payload:`, data);
            return NextResponse.json({ ok: false });
        }

        const { messageId, postId, idx, format } = metadata || {};
        
        if (!messageId && !postId) {
            console.error(`[STUDIO-WEBHOOK] Missing identification (messageId/postId) in metadata`);
            return NextResponse.json({ ok: false });
        }

        console.log(`[STUDIO-WEBHOOK] Received image for ${messageId || postId} [${idx}/${format}]`);

        // 1. Upload to Cloudinary (Speed optimization: Direct URL upload)
        const uploadRes = await uploadUrlToCloudinary(imageUrl);
        if (!uploadRes.success) {
            console.error(`[STUDIO-WEBHOOK] Cloudinary upload failed:`, uploadRes.error);
            return NextResponse.json({ ok: false });
        }

        const secureUrl = uploadRes.secure_url!;

        // 2. Atomic Database Update
        if (messageId) {
            const imagesToMerge: Record<string, any> = {
                [`img_${idx}_${format}`]: secureUrl,
                '_lastUpdate': Date.now(),
                '_isBatchWorking': false // Release lock
            };

            // Fallback for legacy UI expectations
            if (format === 'square') imagesToMerge['square'] = secureUrl;
            if (idx === 0) {
                if (format === 'vertical') imagesToMerge['vertical'] = secureUrl;
                if (format === 'horizontal') imagesToMerge['horizontal'] = secureUrl;
            }

            const jsonToMerge = JSON.stringify(imagesToMerge);

            await prisma.$executeRawUnsafe(
                `UPDATE "StudioMessage" SET images = COALESCE(images, '{}'::jsonb) || $1::jsonb WHERE id = $2`,
                jsonToMerge,
                messageId
            );
        } else if (postId) {
            // Update SocialPost record
            // We'll use metadata Json field in SocialPost to store the multiple sizes if needed, 
            // or just update primary imageUrl for the first one.
            
            // Let's store all sizes in the metadata since SocialPost only has one imageUrl field
            const metaUpdate = JSON.stringify({
                [`img_${format}`]: secureUrl,
                '_lastUpdate': Date.now()
            });

            await prisma.$executeRawUnsafe(
                `UPDATE "SocialPost" SET "imageUrl" = (CASE WHEN "imageUrl" IS NULL OR "imageUrl" = '' THEN $1 ELSE "imageUrl" END), metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb, status = 'APPROVED' WHERE id = $3`,
                secureUrl,
                metaUpdate,
                postId
            );
        }

        console.log(`[STUDIO-WEBHOOK] ✅ Successfully updated message ${messageId}`);

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('[STUDIO-WEBHOOK] Critical Error:', error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
