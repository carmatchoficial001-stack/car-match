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
Si vas a proponer el diseño final, responde:
{
    "type": "PROMPT_READY",
    "message": "Mensaje entusiasta en ESPAÑOL.",
    "imagePrompt": "ULTRA DETAILED prompt in ENGLISH.",
    "photoCount": [Número exacto de fotos que el usuario solicitó, o 11 por defecto],
    "platforms": { ... }
}

Si estás platicando, responde:
{
    "type": "CHAT",
    "message": "Tu respuesta en ESPAÑOL"
}
Responde ÚNICAMENTE con JSON y respeta la cantidad de imágenes pedida.`

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
                // 🔥 SYNC FIRST IMAGE: We await the first image (idx 0) to ensure the function stays alive 
                // and the user gets immediate feedback.
                try {
                    await recordLog(`Generando primera imagen (SQUARE) de forma síncrona...`, 'INFO');
                    const p = imagePrompt;
                    const res = await robustUploadToCloudinary(buildPollinationsUrl(p, 1080, 1080));
                    if (res.success && res.secure_url) {
                        finalImages['img_0'] = res.secure_url;
                        finalImages.square = res.secure_url;
                        finalImages['_status'] = `generating: 1/${count}`;
                        await prisma.studioMessage.update({
                            where: { id: messageId },
                            data: { images: { ...finalImages } }
                        });
                        console.log("✅ Primera imagen generada síncronamente.");
                    }
                } catch (e) {
                    console.error("Error en primera imagen síncrona:", e);
                }

                // Fire the rest in background
                executeImageGenerationWorker(messageId, imagePrompt, count, finalImages).catch(e =>
                    console.error("Worker background error:", e)
                );
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

/**
 * Shared worker logic for both initial generation and restarts
 */
async function executeImageGenerationWorker(messageId: string, imagePrompt: string, count: number, initialImages: any) {
    const workerStartTime = Date.now();
    const WORKER_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
    const finalImages = { ...initialImages };

    try {
        await recordLog(`Worker iniciado para ${messageId}`, 'INFO', { messageId, count })
        let pendingTasks = new Set<number>(
            Array.from({ length: count }, (_, i) => i)
                .filter(i => !finalImages[`img_${i}`]) // Only those not yet generated
        );

        let passes = 0;
        const maxPasses = 3;

        while (pendingTasks.size > 0 && passes < maxPasses) {
            if (Date.now() - workerStartTime > WORKER_TIMEOUT_MS) {
                await recordLog(`Worker timeout global en ${messageId}`, 'WARN')
                break;
            }

            passes++;
            const taskArray = Array.from(pendingTasks);

            for (const idx of taskArray) {
                try {
                    const id = `img_${idx}`;
                    let p = imagePrompt;
                    let w = 1080, h = 1080;

                    if (idx === 1) { w = 1080; h = 1920; }
                    else if (idx === 2) { w = 1200; h = 628; }
                    if (idx > 0) { p += `, variation ${idx}, professional lighting, cinematic detail`; }

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

                        // Small delay to prevent rate limits or race conditions
                        await new Promise(r => setTimeout(r, 500));
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
 * RESTARTS the worker for a specific message
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
        images._status = 'generating: restarting...'
        images._lastUpdate = Date.now()

        await prisma.studioMessage.update({
            where: { id: messageId },
            data: { images }
        })

        // Re-declare internal logic or similar
        // For simplicity, we just trigger a dummy chat or we expose the worker internal.
        // Better: trigger a background call to a private route if needed, or just run it here
        // as it's a server action.
        // Since we already have the logic in chatWithImageDirector, we can just run it
        // but it's encapsulated. Let's make it a bit more reusable or just call it.

        console.log(`[STUDIO] Reiniciando worker para ${messageId}...`);

        // Re-trigger worker
        const imagePrompt = msg.imagePrompt;
        const count = images._photoCount || 11;

        executeImageGenerationWorker(messageId, imagePrompt, count, images).catch(e =>
            console.error("Restart worker error:", e)
        );

        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}
