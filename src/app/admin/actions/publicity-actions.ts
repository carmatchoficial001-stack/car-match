'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

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
