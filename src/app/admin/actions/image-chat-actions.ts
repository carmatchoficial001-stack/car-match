'use server'
import { geminiFlashConversational } from '@/lib/ai/geminiModels'
import { buildImageUrl } from '@/lib/admin/utils'
import { uploadUrlToCloudinary, robustUploadToCloudinary, uploadBufferToCloudinary } from '@/lib/cloudinary-server'
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { saveStudioMessage, getStudioHistory } from "./studio-history-actions"
import { performFalGeneration, triggerFalAsyncGeneration } from "./studio-generate-logic"
import { SocialPlatform } from "@prisma/client"
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
            cleaned = cleaned.replace(/\\([^"\\\/bfnrtu])/g, '$1');
            
            return cleaned;
        }

        const cleanedResult = cleanJsonResponse(responseText)
        const data = JSON.parse(cleanedResult)

        let targetConvId = conversationId;

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

            const directorPrompt = `Eres el DIRECTOR DE ARTE MULTIMODAL de CarMatch. Tu objetivo es crear imágenes de clase mundial con BRANDING ORGÁNICO.
            🚨 REGLA DE ORO DE BRANDING: integra "CarMatch" NATURALMENTE en la escena.`;

            let refinedPrompt = imagePrompt;
            try {
                const refinement = await geminiFlashConversational.generateContent({
                    contents: [{
                        role: 'user',
                        parts: [{ text: `${directorPrompt}\n\nRefina este prompt: "${imagePrompt}"` }]
                    }]
                }) as any;
                const aiRefined = refinement.response.text().trim();
                if (aiRefined && aiRefined.length > 20) refinedPrompt = aiRefined;
            } catch (e) {}

            const saveRes = await saveStudioMessage({
                conversationId: targetConvId,
                role: 'assistant',
                content: data.message || 'Propuesta creativa lista 🔥',
                type: 'PROMPT_READY',
                imagePrompt: refinedPrompt,
                images: finalImages,
                platforms: data.platforms || {}
            })
            
            if (saveRes.success) {
                targetConvId = saveRes.conversationId;
            }

            return {
                success: true,
                messageId: saveRes.success ? saveRes.messageId : undefined,
                conversationId: targetConvId,
                type: 'PROMPT_READY' as const,
                message: data.message || 'Propuesta creativa lista 🔥',
                imagePrompt: refinedPrompt,
                images: finalImages,
                platforms: data.platforms || {},
            }
        }

        // Standard CHAT message
        const saveRes = await saveStudioMessage({
            conversationId: targetConvId,
            role: 'assistant',
            content: data.message || 'Cuéntame más sobre tu idea...',
            type: 'CHAT'
        });
        
        if (saveRes.success) {
            targetConvId = saveRes.conversationId;
        }

        return {
            success: true,
            messageId: saveRes.success ? saveRes.messageId : undefined,
            conversationId: targetConvId,
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

        // 🚀 TRIGGER ASYNC GENERATION
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

            // Update status
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

// --- CAMPAIGNS INTEGRATION ---

/**
 * Converts an AI Studio strategy into a persistent PublicityCampaign with SocialPosts.
 * Triggers background generation for all platform/format triplets.
 */
export async function saveStudioToCampaign(data: {
    title: string;
    strategy: string;
    caption: string;
    imagePrompt: string;
    videoScript: string;
    userId: string;
}) {
    try {
        console.log('[CAMPAIGN] Saving studio result to persistent campaign...');

        // 1. Build webhook URL so Fal.ai can call back after generating
        const vercelUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
        const webhookUrl = `${vercelUrl}/api/studio/webhook`;

        // 2. Create the Campaign record
        const campaign = await prisma.publicityCampaign.create({
            data: {
                title: data.title,
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                isActive: true,
                imageUrl: '',
                metadata: { strategy: data.strategy, originalPrompt: data.imagePrompt }
            }
        });

        // 3. Platforms — exactly what the user requested
        const platforms: SocialPlatform[] = [
            'TIKTOK', 'INSTAGRAM', 'FACEBOOK', 
            'TWITTER', 'KWAI', 'THREADS', 'SNAPCHAT', 'GOOGLE_ADS'
        ];

        // 4. Create ONE SocialPost per platform and trigger ONE vertical image
        // Vertical 9:16 is the best single format: native for TikTok, Reels, Stories, Kwai, Snapchat
        for (const platform of platforms) {
            const post = await prisma.socialPost.create({
                data: {
                    campaignId: campaign.id,
                    platform,
                    content: data.caption,
                    videoScript: data.videoScript,
                    aiPrompt: data.imagePrompt,
                    status: 'DRAFT',
                    targetPersona: 'Auto-generated'
                }
            });

            const callbackUrl = `${webhookUrl}?postId=${encodeURIComponent(post.id)}&idx=0&format=vertical`;
            try {
                await triggerFalAsyncGeneration({
                    messageId: post.id,
                    idx: 0,
                    format: 'vertical',
                    prompt: data.imagePrompt,
                    webhookUrl: callbackUrl
                });
                console.log(`[CAMPAIGN] ✅ Triggered vertical for ${platform}, post ${post.id}`);
            } catch (genErr) {
                console.error(`[CAMPAIGN] Fal.ai trigger failed for ${platform}:`, genErr);
            }
        }

        return { success: true, campaignId: campaign.id };
    } catch (error: any) {
        console.error('[CAMPAIGN] Error saving campaign:', error);
        return { success: false, error: error.message };
    }
}



/**
 * Fetches all campaigns with their posts for the UI.
 */
export async function getCampaigns() {
    try {
        const campaigns = await prisma.publicityCampaign.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                // Since there is no formal relation in schema.prisma for SocialPost -> PublicityCampaign
                // (it's optional String? campaignId), we'll have to fetch manually if needed or check relations.
                // Wait, schema.prisma line 844: campaignId String? (no relation defined)
            }
        });

        // Manual relation mapping since Prisma schema doesn't have it defined
        const allPosts = await prisma.socialPost.findMany();

        const result = campaigns.map(c => ({
            ...c,
            posts: allPosts.filter(p => p.campaignId === c.id)
        }));

        return { success: true, campaigns: result };
    } catch (error: any) {
        console.error('[CAMPAIGN] Error fetching campaigns:', error);
        return { success: false, error: error.message };
    }
}

export async function generateRandomCampaign(conversationId?: string) {
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
    
    // We pass the conversationId (if any) to chatWithImageDirector
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
