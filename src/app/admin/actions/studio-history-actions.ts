'use server'

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

/**
 * Fetches the AI Studio chat history for the current admin user
 */
export async function getStudioHistory() {
    try {
        const session = await auth()
        if (!session?.user?.id) throw new Error("Unauthorized")

        const messages = await prisma.studioMessage.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'asc' },
            take: 100 // Limit history for performance
        })

        return {
            success: true,
            messages: messages.map(m => ({
                id: m.id,
                role: m.role as 'user' | 'assistant',
                content: m.content,
                type: m.type as any,
                imagePrompt: m.imagePrompt || undefined,
                images: m.images as any,
                platforms: m.platforms as any,
                timestamp: m.createdAt
            }))
        }
    } catch (error: any) {
        console.error("[STUDIO-HISTORY] Get Error:", error)
        return { success: false, error: error.message }
    }
}

/**
 * Persists a new message to the chat history
 */
export async function saveStudioMessage(data: {
    role: 'user' | 'assistant'
    content: string
    type?: string
    imagePrompt?: string
    images?: any
    platforms?: any
}) {
    try {
        const session = await auth()
        if (!session?.user?.id) throw new Error("Unauthorized")

        const newMessage = await prisma.studioMessage.create({
            data: {
                userId: session.user.id,
                role: data.role,
                content: data.content,
                type: data.type,
                imagePrompt: data.imagePrompt,
                images: data.images || {},
                platforms: data.platforms || {}
            }
        })

        return { success: true, messageId: newMessage.id }
    } catch (error: any) {
        console.error("[STUDIO-HISTORY] Save Error:", error)
        return { success: false, error: error.message }
    }
}

/**
 * Clears the history for the current user
 */
export async function clearStudioHistory() {
    try {
        const session = await auth()
        if (!session?.user?.id) throw new Error("Unauthorized")

        await prisma.studioMessage.deleteMany({
            where: { userId: session.user.id }
        })

        revalidatePath('/admin')
        return { success: true }
    } catch (error: any) {
        console.error("[STUDIO-HISTORY] Clear Error:", error)
        return { success: false, error: error.message }
    }
}
