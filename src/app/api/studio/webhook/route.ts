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
        
        // --- 🕵️‍♂️ PERSISTENT DEBUG LOGGING ---
        await prisma.systemLog.create({
            data: {
                level: 'INFO',
                source: 'STUDIO-WEBHOOK',
                message: `Webhook received for URL: ${req.url}`,
                metadata: data
            }
        });
        
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

        const { messageId: messageIdFromBody, postId: postIdFromBody, idx: idxFromBody, format: formatFromBody } = metadata || {};
        
        const postId = postIdFromUrl || postIdFromBody;
        const messageId = messageIdFromBody; // messageId is specifically for StudioMessage
        const idx = idxFromUrl ? parseInt(idxFromUrl) : (idxFromBody ?? 0);
        const format = formatFromUrl || formatFromBody || 'vertical';

        // 🛡️ Guard: We MUST have either a postId or a messageId to work
        if (!postId && !messageId) {
            await prisma.systemLog.create({
                data: {
                    level: 'ERROR',
                    source: 'STUDIO-WEBHOOK',
                    message: `Identification missing (No postId or messageId).`,
                    metadata: { url: req.url, bodyMetadata: metadata }
                }
            });
            return NextResponse.json({ ok: false, error: 'Missing identification' });
        }

        console.log(`[STUDIO-WEBHOOK] Received image for ${messageId || postId} [${idx}/${format}]`);

        // 1. Robust Upload to Cloudinary
        const uploadRes = await robustUploadToCloudinary(imageUrl, 'carmatch/publicity');
        
        if (!uploadRes.success) {
            await prisma.systemLog.create({
                data: {
                    level: 'ERROR',
                    source: 'STUDIO-WEBHOOK',
                    message: `Cloudinary upload FAILED for ${messageId || postId}`,
                    metadata: { error: uploadRes.error, imageUrl }
                }
            });
            return NextResponse.json({ ok: false });
        }

        const secureUrl = uploadRes.secure_url!;
        const publicId = uploadRes.public_id!;

        // 2. Atomic Database Update
        if (postId) {
            // Apply CarMatch logo overlay naturally via Cloudinary URL transformation
            const finalUrl = applyLogoOverlay(publicId) || secureUrl;

            const metaUpdate = JSON.stringify({
                [`img_${idx}_${format}`]: finalUrl,
                '_lastUpdate': Date.now()
            });

            // Update Post
            await prisma.$executeRawUnsafe(
                `UPDATE "SocialPost" SET "imageUrl" = (CASE WHEN "imageUrl" IS NULL OR "imageUrl" = '' THEN $1 ELSE "imageUrl" END), metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb, status = 'APPROVED' WHERE id = $3`,
                finalUrl,
                metaUpdate,
                postId
            );
            
            // Update Campaign (for thumbnail/preview)
            await prisma.$executeRawUnsafe(
                `UPDATE "PublicityCampaign" SET "imageUrl" = (CASE WHEN "imageUrl" IS NULL OR "imageUrl" = '' THEN $1 ELSE "imageUrl" END) WHERE id = (SELECT "campaignId" FROM "SocialPost" WHERE id = $2)`,
                finalUrl,
                postId
            );

            await prisma.systemLog.create({
                data: {
                    level: 'SUCCESS',
                    source: 'STUDIO-WEBHOOK',
                    message: `Post ${postId} updated successfully with image ${idx}`,
                    metadata: { finalUrl }
                }
            });

        } else if (messageId) {
            const imagesToMerge: Record<string, any> = {
                [`img_${idx}_${format}`]: secureUrl,
                '_lastUpdate': Date.now(),
                '_isBatchWorking': false 
            };

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

            await prisma.systemLog.create({
                data: {
                    level: 'SUCCESS',
                    source: 'STUDIO-WEBHOOK',
                    message: `StudioMessage ${messageId} updated successfully`,
                    metadata: { secureUrl }
                }
            });
        }

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('[STUDIO-WEBHOOK] Critical Error:', error);
        await prisma.systemLog.create({
            data: {
                level: 'ERROR',
                source: 'STUDIO-WEBHOOK',
                message: `CRITICAL ERROR: ${error.message}`,
                metadata: { stack: error.stack }
            }
        });
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
