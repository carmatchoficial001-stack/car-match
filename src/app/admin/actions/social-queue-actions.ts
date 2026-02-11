// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { generateSocialCaption, generateVeoPrompt } from './ai-content-actions'
import { generateSocialImage } from '@/lib/ai/dallE'

export async function createSocialPostDraft(topic: string, country: string) {
    try {
        // 1. Generate text
        const captionRes = await generateSocialCaption(topic, 'professional', 'general', country)

        // 2. Generate Image (Unsplash Fallback included in this function)
        const imageRes = await generateSocialImage(topic + ' luxury car ' + country)

        // 3. Generate Veo Prompt (New)
        const veoRes = await generateVeoPrompt(topic, 'Cinematic', country)

        // 4. Save Draft
        const post = await prisma.socialPost.create({
            data: {
                content: (captionRes.success && captionRes.content) ? captionRes.content : 'Error generando texto',
                imageUrl: (imageRes.success && imageRes.url) ? imageRes.url : null, // Uses Unsplash URL if DALL-E fails
                videoPrompt: (veoRes.success && veoRes.content) ? veoRes.content : `Prompt para Veo 3: ${topic} - ${country}`,
                platform: 'FACEBOOK', // Default Enum
                status: 'DRAFT',
                aiPrompt: `Topic: ${topic}, Country: ${country}`,
                scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000) // +24h default
            }
        })

        revalidatePath('/admin')
        return { success: true, post }
    } catch (error) {
        console.error('Error creating draft:', error)
        return { success: false, error: 'Error interno' }
    }
}


export async function getSocialQueue() {
    try {
        const queue = await prisma.socialPost.findMany({
            where: {
                status: 'DRAFT'
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        return { success: true, queue }
    } catch (error) {
        console.error('Error fetching social queue:', error)
        return { success: false, error: 'Error al cargar la cola.' }
    }
}

export async function markAsPublished(id: string) {
    try {
        await prisma.socialPost.update({
            where: { id },
            data: {
                status: 'PUBLISHED',
                publishedAt: new Date()
            }
        })
        revalidatePath('/admin')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Error al marcar como publicado.' }
    }
}

export async function approveSocialPost(id: string) {
    try {
        await prisma.socialPost.update({
            where: { id },
            data: { status: 'APPROVED' }
        })
        revalidatePath('/admin')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Error al aprobar.' }
    }
}

export async function deleteSocialPost(id: string) {
    try {
        await prisma.socialPost.delete({ where: { id } })
        revalidatePath('/admin')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Error al eliminar.' }
    }
}

export async function updateSocialPostContent(id: string, newContent: string) {
    try {
        await prisma.socialPost.update({
            where: { id },
            data: { content: newContent }
        })
        revalidatePath('/admin')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Error al actualizar.' }
    }
}
