'use server'

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

/**
 * Resets a stuck message status to allow regeneration or cleanup
 */
export async function resetStudioMessageStatus(messageId: string) {
    try {
        const session = await auth()
        if (!session?.user?.id) throw new Error("Unauthorized")

        const msg = await prisma.studioMessage.findUnique({
            where: { id: messageId, userId: session.user.id }
        })

        if (!msg || !msg.images) return { success: false, message: "Mensaje no encontrado" }

        const images = msg.images as any
        delete images._status
        delete images._lastUpdate

        await prisma.studioMessage.update({
            where: { id: messageId },
            data: { images }
        })

        return { success: true }
    } catch (error: any) {
        console.error("[STUDIO-RESET] Error:", error)
        return { success: false, error: error.message }
    }
}

/**
 * Fetches all studio conversations for the sidebar
 */
export async function getStudioConversations() {
    try {
        const session = await auth()
        if (!session?.user?.id) throw new Error("Unauthorized")

        const conversations = await prisma.studioConversation.findMany({
            where: { userId: session.user.id },
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                title: true,
                updatedAt: true
            }
        })

        if (conversations.length === 0) {
            await prisma.systemLog.create({
                data: {
                    level: 'INFO',
                    source: 'STUDIO-CONV',
                    message: `No se encontraron chats para el usuario ${session.user.id.substring(0, 8)}...`
                }
            })
        }

        return { success: true, conversations }
    } catch (error: any) {
        await prisma.systemLog.create({
            data: {
                level: 'ERROR',
                source: 'STUDIO-CONV',
                message: `Error al obtener chats: ${error.message}`
            }
        })
        console.error("[STUDIO-CONV] Get Error:", error)
        return { success: false, error: error.message }
    }
}

/**
 * Fetches the AI Studio chat history for a specific conversation
 */
export async function getStudioHistory(conversationId?: string) {
    if (!conversationId) return { success: true, messages: [] }

    try {
        const { unstable_noStore } = await import('next/cache');
        unstable_noStore();

        const session = await auth()
        if (!session?.user?.id) throw new Error("Unauthorized")

        const messages = await prisma.studioMessage.findMany({
            where: {
                userId: session.user.id,
                conversationId: conversationId
            },
            orderBy: { createdAt: 'asc' },
            take: 100
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
 * Persists a new message to the chat history, optionally creating a conversation
 */
export async function saveStudioMessage(data: {
    conversationId?: string
    role: 'user' | 'assistant'
    content: string
    type?: string
    imagePrompt?: string
    images?: any
    platforms?: any
}) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            await prisma.systemLog.create({
                data: {
                    level: 'ERROR',
                    source: 'STUDIO-HISTORY',
                    message: `Intento de guardar mensaje sin sesión válida: ${session?.user?.email || 'Guest'}`
                }
            })
            throw new Error("Unauthorized")
        }

        let targetId = data.conversationId

        // If no conversation ID, create a new one first (fallback)
        if (!targetId) {
            try {
                const newConv = await prisma.studioConversation.create({
                    data: {
                        userId: session.user.id,
                        title: data.content.substring(0, 30) + (data.content.length > 30 ? "..." : "")
                    }
                })
                targetId = newConv.id
                await prisma.systemLog.create({
                    data: {
                        level: 'INFO',
                        source: 'STUDIO-HISTORY',
                        message: `Nueva conversación auto-creada: ${targetId}`
                    }
                })
            } catch (err: any) {
                await prisma.systemLog.create({
                    data: {
                        level: 'ERROR',
                        source: 'STUDIO-HISTORY',
                        message: `Error creando conversación auto: ${err.message}`
                    }
                })
                throw err
            }
        }

        const newMessage = await prisma.studioMessage.create({
            data: {
                userId: session.user.id,
                conversationId: targetId,
                role: data.role,
                content: data.content,
                type: data.type,
                imagePrompt: data.imagePrompt,
                images: data.images || {},
                platforms: data.platforms || {}
            }
        })

        // Update conversation timestamp
        await prisma.studioConversation.update({
            where: { id: targetId },
            data: { updatedAt: new Date() }
        })

        return { success: true, messageId: newMessage.id, conversationId: targetId }
    } catch (error: any) {
        await prisma.systemLog.create({
            data: {
                level: 'ERROR',
                source: 'STUDIO-HISTORY',
                message: `Error crítico al guardar mensaje: ${error.message}`
            }
        })
        console.error("[STUDIO-HISTORY] Save Error:", error)
        return { success: false, error: error.message }
    }
}

/**
 * Creates a fresh new conversation
 */
export async function createStudioConversation(title: string = "Nueva Idea") {
    try {
        const session = await auth()
        if (!session?.user?.id) throw new Error("Unauthorized")

        const newConv = await prisma.studioConversation.create({
            data: {
                userId: session.user.id,
                title
            }
        })

        return { success: true, conversation: newConv }
    } catch (error: any) {
        console.error("[STUDIO-CONV] Create Error:", error)
        return { success: false, error: error.message }
    }
}

/**
 * Deletes a specific conversation
 */
export async function deleteStudioConversation(id: string) {
    try {
        const session = await auth()
        if (!session?.user?.id) throw new Error("Unauthorized")

        await prisma.studioConversation.delete({
            where: { id, userId: session.user.id }
        })

        return { success: true }
    } catch (error: any) {
        console.error("[STUDIO-CONV] Delete Error:", error)
        return { success: false, error: error.message }
    }
}

/**
 * Clears ALL histories for debugging/reset
 */
export async function clearStudioHistory() {
    try {
        const session = await auth()
        if (!session?.user?.id) throw new Error("Unauthorized")

        await prisma.studioConversation.deleteMany({
            where: { userId: session.user.id }
        })

        revalidatePath('/admin')
        return { success: true }
    } catch (error: any) {
        console.error("[STUDIO-HISTORY] Global Clear Error:", error)
        return { success: false, error: error.message }
    }
}
