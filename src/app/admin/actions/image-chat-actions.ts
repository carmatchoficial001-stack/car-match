'use server'

import { geminiFlashConversational } from '@/lib/ai/geminiModels'
import { buildPollinationsUrl } from '@/lib/admin/utils'
import { uploadUrlToCloudinary, robustUploadToCloudinary } from '@/lib/cloudinary-server'
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { saveStudioMessage, getStudioHistory } from "./studio-history-actions"


/**
 * DB Logging helper
 */
async function recordLog(message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO', metadata?: any) {
    try {
        await prisma.systemLog.create({
            data: {
                level,
                message,
                source: 'StudioWorker',
                metadata: metadata || {}
            }
        })
        console.log(`[STUDIO] ${level}: ${message}`)
    } catch (e) {
        console.error("Critical: Failed to save systemic log", e)
    }
}

await recordLog('--- SERVER ACTION LOADED / MODULE INIT ---')

/**
 * Platform configurations with their optimal image sizes
 */
const PLATFORMS = {
    instagram_feed: { name: 'Instagram Feed', w: 1080, h: 1080, icon: '📸' },
    instagram_stories: { name: 'Instagram Stories', w: 1080, h: 1920, icon: '📱' },
    tiktok: { name: 'TikTok', w: 1080, h: 1920, icon: '🎵' },
    facebook: { name: 'Facebook', w: 1200, h: 628, icon: '👤' },
    x_twitter: { name: 'X (Twitter)', w: 1600, h: 900, icon: '𝕏' },
    google_ads: { name: 'Google Ads', w: 1200, h: 628, icon: '🔍' },
    snapchat: { name: 'Snapchat', w: 1080, h: 1920, icon: '👻' },
    kwai: { name: 'Kwai', w: 1080, h: 1920, icon: '🎬' },
} as const

/**
 * Main chat function — Creative Director AI
 */
export async function chatWithImageDirector(
    messages: { role: 'user' | 'assistant'; content: string }[],
    conversationId?: string,
    targetCountry: string = 'MX'
) {
    try {
        const lastMessage = messages[messages.length - 1]?.content || ''
        const contextStr = messages.map(m =>
            `${m.role === 'user' ? 'USUARIO' : 'DIRECTOR CREATIVO'}: ${m.content}`
        ).join('\n')

        const prompt = `Eres el DIRECTOR CREATIVO SUPREMO de CarMatch México.
Tu personalidad: Eres apasionado, visionario, dominas la jerga creativa y el marketing digital mexicano. 
Tu objetivo es platicar con el usuario en ESPAÑOL para entender su visión.
Una vez que la idea esté clara, propón un "PROMPT FINAL" detallado.

REGLAS DE INTERACCIÓN:
1. Siempre habla en ESPAÑOL.
2. Cuando el usuario pida generar la imagen, responde con "PROMPT_READY".

HISTORIAL:
${contextStr}

INSTRUCCIONES DE RESPUESTA JSON:
Si vas a proponer el diseño final, responde con un JSON válido como este ejemplo:
{
    "type": "PROMPT_READY",
    "message": "Mensaje entusiasta en ESPAÑOL.",
    "imagePrompt": "ULTRA DETAILED prompt in ENGLISH.",
    "photoCount": 11,
    "platforms": { "instagram": true }
}
(NOTA: En photoCount asigna el número exacto de fotos que el usuario solicitó; si no especificó, usa 11).

Si estás platicando, responde:
{
    "type": "CHAT",
    "message": "Tu respuesta en ESPAÑOL"
}
Responde ÚNICAMENTE con JSON válido y respeta la cantidad de imágenes pedida.`

        const result = await geminiFlashConversational.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.9,
                maxOutputTokens: 4096
            }
        }) as any

        let responseText = result.response.text().trim()
        if (responseText.startsWith('```json')) responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
        else if (responseText.startsWith('```')) responseText = responseText.replace(/```/g, '').trim()

        const data = JSON.parse(responseText)

        if (data.type === 'PROMPT_READY' && data.imagePrompt) {
            const imagePrompt = data.imagePrompt
            const count = Math.max(1, Math.min(25, data.photoCount || 11))

            await recordLog(`Iniciando flujo para ${count} fotos...`, 'INFO', { imagePrompt })

            const finalImages: Record<string, any> = {
                '_status': 'generating',
                '_imagePrompt': imagePrompt,
                '_photoCount': count,
                '_lastUpdate': Date.now()
            }

            let messageId: string | undefined = undefined
            if (conversationId) {
                const saveRes = await saveStudioMessage({
                    conversationId,
                    role: 'assistant',
                    content: data.message || 'Propuesta creativa lista 🔥',
                    type: 'PROMPT_READY',
                    imagePrompt,
                    images: finalImages,
                    platforms: data.platforms || {}
                })
                if (saveRes.success) messageId = saveRes.messageId
            }

            await recordLog(`Mensaje persistido con ID: ${messageId}. Esperando orchestración del cliente...`, messageId ? 'INFO' : 'ERROR')

            return {
                success: true,
                messageId,
                type: 'PROMPT_READY' as const,
                message: data.message || 'Propuesta creativa lista 🔥',
                imagePrompt: data.imagePrompt,
                images: finalImages,
                platforms: data.platforms || {},
            }
        }

        return {
            success: true,
            type: 'CHAT' as const,
            message: data.message || 'Cuéntame más sobre tu idea creativa...',
        }

    } catch (error: any) {
        await recordLog(`Error en chatDirector: ${error.message}`, 'ERROR')
        return { success: false, type: 'CHAT' as const, message: `❌ Error: ${error.message}` }
    }
}

/**
 * Generates the next available image for a given studio message.
 * Designed to be called repeatedly by the client until all images are generated,
 * avoiding Vercel's 10-15s serverless execution timeout.
 */
export async function processNextImageBatch(messageId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("Unauthorized");

        const msg = await prisma.studioMessage.findUnique({
            where: { id: messageId, userId: session.user.id }
        });

        if (!msg || !msg.imagePrompt) return { success: false, error: "Prompt not found" };

        const images = (msg.images as any) || {};
        const count = images._photoCount || 11;
        const prompt = msg.imagePrompt;

        // Find the first ungenerated image index
        let targetIdx = -1;
        for (let i = 0; i < count; i++) {
            if (!images[`img_${i}`]) {
                targetIdx = i;
                break;
            }
        }

        if (targetIdx === -1) {
            // All images generated, clean up metadata
            delete images._status;
            delete images._imagePrompt;
            delete images._photoCount;
            delete images._lastUpdate;
            await prisma.studioMessage.update({
                where: { id: messageId },
                data: { images }
            });
            return { success: true, completed: true, images };
        }

        // Generate the specific image
        let p = prompt;
        let w = 1080, h = 1080;

        if (targetIdx === 1) { w = 1080; h = 1920; }
        else if (targetIdx === 2) { w = 1200; h = 628; }
        if (targetIdx > 0) { p += `, variation ${targetIdx}, professional lighting, cinematic detail`; }

        const res = await robustUploadToCloudinary(buildPollinationsUrl(p, w, h));

        if (res.success && res.secure_url) {
            const id = `img_${targetIdx}`;
            images[id] = res.secure_url;
            if (targetIdx === 0) images.square = res.secure_url;
            if (targetIdx === 1) images.vertical = res.secure_url;
            if (targetIdx === 2) images.horizontal = res.secure_url;

            // Calculate pending
            let currentCompleted = 0;
            for (let i = 0; i < count; i++) {
                if (images[`img_${i}`]) currentCompleted++;
            }

            images['_status'] = `generating: ${currentCompleted}/${count}`;
            images['_lastUpdate'] = Date.now();

            await prisma.studioMessage.update({
                where: { id: messageId },
                data: { images }
            });

            return { success: true, completed: false, images };
        } else {
            // Failed generation, don't update DB to allow retry next time
            await recordLog(`Fallback in processing image ${targetIdx} for ${messageId}`, 'WARN');
            return { success: false, error: res.error || "Generation Failed", images };
        }

    } catch (e: any) {
        await recordLog(`batch generation error: ${e.message}`, 'ERROR')
        return { success: false, error: e.message };
    }
}

export async function generateImageVariation(originalPrompt: string, instruction: string) {
    // Legacy support for manual variations if needed
    try {
        const prompt = `Modifica este prompt: "${originalPrompt}" según: "${instruction}". Responde JSON { imagePrompt, message }.`
        const result = await geminiFlashConversational.generateContent(prompt)
        const text = result.response.text()
        const data = JSON.parse(text.replace(/```json|```/g, '').trim())

        const res = await robustUploadToCloudinary(buildPollinationsUrl(data.imagePrompt, 1080, 1080))
        return {
            success: res.success,
            message: data.message,
            images: { square: res.secure_url }
        }
    } catch (e: any) {
        return { success: false, message: e.message }
    }
}

/**
 * RESTARTS the worker for a specific message by simply updating its status so the client resumes polling
 */
export async function restartStudioWorker(messageId: string) {
    try {
        const session = await auth()
        if (!session?.user?.id) throw new Error("Unauthorized")

        const msg = await prisma.studioMessage.findUnique({
            where: { id: messageId, userId: session.user.id }
        })

        if (!msg || !msg.imagePrompt) return { success: false, message: "No se encontró el prompt base" }

        const images = (msg.images as any) || {}
        const count = images._photoCount || 11;

        // Recalculate how many are done
        let currentCompleted = 0;
        for (let i = 0; i < count; i++) {
            if (images[`img_${i}`]) currentCompleted++;
        }

        images._status = `generating: starting restart (${currentCompleted}/${count})...`
        images._lastUpdate = Date.now()

        await prisma.studioMessage.update({
            where: { id: messageId },
            data: { images }
        })

        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

