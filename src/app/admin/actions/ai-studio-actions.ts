'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export type AIStudioSessionWithMessages = {
    id: string
    name: string
    mode: string
    userId: string
    createdAt: Date
    updatedAt: Date
    messages: {
        id: string
        role: string
        content: string
        createdAt: Date
    }[]
}

// Obtener todas las sesiones del usuario
export async function getAISessions() {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: 'No autorizado' }

        const chats = await prisma.aIStudioSession.findMany({
            where: { userId: session.user.id },
            orderBy: { updatedAt: 'desc' },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                    take: 1 // Solo para mostrar preview si se necesitara
                }
            }
        })

        return { success: true, chats }
    } catch (error) {
        console.error('Error fetching sessions:', error)
        return { success: false, error: 'Error al cargar historial' }
    }
}

// Obtener una sesión específica con sus mensajes completeos
export async function getAISession(sessionId: string) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: 'No autorizado' }

        const chat = await prisma.aIStudioSession.findUnique({
            where: {
                id: sessionId,
                userId: session.user.id
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        })

        if (!chat) return { success: false, error: 'Chat no encontrado' }

        return { success: true, chat }
    } catch (error) {
        console.error('Error fetching session:', error)
        return { success: false, error: 'Error al cargar chat' }
    }
}

// Crear una nueva sesión
export async function createAISession(mode: string = 'CHAT', firstMessage?: string) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: 'No autorizado' }

        // Nombre preliminar basado en el primer mensaje o fecha
        let name = "Nueva Sesión"
        if (firstMessage) {
            name = firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : '')
        }

        const newChat = await prisma.aIStudioSession.create({
            data: {
                userId: session.user.id,
                mode,
                name
            }
        })

        revalidatePath('/admin')
        return { success: true, chat: newChat }
    } catch (error) {
        console.error('Error creating session:', error)
        return { success: false, error: 'Error al crear sesión' }
    }
}

// Guardar un mensaje en una sesión
export async function saveAIMessage(sessionId: string, role: string, content: string) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: 'No autorizado' }

        // Verificar propiedad
        const chat = await prisma.aIStudioSession.findUnique({
            where: { id: sessionId, userId: session.user.id }
        })

        if (!chat) return { success: false, error: 'Chat no encontrado' }

        const message = await prisma.aIStudioMessage.create({
            data: {
                sessionId,
                role,
                content
            }
        })

        // Actualizar timestamp de la sesión
        await prisma.aIStudioSession.update({
            where: { id: sessionId },
            data: { updatedAt: new Date() }
        })

        revalidatePath('/admin')
        return { success: true, message }
    } catch (error) {
        console.error('Error saving message:', error)
        return { success: false, error: 'Error al guardar mensaje' }
    }
}

// Eliminar una sesión
export async function deleteAISession(sessionId: string) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: 'No autorizado' }

        await prisma.aIStudioSession.delete({
            where: { id: sessionId, userId: session.user.id }
        })

        revalidatePath('/admin')
        return { success: true }
    } catch (error) {
        console.error('Error deleting session:', error)
        return { success: false, error: 'Error al eliminar sesión' }
    }
}

// Renombrar una sesión
export async function renameAISession(sessionId: string, newName: string) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: 'No autorizado' }

        await prisma.aIStudioSession.update({
            where: { id: sessionId, userId: session.user.id },
            data: { name: newName }
        })

        revalidatePath('/admin')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Error al renombrar' }
    }
}
