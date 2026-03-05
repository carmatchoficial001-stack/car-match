'use server'

import { geminiFlashConversational } from '@/lib/ai/geminiModels'
import { buildPollinationsUrl } from '@/lib/admin/utils'
import { uploadUrlToCloudinary, robustUploadToCloudinary } from '@/lib/cloudinary-server'
import { prisma } from "@/lib/db"
import { saveStudioMessage, getStudioHistory } from "./studio-history-actions"
import fs from 'fs'
import path from 'path'

// 📝 FILE LOGGING FOR DEBUGGING
const LOG_FILE = path.join(process.cwd(), 'studio_worker.log')

function logToFile(msg: string) {
    const timestamp = new Date().toISOString()
    try {
        fs.appendFileSync(LOG_FILE, `[${timestamp}] ${msg}\n`)
        console.log(`[DEBUG-LOG] ${msg}`)
    } catch (e) {
        // Silent fail for logs
    }
}
logToFile('--- SERVER ACTION LOADED / MODULE INIT ---')

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

            logToFile(`[MAIN] Iniciando flujo para ${count} fotos...`)

            const finalImages: Record<string, any> = {
                '_status': 'generating',
                '_imagePrompt': imagePrompt,
                '_photoCount': count
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

            logToFile(`[MAIN] Mensaje persistido con ID: ${messageId}. Disparando worker...`)

            // 🚀 BACKGROUND WORKER / DETERMINATE QUEUE
            if (messageId) {
                (async () => {
                    const workerStartTime = Date.now();
                    const WORKER_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes global timeout

                    try {
                        logToFile(`[WORKER] 🚀 Determinate Queue iniciado para ${messageId}`);
                        let pendingTasks = new Set<number>(Array.from({ length: count }, (_, i) => i));
                        let passes = 0;
                        const maxPasses = 3;

                        while (pendingTasks.size > 0 && passes < maxPasses) {
                            // Check for global timeout
                            if (Date.now() - workerStartTime > WORKER_TIMEOUT_MS) {
                                logToFile(`[WORKER] ⚠️ Global timeout reached (${WORKER_TIMEOUT_MS}ms). Stopping worker.`);
                                break;
                            }

                            passes++;
                            logToFile(`[PASS ${passes}] Procesando ${pendingTasks.size} tareas pendientes...`);

                            const taskArray = Array.from(pendingTasks);
                            // Process in smaller batches of 3 to be more "live" and avoid overwhelming Cloudinary/Pollinations
                            for (let i = 0; i < taskArray.length; i += 3) {
                                const batchIndices = taskArray.slice(i, i + 3);
                                logToFile(`[PASS ${passes}] Batch: ${batchIndices.join(', ')}`);

                                const batchResults = await Promise.allSettled(batchIndices.map(async (idx) => {
                                    const id = `img_${idx}`;
                                    let p = imagePrompt;
                                    let w = 1080, h = 1080;

                                    // Dimension variants
                                    if (idx === 1) { w = 1080; h = 1920; }
                                    else if (idx === 2) { w = 1200; h = 628; }

                                    // Evolution injection
                                    if (idx > 1) { p += `, variation ${idx}, professional lighting, cinematic detail`; }

                                    const res = await robustUploadToCloudinary(buildPollinationsUrl(p, w, h));

                                    if (res.success && res.secure_url) {
                                        // Update local state
                                        finalImages[id] = res.secure_url;
                                        if (idx === 0) finalImages.square = res.secure_url;
                                        if (idx === 1) finalImages.vertical = res.secure_url;
                                        if (idx === 2) finalImages.horizontal = res.secure_url;

                                        pendingTasks.delete(idx);

                                        // 🔥 LIVE UPDATE: Update DB immediately for this image
                                        const completedCount = count - pendingTasks.size;
                                        finalImages['_status'] = `generating: ${completedCount}/${count}`;

                                        await prisma.studioMessage.update({
                                            where: { id: messageId },
                                            data: { images: { ...finalImages } }
                                        }).catch(e => logToFile(`[DB-ERR] Update progress error: ${e.message}`));

                                        logToFile(`[PASS ${passes}] ✅ ${id} OK (${completedCount}/${count})`);
                                        return true;
                                    } else {
                                        logToFile(`[PASS ${passes}] ❌ ${id} FAIL: ${res.error || 'Unknown error'}`);
                                        return false;
                                    }
                                }));

                                logToFile(`[WORKER] Batch results: ${JSON.stringify(batchResults.map(r => r.status))}`);
                            }

                            if (pendingTasks.size > 0 && passes < maxPasses) {
                                const waitTime = 3000 * passes;
                                logToFile(`[PASS ${passes}] Reintentos pendientes: ${pendingTasks.size}. Esperando ${waitTime}ms...`);
                                await new Promise(r => setTimeout(r, waitTime));
                            }
                        }
                        logToFile(`[WORKER] Ciclo completado. Pendientes finales: ${pendingTasks.size}`);
                    } catch (err: any) {
                        logToFile(`[FATAL] Error en loop de worker: ${err.message}`);
                    } finally {
                        logToFile(`[WORKER] 🏁 Finalizando y limpiando status...`);
                        try {
                            const finalToSave = { ...finalImages };
                            delete finalToSave._status;
                            delete finalToSave._imagePrompt;
                            delete finalToSave._photoCount;

                            if (messageId) {
                                await prisma.studioMessage.update({
                                    where: { id: messageId },
                                    data: { images: finalToSave }
                                });
                            }
                            logToFile(`[WORKER] Status removido exitosamente. Finalizado con éxito.`);
                        } catch (finalErr: any) {
                            logToFile(`[WORKER] Error en cleanup final: ${finalErr.message}`);
                        }
                    }
                })().catch(e => logToFile(`[ERR] Worker Crash: ${e.message}`));
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
        logToFile(`[API] Error: ${error.message}`)
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
