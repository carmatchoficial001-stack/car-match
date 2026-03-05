'use server'

import { geminiFlashConversational } from '@/lib/ai/geminiModels'
import { buildPollinationsUrl } from '@/lib/admin/utils'
import { uploadUrlToCloudinary, robustUploadToCloudinary } from '@/lib/cloudinary-server'
import { prisma } from "@/lib/db"
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
Si vas a proponer el diseño final, responde:
{
    "type": "PROMPT_READY",
    "message": "Mensaje entusiasta en ESPAÑOL.",
    "imagePrompt": "ULTRA DETAILED prompt in ENGLISH.",
    "photoCount": 11,
    "platforms": { ... }
}

Si estás platicando, responde:
{
    "type": "CHAT",
    "message": "Tu respuesta en ESPAÑOL"
}
Responde ÚNICAMENTE con JSON.`

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

            await recordLog(`Mensaje persistido con ID: ${messageId}. Iniciando worker...`, messageId ? 'INFO' : 'ERROR')

            // 🚀 BACKGROUND WORKER / DETERMINATE QUEUE
            if (messageId) {
                // We use a self-invoking async function but we don't await it to avoid blocking the action
                (async () => {
                    const workerStartTime = Date.now();
                    const WORKER_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes expanded timeout

                    try {
                        await recordLog(`Worker iniciado para ${messageId}`, 'INFO', { messageId, count })
                        let pendingTasks = new Set<number>(Array.from({ length: count }, (_, i) => i));
                        let passes = 0;
                        const maxPasses = 3;

                        while (pendingTasks.size > 0 && passes < maxPasses) {
                            if (Date.now() - workerStartTime > WORKER_TIMEOUT_MS) {
                                await recordLog(`Worker timeout global en ${messageId}`, 'WARN')
                                break;
                            }

                            passes++;
                            const taskArray = Array.from(pendingTasks);

                            // Sequential processing is safer in unstable environments to ensure progress can be saved
                            for (const idx of taskArray) {
                                try {
                                    const id = `img_${idx}`;
                                    let p = imagePrompt;
                                    let w = 1080, h = 1080;

                                    if (idx === 1) { w = 1080; h = 1920; }
                                    else if (idx === 2) { w = 1200; h = 628; }
                                    if (idx > 1) { p += `, variation ${idx}, professional lighting, cinematic detail`; }

                                    const res = await robustUploadToCloudinary(buildPollinationsUrl(p, w, h));

                                    if (res.success && res.secure_url) {
                                        finalImages[id] = res.secure_url;
                                        if (idx === 0) finalImages.square = res.secure_url;
                                        if (idx === 1) finalImages.vertical = res.secure_url;
                                        if (idx === 2) finalImages.horizontal = res.secure_url;

                                        pendingTasks.delete(idx);
                                        const completedCount = count - pendingTasks.size;
                                        finalImages['_status'] = `generating: ${completedCount}/${count}`;
                                        finalImages['_lastUpdate'] = Date.now();

                                        await prisma.studioMessage.update({
                                            where: { id: messageId },
                                            data: { images: { ...finalImages } }
                                        })
                                    } else {
                                        await recordLog(`Fallo en imagen ${idx} del mensaje ${messageId}: ${res.error}`, 'WARN')
                                    }
                                } catch (taskErr: any) {
                                    await recordLog(`Error crítico en tarea ${idx}: ${taskErr.message}`, 'ERROR')
                                }
                            }

                            if (pendingTasks.size > 0 && passes < maxPasses) {
                                await new Promise(r => setTimeout(r, 2000 * passes));
                            }
                        }
                    } catch (err: any) {
                        await recordLog(`Error fatal en worker ${messageId}: ${err.message}`, 'ERROR')
                    } finally {
                        try {
                            const current = await prisma.studioMessage.findUnique({ where: { id: messageId! } });
                            const imagesToCleanup = (current?.images as any) || finalImages;

                            const finalToSave = { ...imagesToCleanup };
                            delete finalToSave._status;
                            delete finalToSave._imagePrompt;
                            delete finalToSave._photoCount;
                            delete finalToSave._lastUpdate;

                            await prisma.studioMessage.update({
                                where: { id: messageId },
                                data: { images: finalToSave }
                            });
                            await recordLog(`Worker finalizado para ${messageId}. Limpieza exitosa.`, 'INFO')
                        } catch (finalErr: any) {
                            await recordLog(`Error en limpieza final de ${messageId}: ${finalErr.message}`, 'ERROR')
                        }
                    }
                })().catch(async e => {
                    await recordLog(`Worker crashed irrecoverably: ${e.message}`, 'ERROR')
                });
            }

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
