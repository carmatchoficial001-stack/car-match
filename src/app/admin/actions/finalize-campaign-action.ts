'use server'

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { robustUploadToCloudinary, applyLogoOverlay } from "@/lib/cloudinary-server"

/**
 * 🔥 WORKBENCH: Finalizes a campaign post by uploading its preview image to Cloudinary,
 * applying the CarMatch logo overlay, and marking it as APPROVED.
 * 
 * This is called manually by the admin from the UI after reviewing the preview.
 */
export async function finalizeCampaignPost(postId: string) {
    try {
        const session = await auth()
        // @ts-ignore
        if (!session?.user?.id || !session.user.isAdmin) {
            return { success: false, error: 'Unauthorized' }
        }

        // 1. Get the post with its current preview URL
        const post = await prisma.socialPost.findUnique({
            where: { id: postId },
            select: { id: true, imageUrl: true, metadata: true, status: true, campaignId: true }
        })

        if (!post) return { success: false, error: 'Post not found' }
        if (!post.imageUrl) return { success: false, error: 'No preview image to finalize' }
        if (post.status === 'APPROVED') return { success: true, message: 'Already approved' }

        await prisma.systemLog.create({
            data: {
                level: 'INFO',
                source: 'WORKBENCH-FINALIZE',
                message: `Finalizing post ${postId}...`,
                metadata: { previewUrl: post.imageUrl }
            }
        })

        // 2. Upload the raw Fal.ai URL to Cloudinary
        const uploadRes = await robustUploadToCloudinary(post.imageUrl, 'carmatch/publicity')

        if (!uploadRes.success || !uploadRes.secure_url || !uploadRes.public_id) {
            await prisma.systemLog.create({
                data: {
                    level: 'ERROR',
                    source: 'WORKBENCH-FINALIZE',
                    message: `Cloudinary upload FAILED for post ${postId}`,
                    metadata: { error: uploadRes.error }
                }
            })
            return { success: false, error: `Upload failed: ${uploadRes.error}` }
        }

        // 3. Apply CarMatch logo overlay
        const finalUrl = applyLogoOverlay(uploadRes.public_id) || uploadRes.secure_url

        // 4. Also finalize ALL preview images in metadata (carousel slides)
        const meta = (post.metadata || {}) as any
        const updatedMeta: Record<string, string> = {}

        for (const key of Object.keys(meta)) {
            if (key.startsWith('img_') && typeof meta[key] === 'string' && meta[key].includes('fal.media')) {
                // This is a raw Fal URL - upload it too
                try {
                    const slideUpload = await robustUploadToCloudinary(meta[key], 'carmatch/publicity')
                    if (slideUpload.success && slideUpload.public_id) {
                        updatedMeta[key] = applyLogoOverlay(slideUpload.public_id) || slideUpload.secure_url!
                    } else {
                        updatedMeta[key] = meta[key] // keep original if upload fails
                    }
                } catch {
                    updatedMeta[key] = meta[key]
                }
            } else {
                updatedMeta[key] = meta[key]
            }
        }

        // 5. Update Post with final branded URL + APPROVED status
        const finalMeta = JSON.stringify({ ...updatedMeta, '_finalized': true, '_finalizedAt': Date.now() })
        await prisma.$executeRawUnsafe(
            `UPDATE "SocialPost" SET "imageUrl" = $1, "metadata" = COALESCE("metadata", '{}'::jsonb) || $2::jsonb, "status" = 'APPROVED' WHERE "id" = $3`,
            finalUrl,
            finalMeta,
            postId
        )

        // 6. Update Campaign thumbnail too
        if (post.campaignId) {
            await prisma.$executeRawUnsafe(
                `UPDATE "PublicityCampaign" SET "imageUrl" = (CASE WHEN "imageUrl" IS NULL OR "imageUrl" = '' OR "imageUrl" NOT LIKE 'https://res.cloudinary.com%' THEN $1 ELSE "imageUrl" END) WHERE "id" = $2`,
                finalUrl,
                post.campaignId
            )
        }

        await prisma.systemLog.create({
            data: {
                level: 'SUCCESS',
                source: 'WORKBENCH-FINALIZE',
                message: `Post ${postId} finalized successfully`,
                metadata: { finalUrl }
            }
        })

        return { success: true, finalUrl }

    } catch (error: any) {
        console.error('[WORKBENCH-FINALIZE] Error:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Finalizes ALL pending preview posts for a given campaign at once.
 */
export async function finalizeAllCampaignPosts(campaignId: string) {
    try {
        const session = await auth()
        // @ts-ignore
        if (!session?.user?.id || !session.user.isAdmin) {
            return { success: false, error: 'Unauthorized' }
        }

        const posts = await prisma.socialPost.findMany({
            where: { campaignId, status: 'PREVIEW' },
            select: { id: true }
        })

        const results = []
        for (const post of posts) {
            const res = await finalizeCampaignPost(post.id)
            results.push({ postId: post.id, ...res })
        }

        return { success: true, results }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
