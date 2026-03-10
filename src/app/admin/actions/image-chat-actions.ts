'use server'
import { geminiFlashConversational } from '@/lib/ai/geminiModels'
import { buildImageUrl } from '@/lib/admin/utils'
import { uploadUrlToCloudinary, robustUploadToCloudinary, uploadBufferToCloudinary } from '@/lib/cloudinary-server'
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { saveStudioMessage, getStudioHistory } from "./studio-history-actions"
import { performFalGeneration, triggerFalAsyncGeneration } from "./studio-generate-logic"
import fs from 'fs'
import path from 'path'

const RAW_LOG_FILE = 'e:/carmatchapp/studio-raw.log';

function rawLog(msg: string) {
    try {
        const timestamp = new Date().toISOString();
        const entry = `[${timestamp}] ${msg}\n`;
        fs.appendFileSync(RAW_LOG_FILE, entry);
        console.log(`[RAW-LOG] ${msg}`);
    } catch (e) {
        console.error("Failed to write raw log", e);
    }
}


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
        console.log(`[STUDIO-LOG] ${level}: ${message}`)
    } catch (e) {
        console.error("Critical: Failed to save systemic log", e)
    }
}

/**
 * Internal helper to determine which formats (Square, Vertical, Horizontal) are needed.
 * Now defaults to ALL THREE for general distribution as requested.
 */
function getRequiredFormats() {
    // Optimization: Generate ONLY square. Others are derived via Cloudinary.
    return ['square'] as const;
}



/**
 * Main chat function — Creative Director AI
 */
export async function chatWithImageDirector(
    messages: { role: 'user' | 'assistant'; content: string }[],
    conversationId?: string,
    targetCountry: string = 'MX'
) {
    const session = await auth()
    // @ts-ignore
    if (!session?.user?.id || !session.user.isAdmin) return { success: false, error: "Unauthorized: Admin only" }

    rawLog(`chatWithImageDirector called. Conv: ${conversationId}`);
    try {
        const lastMessage = messages[messages.length - 1]?.content || ''
        const contextStr = messages.map(m =>
            `${m.role === 'user' ? 'USUARIO' : 'DIRECTOR CREATIVO'}: ${m.content}`
        ).join('\n')

        const prompt = `Eres el DIRECTOR CREATIVO SUPREMO de CarMatch México.
Tu personalidad: Eres apasionado, visionario, dominas la jerga creativa y el marketing digital mexicano. 
Tu objetivo es ganar la batalla de la atención en redes sociales con contenido que se vea CARÍSIMO y PROFESIONAL.

ESTÉTICA Y CALIDAD "ELITE" (BAJO TU RESPONSABILIDAD):
- Todo debe verse como una producción de alto presupuesto (lighting "God Rays", Arri Alexa, texturas ultra 8k).
- Los autos deben lucir imponentes, limpios y deseables.

BRANDING ORGÁNICO MAESTRO (CRÍTICO):
- ¡NO pongas marcas de agua pegadas! La marca "CarMatch" debe ser parte del ALMA de la imagen.
- INSTRUCCIÓN OBLIGATORIA: En cada prompt técnico, ordena que el texto "CarMatch" aparezca de forma NATURAL y LEGIBLE en la escena.
- Ejemplos: El nombre "CarMatch" en un letrero neón de fondo, bordado en la playera de un mecánico, en un grafiti estilizado en un muro, en una placa personalizada de un auto, en una gorra o en un anuncio espectacular de la ciudad.
- El texto debe ser coherente con la perspectiva, sombras y estilo de la imagen.

MATRIZ DE ESTILOS:
1. MODO ELITE (CINEMATIC): Lujo, iluminación dramática.
2. MODO CALLE: Realismo crudo, auténtico, taller, barrio.
3. MODO SIMPLE: Minimalismo limpio.
4. MODO VIRAL: Estética de redes, ángulos raros, alto impacto.

REGLAS DE ORO:
- Responde ÚNICAMENTE con el JSON cuando envíes el "PROMPT_READY".
- Incluye siempre "masterpiece, 8k, highly detailed, professional car photography" y especifica la ubicación exacta del texto "CarMatch" en el imagePrompt.

HISTORIAL:
${contextStr}

INSTRUCCIONES DE RESPUESTA JSON:
{
    "type": "PROMPT_READY",
    "message": "Mensaje entusiasta en ESPAÑOL resaltando el valor de COMUNIDAD o NEGOCIO.",
    "imagePrompt": "ULTRA DETAILED prompt in ENGLISH (Include atmospheric details of workshops, gadgets or lifestyle scenes if applicable).",
    "photoCount": 5,
    "platforms": { "instagram": true, "tiktok": true, "facebook": true, "x": true }
}

REGLAS DE CAMPAÑA:
- TRIVIA: 6 fotos (3 preguntas y 3 respuestas) + 1 foto final de CONSEJO/CTA. Total = 7.
- CARRETE / PACK: 5 a 10 fotos + 1 foto final de CONSEJO/CTA.
- ¡OBLIGATORIO!: La ÚLTIMA IMAGEN de cada pack debe ser un "CONSEJO AUTOMOTRIZ" útil que termine con una invitación a unirse a la comunidad CarMatch.
- En el JSON, asegúrate de que "photoCount" incluya esta imagen final.
`

        const result = await geminiFlashConversational.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.9,
                maxOutputTokens: 4096
            }
        }) as any

        let responseText = result.response.text().trim()
        
        // 🧪 Robust JSON Extraction
        const cleanJsonResponse = (text: string) => {
            let cleaned = text.trim();
            // Remove markdown wrappers
            if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
            else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/```/g, '').trim();

            // 🛡️ Fix common invalid escape sequences (like \( or \ ) often generated by LLMs
            // This regex finds a backslash not followed by valid JSON escape chars (", \, /, b, f, n, r, t, u)
            // and removes it, keeping the character.
            cleaned = cleaned.replace(/\\([^"\\\/bfnrtu])/g, '$1');
            
            return cleaned;
        }

        const cleanedResult = cleanJsonResponse(responseText)
        const data = JSON.parse(cleanedResult)

        if (data.type === 'PROMPT_READY' && data.imagePrompt) {
            const imagePrompt = data.imagePrompt
            const DEFAULT_PHOTO_COUNT = 11;
            const count = Math.max(1, Math.min(100, data.photoCount || DEFAULT_PHOTO_COUNT));

            const finalImages: Record<string, any> = {
                '_status': 'generating',
                '_imagePrompt': imagePrompt,
                '_photoCount': count,
                '_lastUpdate': Date.now()
            }

            let messageId: string | undefined = undefined
            if (conversationId) {
                const directorPrompt = `Eres el DIRECTOR DE ARTE MULTIMODAL de CarMatch. Tu objetivo es crear imágenes de clase mundial con BRANDING ORGÁNICO.
                
                🚨 REGLA DE ORO DE BRANDING:
                NO uses marcas de agua generadas por software. En su lugar, integra la palabra "CarMatch" NATURALMENTE en la escena (ejemplo: en el letrero de un taller, bordado en la camisola de un mecánico, en la pantalla de una laptop, o en un anuncio espectacular al fondo). El texto debe ser nítido y legible.

                🚨 SELECCIÓN DE PROTOCOLO TÉCNICO:
                
                - SI EL USUARIO PIDE "CINE/PRO/ELITE": "Cinematic wide shot, Arri Alexa 65, Anamorphic 35mm lens, f/2.8, dramatic chiaroscuro lighting, professional color grading, volumentric fog, realistic textures, 8k resolution".
                - SI EL USUARIO PIDE "REAL/STREET/CALLE": "Street photography style, shot on iPhone 15 Pro, handheld look, natural daylight, candid moment, gritty asphalt textures, motion blur, authentic Mexican city background".
                - SI EL USUARIO PIDE "SIMPLE/MINIMALIST": "Studio minimalist setup, solid pastel background, high-key soft lighting, center-weighted composition, sharp focus, clean lines, plenty of negative space for text overlays".
                - SI EL USUARIO PIDE "VIRAL/STORIES": "Dynamic low angle, vibrant saturated colors, close-up macro details, high contrast, social media trending aesthetic, bokeh background".

                CONSIGNA: Cero futurismo barato o IA deforme. Solo autos y personas reales. Máxima calidad fotográfica.
                
                CONTEXTO DEL USUARIO: "${lastMessage}"
                
                INSTRUCCIÓN: Escribe un PROMPT EN INGLÉS que sea una ORDEN técnica perfecta incluyendo la integración de la marca "CarMatch" de forma natural.`;

                let refinedPrompt = imagePrompt;
                try {
                    // Refine the prompt using Gemini before saving
                    const refinement = await geminiFlashConversational.generateContent({
                        contents: [
                            {
                                role: 'user',
                                parts: [{ text: `${directorPrompt}\n\nRefina este prompt de usuario: "${imagePrompt}"` }]
                            }
                        ]
                    }) as any;
                    const aiRefined = refinement.response.text().trim();
                    if (aiRefined && aiRefined.length > 20) {
                        refinedPrompt = aiRefined;
                    }
                } catch (refineError) {
                    console.error("[STUDIO-REFINE] Error de refinamiento AI:", refineError);
                    await recordLog(`Fallo refinamiento AI. Usando prompt original.`, 'WARN');
                }

                const saveRes = await saveStudioMessage({
                    conversationId,
                    role: 'assistant',
                    content: data.message || 'Propuesta creativa lista 🔥',
                    type: 'PROMPT_READY',
                    imagePrompt: refinedPrompt,
                    images: finalImages,
                    platforms: data.platforms || {}
                })
                if (saveRes.success) messageId = saveRes.messageId
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

        // Save standard CHAT message to history if conversation exists
        let messageId: string | undefined = undefined;
        if (conversationId) {
            const saveRes = await saveStudioMessage({
                conversationId,
                role: 'assistant',
                content: data.message || 'Cuéntame más sobre tu idea...',
                type: 'CHAT'
            });
            if (saveRes.success) messageId = saveRes.messageId;
        }

        return {
            success: true,
            messageId,
            type: 'CHAT' as const,
            message: data.message || 'Cuéntame más sobre tu idea...',
        }
    } catch (error: any) {
        return { success: false, type: 'CHAT' as const, message: `❌ Error: ${error.message}` }
    }
}

/**
 * Generates the next available image in a multi-format batch.
 * Refactored to use ASYNCHRONOUS WEBHOOKS to bypass Vercel 10s timeout.
 */
export async function processNextImageBatch(messageId: string) {
    rawLog(`processNextImageBatch (ASYNC) called for ${messageId}`);
    try {
        const session = await auth();
        // @ts-ignore
        if (!session?.user?.id || !session.user.isAdmin) throw new Error("Unauthorized: Admin only");

        const msg = await prisma.studioMessage.findUnique({
            where: { id: messageId, userId: session.user.id }
        });

        if (!msg || !msg.imagePrompt) return { success: false, error: "Prompt not found" };

        const images = (msg.images as any) || {};
        const prompt: string = msg.imagePrompt;
        const count = images._photoCount || 1;
        const requiredFormats = getRequiredFormats();

        // Identify pending tasks (idx, format)
        const pendingTasks: { idx: number; format: 'square' | 'vertical' | 'horizontal' }[] = [];
        for (let i = 0; i < count; i++) {
            for (const format of requiredFormats) {
                const key = `img_${i}_${format}`;
                if (!images[key]) {
                    pendingTasks.push({ idx: i, format });
                }
            }
        }

        if (pendingTasks.length === 0) {
            // Atomic removal of temp flags if fully done
            await prisma.$executeRawUnsafe(
                `UPDATE "StudioMessage" SET images = images - '_status' - '_imagePrompt' - '_photoCount' - '_lastUpdate' WHERE id = $1`,
                messageId
            );
            return { success: true, completed: true };
        }

        // 🛡️ CONCURRENCY LOCK with 45s EXPIRATION
        // We only allow one worker if '_isBatchWorking' is null/false OR if the '_lastUpdate' is older than 45s
        const now = Date.now();
        const expirationMs = 45 * 1000;
        const lockResult = await prisma.$executeRawUnsafe(
            `UPDATE "StudioMessage" 
             SET images = COALESCE(images, '{}'::jsonb) || '{"_isBatchWorking": true}'::jsonb 
             WHERE id = $1 AND (
                images->>'_isBatchWorking' IS NULL OR 
                images->>'_isBatchWorking' = 'false' OR
                (images->>'_lastUpdate')::bigint < $2
             )`,
            messageId,
            now - expirationMs
        );

        if (lockResult === 0) {
            rawLog(`[LOCK] Message ${messageId} is busy or recently pulsed. Skipping.`);
            return { success: true, processing: true };
        }

        // 🚀 TRIGGER ASYNC GENERATION (Starts and ends in < 1 second)
        const { headers: nextHeaders } = require('next/headers');
        const headersList = await nextHeaders();
        const host = headersList.get('host') || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const webhookUrl = `${protocol}://${host}/api/studio/webhook`;

        const t = pendingTasks[0];
        try {
            console.log(`[STUDIO-ASYNC] Queuing [${t.idx}/${t.format}] for ${messageId}`);
            await triggerFalAsyncGeneration({
                messageId,
                idx: t.idx,
                format: t.format,
                prompt,
                webhookUrl
            });

            // Update status (Lock will be released by webhook, but we update lastUpdate to keep it "alive")
            const statusObj = JSON.stringify({
                '_status': `generating: Queued ${t.idx}/${t.format}...`,
                '_lastUpdate': Date.now()
            });

            await prisma.$executeRawUnsafe(
                `UPDATE "StudioMessage" SET images = images || $1::jsonb WHERE id = $2`,
                statusObj,
                messageId
            );

            return { success: true, processing: true };
        } catch (err: any) {
            // Release lock on trigger failure
            await prisma.$executeRawUnsafe(
                `UPDATE "StudioMessage" SET images = images || '{"_isBatchWorking": false}'::jsonb WHERE id = $1`,
                messageId
            );
            throw err;
        }
    } catch (e: any) {
        console.error("[STUDIO-BATCH-ERROR]", e.message);
        return { success: false, error: e.message };
    }
}

/**
 * Client Upload Bridge
 */
export async function uploadClientGeneratedImage(messageId: string, idx: number, base64: string, format: string = 'square') {
    try {
        const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const res = await uploadBufferToCloudinary(buffer);
        if (res.success && res.secure_url) {
            const msg = await prisma.studioMessage.findUnique({ where: { id: messageId } });
            const imagesToMerge = JSON.stringify({
                [`img_${idx}_${format}`]: res.secure_url,
                '_lastUpdate': Date.now()
            });
            await prisma.$executeRawUnsafe(
                `UPDATE "StudioMessage" SET images = COALESCE(images, '{}'::jsonb) || $1::jsonb WHERE id = $2`,
                imagesToMerge,
                messageId
            );
            return { success: true, secure_url: res.secure_url };
        }
        return { success: false, error: "Upload failed" };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function reportClientError(messageId: string, error: string) {
    await recordLog(`Client Error [${messageId}]: ${error}`, 'ERROR');
    return { success: true };
}

async function robustUploadBufferToCloudinary(buffer: Buffer) {
    const { uploadBufferToCloudinary } = await import('@/lib/cloudinary-server');
    return await uploadBufferToCloudinary(buffer);
}

export async function generateRandomCampaign(conversationId?: string) {
    // Reuses logic from chatWithImageDirector with a random preset
    const NICHES = [
        "Noticias de último minuto (Lanzamiento mundial de un Hypercar en un escenario futurista)",
        "Laboratorio de Diseño (Auto concepto bajo luces de neón con bocetos holográficos)",
        "Tecnología del Futuro (Auto eléctrico cargándose sin cables, dashboards holográficos)",
        "Taller Mecánico de alta gama (Herramientas modernas, motores abiertos, organización impecable)",
        "Estética Automotriz (Detailing, pulido de pintura, espuma activa, interiores de lujo)",
        "Road Trip Familiar (Paisajes naturales, SUVs cargadas, atardeceres en carretera)",
        "Espionaje Automotriz (Prototipo camuflado probándose en el desierto o nieve)",
        "Cultura Racing (Pit stops de F1, drifting nocturno en ciudades iluminadas)",
        "Motos y Libertad (Café racers, cruisers en rutas costeras, cascos personalizados)",
        "Maquinaria Pesada y Fuerza (Grúas gigantes, tractores modernos, ingeniería civil)",
        "Clásicos Eternos (Museos de autos, garajes de coleccionistas, elegancia vintage)",
        "Off-Road Extremo (Jeeps escalando rocas, barro volando, expediciones en la selva)",
        "Tuning y Modding (Showrooms de personalización, rines sobredimensionados, pintura camaleón)",
        "Seguridad y Blindaje (Vehículos tácticos, cristales reforzados, escoltas ejecutivas)"
    ];
    const FORMATS = [
        "BREAKING NEWS: ¡Se filtran imágenes del nuevo modelo que cambiará la industria!",
        "TECH INSIGHT: ¿Cómo funciona la nueva batería de estado sólido? Explicación visual.",
        "DUELO DE TITANES: Comparamos el diseño del clásico vs el nuevo lanzamiento.",
        "TRIVIA DE EXPERTOS: Pon a prueba los conocimientos de tu audiencia.",
        "DENTRO DEL LABORATORIO: El proceso secreto de cómo se diseña un coche de lujo.",
        "EL ANTES Y DESPUÉS: Restauración extrema de un clásico abandonado.",
        "¿QUÉ PREFIERES?: Elección entre dos estilos de vida automotriz muy diferentes.",
        "DATO CURIOSO: La historia oculta detrás de una marca legendaria.",
        "GUÍA RÁPIDA: 3 cosas que debes revisar antes de comprar este tipo de vehículo.",
        "VISIÓN 2050: Cómo imaginamos que será este segmento en el futuro lejano.",
        "RETO DE DISEÑO: ¿Cómo se vería este auto si fuera diseñado por una marca de lujo?"
    ];
    const n = NICHES[Math.floor(Math.random() * NICHES.length)];
    const f = FORMATS[Math.floor(Math.random() * FORMATS.length)];
    const finalUserPrompt = `Genera una campaña de ${n} estilo ${f}. IMPORTANTE: Responde ÚNICAMENTE con el JSON de tipo PROMPT_READY para iniciar la generación de imágenes de inmediato.`;
    const result = await chatWithImageDirector([{ role: 'user', content: finalUserPrompt }], conversationId);
    return { ...result, usedPrompt: `${n} (${f})` };

}

export async function restartStudioWorker(messageId: string) {
    const session = await auth();
    // @ts-ignore
    if (!session?.user?.id || !session.user.isAdmin) return { success: false };

    const msg = await prisma.studioMessage.findUnique({ where: { id: messageId } });
    if (!msg) return { success: false };
    const imagesToMerge = JSON.stringify({
        '_status': 'generating: restarted',
        '_lastUpdate': Date.now()
    });
    await prisma.$executeRawUnsafe(
        `UPDATE "StudioMessage" SET images = COALESCE(images, '{}'::jsonb) || $1::jsonb WHERE id = $2`,
        imagesToMerge,
        messageId
    );
    return { success: true };
}
