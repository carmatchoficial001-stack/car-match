// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { uploadUrlToCloudinary } from '@/lib/cloudinary-server'

export async function getPublicityCampaigns() {
    try {
        const campaigns = await prisma.publicityCampaign.findMany({
            orderBy: { createdAt: 'desc' }
        })
        return { success: true, data: campaigns }
    } catch (error) {
        console.error('Error fetching campaigns:', error)
        return { success: false, error: 'Error al obtener campañas' }
    }
}

export async function createPublicityCampaign(prevState: any, formData: FormData) {
    try {
        const title = formData.get('title') as string
        const clientName = formData.get('clientName') as string
        const imageUrl = formData.get('imageUrl') as string
        const targetUrl = formData.get('targetUrl') as string
        const startDate = new Date(formData.get('startDate') as string)
        const endDate = new Date(formData.get('endDate') as string)
        const socialMediaEnabled = formData.get('socialMediaEnabled') === 'on'

        await prisma.publicityCampaign.create({
            data: {
                title,
                clientName,
                imageUrl,
                targetUrl,
                startDate,
                endDate,
                socialMediaEnabled,
                isActive: true
            }
        })

        revalidatePath('/admin')
        return { success: true, message: 'Campaña creada exitosamente' }
    } catch (error) {
        console.error('Error creating campaign:', error)
        return { success: false, error: 'Error al crear la campaña' }
    }
}

// Helper function to create campaign directly from code (not from form)
export async function createCampaignFromAssets(assets: any) {
    try {
        console.log('[CAMPAIGN-AUTO-SAVE] Receiving assets:', JSON.stringify(assets, null, 2).substring(0, 500) + '...');

        const title = assets.internal_title
            ? assets.internal_title
            : `Campaña IA - ${new Date().toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;

        // 🔥 DYNAMIC FALLBACK: If imageUrl is missing, use a reliable Unsplash photo
        let campaignImage = assets.imageUrl;
        if (!campaignImage || typeof campaignImage !== 'string' || campaignImage.length < 5) {
            console.warn('[CAMPAIGN-AUTO-SAVE] Invalid or missing imageUrl. Using automotive fallback.');
            const fallbacks = [
                'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1080&q=80',
                'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1080&q=80',
                'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1080&q=80',
            ];
            campaignImage = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }


        const campaign = await prisma.publicityCampaign.create({
            data: {
                title,
                clientName: 'Generado por IA',
                imageUrl: campaignImage,
                targetUrl: '',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                socialMediaEnabled: true,
                isActive: false, // Draft by default
                metadata: {
                    generatedByAI: true,
                    assets: assets
                }
            }
        })

        // 🔥 ASYNC: Upload images to Cloudinary if they are external (Pollinations)
        const pollinationsDomain = 'pollinations.ai';
        const hasPollinationsImages = campaignImage.includes(pollinationsDomain) ||
            (assets.images && Object.values(assets.images).some((url: any) => typeof url === 'string' && url.includes(pollinationsDomain)));

        if (hasPollinationsImages) {

            // 1. Upload main image
            let updatedMainImageUrl = campaignImage;
            let mainImagePublicId = (campaign.metadata as any)?.assets?.cloudinary_id;

            if (campaignImage.includes(pollinationsDomain)) {
                const uploadRes = await uploadUrlToCloudinary(campaignImage)
                if (uploadRes.success) {
                    updatedMainImageUrl = uploadRes.secure_url!;
                    mainImagePublicId = uploadRes.public_id;
                }
            }

            // 2. Upload variants in assets.images
            const updatedImages: Record<string, string> = assets.images ? { ...assets.images } : {};
            if (assets.images) {
                for (const [key, url] of Object.entries(assets.images)) {
                    if (typeof url === 'string' && url.includes(pollinationsDomain)) {
                        const uploadRes = await uploadUrlToCloudinary(url);
                        if (uploadRes.success) {
                            updatedImages[key] = uploadRes.secure_url!;
                        }
                    }
                }
            }

            // 3. Update database with Cloudinary URLs
            const updatedCampaign = await prisma.publicityCampaign.update({
                where: { id: campaign.id },
                data: {
                    imageUrl: updatedMainImageUrl,
                    metadata: {
                        ...((campaign.metadata as any) || {}),
                        assets: {
                            ...assets,
                            imageUrl: updatedMainImageUrl,
                            images: updatedImages,
                            cloudinary_id: mainImagePublicId,
                            processedByCloudinary: true
                        }
                    }
                }
            })

            console.log('[CAMPAIGN-AUTO-SAVE] Success! Campaign ID:', campaign.id);
            revalidatePath('/admin')
            return { success: true, campaign: updatedCampaign, message: `Campaña "${title}" creada exitosamente` }
        }

        console.log('[CAMPAIGN-AUTO-SAVE] Success! Campaign ID:', campaign.id);
        revalidatePath('/admin')
        return { success: true, campaign, message: `Campaña "${title}" creada exitosamente` }
    } catch (error) {
        console.error('Error creating campaign from assets:', error)
        return { success: false, error: `Error al crear la campaña: ${error instanceof Error ? error.message : String(error)}` }
    }
}


export async function updatePublicityCampaign(id: string, data: any) {
    try {
        await prisma.publicityCampaign.update({
            where: { id },
            data
        })
        revalidatePath('/admin')
        return { success: true }
    } catch (error) {
        console.error('Error updating campaign:', error)
        return { success: false, error: 'Error updating campaign' }
    }
}

export async function deletePublicityCampaign(id: string) {
    try {
        await prisma.publicityCampaign.delete({
            where: { id }
        })
        revalidatePath('/admin')
        return { success: true }
    } catch (error) {
        console.error('Error deleting campaign:', error)
        return { success: false, error: 'Error deleting campaign' }
    }
}

export async function togglePublicityStatus(id: string, currentStatus: boolean) {
    try {
        await prisma.publicityCampaign.update({
            where: { id },
            data: { isActive: !currentStatus }
        })
        revalidatePath('/admin')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Error toggling status' }
    }
}

export async function manualTriggerSocialPost(id: string) {
    // Simulator for manual trigger
    try {
        await prisma.publicityCampaign.update({
            where: { id },
            data: { lastSocialPost: new Date() }
        })
        // In real implementation: call Facebook/Instagram API here
        console.log(`[SOCIAL MOCK] Posted campaign ${id} to social media`)
        return { success: true, message: 'Publicado en redes (Simulado)' }
    } catch (error) {
        return { success: false, error: 'Error triggering post' }
    }
}

export async function saveAIAssetUrl(campaignId: string, type: string, url: string) {
    try {
        const campaign = await prisma.publicityCampaign.findUnique({
            where: { id: campaignId }
        });

        if (!campaign) return { success: false, error: 'Campaña no encontrada' };

        // metadata is Json in Prisma, so it's already an object if it exists
        const metadata = (campaign.metadata as any) || {};
        const assets = metadata.assets || {};

        if (type === 'video') {
            assets.videoUrl = url;
            // Also update the videoPendingId to null since it's finished? 
            // Or just leave it. The UI uses the URL if present.
        } else if (type.startsWith('image_')) {
            const imgType = type.split('_')[1];
            if (!assets.images) assets.images = {};
            assets.images[imgType] = url;
            // Also update main imageUrl if it's square
            if (imgType === 'square') {
                assets.imageUrl = url;
            }
        }

        await prisma.publicityCampaign.update({
            where: { id: campaignId },
            data: {
                imageUrl: assets.imageUrl || campaign.imageUrl,
                metadata: { ...metadata, assets }
            }
        });

        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error('Error saving AI asset URL:', error);
        return { success: false, error: 'Error al persistir el asset' };
    }
}

export async function deleteAllCampaigns() {
    try {
        await prisma.publicityCampaign.deleteMany({})
        revalidatePath('/admin')
        return { success: true, message: 'Todas las campañas han sido eliminadas' }
    } catch (error) {
        console.error('Error deleting all campaigns:', error)
        return { success: false, error: 'Error al eliminar todas las campañas' }
    }
}
