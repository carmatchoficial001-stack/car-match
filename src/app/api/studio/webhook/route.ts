import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const maxDuration = 30; // Webhook is now fast — no Cloudinary upload

/**
 * 🚀 WORKBENCH WEBHOOK — Saves Fal.ai URL instantly for preview display.
 * Cloudinary finalization happens later via user action.
 */
export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        
        // --- 🕵️‍♂️ DEBUG LOGGING ---
        await prisma.systemLog.create({
            data: {
                level: 'INFO',
                source: 'STUDIO-WEBHOOK',
                message: `Webhook received`,
                metadata: { url: req.url }
            }
        });
        
        const { request_id, status, payload, metadata } = data;

        if (status !== 'OK') {
            console.error(`[STUDIO-WEBHOOK] Generation failed for ${request_id}:`, data);
            return NextResponse.json({ ok: false });
        }

        const rawImageUrl = payload?.images?.[0]?.url;
        if (!rawImageUrl) {
            console.error(`[STUDIO-WEBHOOK] No image URL in payload`);
            return NextResponse.json({ ok: false });
        }

        // Read context from URL query params + body metadata
        const { searchParams } = new URL(req.url);
        const postIdFromUrl = searchParams.get('postId');
        const messageIdFromUrl = searchParams.get('messageId');
        const idxFromUrl = searchParams.get('idx');
        const formatFromUrl = searchParams.get('format');

        const { messageId: messageIdFromBody, postId: postIdFromBody, idx: idxFromBody, format: formatFromBody } = metadata || {};
        
        const postId = postIdFromUrl || postIdFromBody;
        const messageId = messageIdFromUrl || messageIdFromBody;
        const idx = idxFromUrl ? parseInt(idxFromUrl) : (idxFromBody ?? 0);
        const format = formatFromUrl || formatFromBody || 'vertical';

        if (!postId && !messageId) {
            await prisma.systemLog.create({
                data: {
                    level: 'ERROR',
                    source: 'STUDIO-WEBHOOK',
                    message: `Missing identification (no postId or messageId)`,
                    metadata: { url: req.url, bodyMetadata: metadata }
                }
            });
            return NextResponse.json({ ok: false, error: 'Missing identification' });
        }

        console.log(`[STUDIO-WEBHOOK] Saving preview for ${postId || messageId} [${idx}/${format}]`);

        // --- 🖼️ SAVE RAW FAL.AI URL INSTANTLY (No Cloudinary) ---
        if (postId) {
            const metaUpdate = JSON.stringify({
                [`img_${idx}_${format}`]: rawImageUrl,
                '_lastUpdate': Date.now(),
                '_isPreview': true  // Flag indicating this needs Cloudinary finalization
            });

            await prisma.$executeRawUnsafe(
                `UPDATE "SocialPost" 
                 SET "imageUrl" = (CASE WHEN "imageUrl" IS NULL OR "imageUrl" = '' THEN $1 ELSE "imageUrl" END), 
                     "metadata" = COALESCE("metadata", '{}'::jsonb) || $2::jsonb,
                     "status" = 'PREVIEW'
                 WHERE "id" = $3`,
                rawImageUrl,
                metaUpdate,
                postId
            );

            // Update Campaign thumbnail too (for instant preview in the list)
            await prisma.$executeRawUnsafe(
                `UPDATE "PublicityCampaign" 
                 SET "imageUrl" = (CASE WHEN "imageUrl" IS NULL OR "imageUrl" = '' THEN $1 ELSE "imageUrl" END) 
                 WHERE "id" = (SELECT "campaignId" FROM "SocialPost" WHERE "id" = $2)`,
                rawImageUrl,
                postId
            );

            await prisma.systemLog.create({
                data: {
                    level: 'SUCCESS',
                    source: 'STUDIO-WEBHOOK',
                    message: `Post ${postId} [${idx}/${format}] PREVIEW saved instantly`,
                    metadata: { rawImageUrl }
                }
            });

        } else if (messageId) {
            // Chat flow: still save directly to StudioMessage
            const imagesToMerge: Record<string, any> = {
                [`img_${idx}_${format}`]: rawImageUrl,
                '_lastUpdate': Date.now(),
                '_isBatchWorking': false 
            };

            if (format === 'square') imagesToMerge['square'] = rawImageUrl;
            if (idx === 0) {
                if (format === 'vertical') imagesToMerge['vertical'] = rawImageUrl;
                if (format === 'horizontal') imagesToMerge['horizontal'] = rawImageUrl;
            }

            await prisma.$executeRawUnsafe(
                `UPDATE "StudioMessage" SET "images" = COALESCE("images", '{}'::jsonb) || $1::jsonb WHERE "id" = $2`,
                JSON.stringify(imagesToMerge),
                messageId
            );

            await prisma.systemLog.create({
                data: {
                    level: 'SUCCESS',
                    source: 'STUDIO-WEBHOOK',
                    message: `StudioMessage ${messageId} updated with preview`,
                    metadata: { rawImageUrl }
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
