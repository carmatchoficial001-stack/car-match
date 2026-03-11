import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { uploadUrlToCloudinary, applyLogoOverlay } from '@/lib/cloudinary-server';

export const maxDuration = 60; // Webhook needs time to upload to Cloudinary and composite the logo

/**
 * Webhook handler for Fal.ai asynchronous generation
 */
export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        
        // Fal.ai webhook payload structure
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

        // Read context from URL query params (reliable) — falls back to body metadata
        const { searchParams } = new URL(req.url);
        const postIdFromUrl = searchParams.get('postId');
        const idxFromUrl = searchParams.get('idx');
        const formatFromUrl = searchParams.get('format');

        const { messageId, postId: postIdFromBody, idx: idxFromBody, format: formatFromBody } = metadata || {};
        
        const postId = postIdFromUrl || postIdFromBody;
        const idx = idxFromUrl ? parseInt(idxFromUrl) : (idxFromBody ?? 0);
        const format = formatFromUrl || formatFromBody;

        // messageId is only present for legacy StudioMessage flow (non-campaign)
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
        if (postId) {
            // Apply CarMatch logo overlay naturally via Cloudinary URL transformation
            const uploadRes2 = await uploadUrlToCloudinary(secureUrl, 'carmatch/publicity');
            const publicId = uploadRes2.success ? uploadRes2.public_id! : '';
            const logoUrl = publicId ? applyLogoOverlay(publicId) : secureUrl;
            const finalUrl = logoUrl || secureUrl;

            const metaUpdate = JSON.stringify({
                [`img_${format}`]: finalUrl,
                '_lastUpdate': Date.now()
            });

            await prisma.$executeRawUnsafe(
                `UPDATE "SocialPost" SET "imageUrl" = (CASE WHEN "imageUrl" IS NULL OR "imageUrl" = '' THEN $1 ELSE "imageUrl" END), metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb, status = 'APPROVED' WHERE id = $3`,
                finalUrl,
                metaUpdate,
                postId
            );
            // also update campaign metadata to include the image for faster display
            await prisma.$executeRawUnsafe(
                `UPDATE "PublicityCampaign" SET "imageUrl" = (CASE WHEN "imageUrl" IS NULL OR "imageUrl" = '' THEN $1 ELSE "imageUrl" END) WHERE id = (SELECT "campaignId" FROM "SocialPost" WHERE id = $2)`,
                finalUrl,
                postId
            );
        } else if (messageId) {
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
        }


        console.log(`[STUDIO-WEBHOOK] ✅ Successfully updated message ${messageId}`);

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('[STUDIO-WEBHOOK] Critical Error:', error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
