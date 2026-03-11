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

// Helper for artificial delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

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



const CORE_CARMATCH_VISION = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 MISIÓN PRINCIPAL (INMUTABLE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CarMatch NO es solo una app de venta. Es la COMUNIDAD SUPREMA de todo lo motorizado terrestre.
INCLUYE OBLIGATORIAMENTE: Autos, Motos, Camiones, Camionetas, Cuatrimotos, Buggies, Motocarros, Talleres Mecánicos, Detailers, Refaccionarias, Drift Teams, Car Meets, Autolavados, Tuners, y Coleccionistas.

🔗 REGLA DE ENLACES OBLIGATORIA:
- TODA descripción viral para redes sociales DEBE incluir el enlace "carmatchapp.net" de forma natural y atractiva. ES OBLIGATORIO en cada post.

🎨 ESTÉTICA Y BRANDING:
- Producción cinemática 8k, iluminación "God Rays", estilo de alto nivel.
- SIEMPRE 9:16 Vertical.
- Branding "CarMatch" INTEGRADO ORGÁNICAMENTE: Grafiti, letreros neón, ropa, placas, paredes, etc. NUNCA marcas de agua flotantes.

🚨 REGLA DE ORO DE CIERRE (COMUNIDAD):
- En contenido multi-imagen, la última SIEMPRE es un TIP EDUCATIVO para Compradores, Vendedores o Negocios (Talleres, Refaccionarias, etc. - EXCEPTO servicios públicos).
- El tip debe invitar a unirse a CarMatch usando "carmatchapp.net".
`;

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

        const prompt = `Eres el DIRECTOR CREATIVO Y ESTRATEGA DE COMUNIDAD de CarMatch. 
${CORE_CARMATCH_VISION}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 FORMATOS QUE DOMINAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Detecta automáticamente qué formato pide el usuario y ajusta el photoCount:

1. 🎡 CARRUSEL/CARRETE (5-10 slides)
   - Cada slide = una idea. Slide final = CTA a la comunidad.
   - Ejemplo: "5 autos que definieron una era", "Antes y después de restauración"

2. ❓ TRIVIA DINÁMICA (7 slides)
   - 3 preguntas (1 slide cada una), 3 respuestas (slides después de cada pregunta), 1 slide final de CTA.
   - Los prompts deben incluir el texto superpuesto de la pregunta/opción.

3. 🗳️ ENCUESTA / POLL (2-3 slides)
   - "¿Cuál prefieres: A vs B?" — incluye texto visual de las opciones.

4. 💡 CONSEJO / TIP DEL DÍA (1 slide)
   - Visual minimalista + texto del tip integrado en la escena.

5. 🔥 MEME MOTORIZADO (1-2 slides)
   - Alta energía, humor de la cultura automotriz, texto overlay integrado.

6. 🏆 VERSUS/BATALLA (2-3 slides)
   - Dos vehículos o marcas enfrentados. Slide final: "¿Tú qué opinas? Comenta 👇"

7. 📖 HISTORIA / STORYTELLING (3-5 slides)
   - Narrativa visual de un auto, marca, o personaje de la cultura motor.

8. 🏪 SPOTLIGHT DE NEGOCIO (3-4 slides)
   - Para destacar un taller, autolavado, refaccionaria, etc. de la comunidad.

9. 🎉 RETO / CHALLENGE (1-2 slides)
   - "TAG a tu copiloto favorito 🏁" — contenido que invite a mencionar amigos.

10. 📚 EDUCATIVO (4-6 slides)
    - "¿Sabías que...?", tips de mantenimiento, historia de un modelo, etc.

11. 🚨 NOTICIA / LANZAMIENTO (1-2 slides)
    - Anuncio de un auto nuevo, evento, car meet, etc.

12. 🖼️ IMAGEN ÚNICA VIRAL (1 slide)
    - Foto épica de un vehículo o escena para máxima difusión.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 REGLAS DE ESTÉTICA Y BRANDING OBLIGATORIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Todo se ve como producción de alto presupuesto (lighting "God Rays", 8k, cinematic).
- Formato de imagen: SIEMPRE vertical 9:16 (1080×1920) — estándar para todas las redes.
- El branding "CarMatch" se integra ORGÁNICAMENTE: en una pared como grafiti, en la camisa de un mecánico, en un letrero neón, en las placas, en un espectacular, en la puerta de un negocio, en el remolque de un camión, etc. NUNCA como marca de agua pegada encima.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 REGLA DE ORO DE CIERRE (EL CTA DEFINITIVO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Para TODO formato que tenga más de 1 imagen (Carrusel, Trivia, Educativo, etc.), la ÚLTIMA IMAGEN SIEMPRE DEBE SER UN LLAMADO A LA ACCIÓN (CTA) QUE CONSTRUYA COMUNIDAD.
- En el prompt de la última imagen, especifica un texto overlay con un *buen consejo* dirigido a: Compradores, Vendedores, o Negocios Automotrices (talleres, lavado, refaccionarias, detailers — NUNCA servicios públicos).
- Ejemplo de texto: "TIP PARA COMPRADORES: Revisa el historial. Únete a la comunidad CarMatch" o "TIP PARA NEGOCIOS: Ofrece garantía. Registra tu taller en CarMatch".
- El fondo de esta última imagen debe tener el logo/nombre de CarMatch integrado orgánicamente, dando cierre al pack.
- ASEGÚRATE de sumar esta imagen extra al "photoCount".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 CÓMO RESPONDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hay DOS modos:

MODO CONVERSACIÓN (cuando el usuario está explorando ideas):
- Responde como el Director Creativo que eres. Pregunta, propón, opina.
- Usa emojis, slang automotriz, entusiasmo real.
- NUNCA digas "como asistente..." — eres un experto con carácter.
- Devuelve JSON con: {"type": "CHAT", "message": "tu respuesta aquí"}

MODO PROMPT FINAL (cuando el usuario dice "dame el prompt", "listo", "genera", "hazlo" o similar):
- Devuelve el JSON completo con todos los parámetros para generar las imágenes.
- {"type": "PROMPT_READY", "message": "...", "imagePrompt": "...", "photoCount": N, "contentType": "CARRUSEL|TRIVIA|POLL|TIP|MEME|VERSUS|HISTORIA|SPOTLIGHT|RETO|EDUCATIVO|NOTICIA|VIRAL", "platforms": {"instagram": true, "tiktok": true, "facebook": true, "x": true, "kwai": true, "threads": true, "snapchat": true, "google_ads": true}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HISTORIAL DE LA CONVERSACIÓN:
${contextStr}

ÚLTIMO MENSAJE DEL USUARIO: "${lastMessage}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Responde ÚNICAMENTE con JSON válido.`


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

            try {
                const refinement = await geminiFlashConversational.generateContent({
                    contents: [{
                        role: 'user',
                        parts: [{ text: `Eres el DIRECTOR DE ARTE DE CARMATCH. Tu misión es refinar prompts para que sean obras de arte cinemáticas.
${CORE_CARMATCH_VISION}

REGLA CRÍTICA: Mantén la esencia del usuario pero eleva la calidad visual al nivel de una película de Hollywood.
Refina este prompt para Fal.ai (Flux): "${imagePrompt}"` }]
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
            const callbackUrl = `${webhookUrl}?messageId=${encodeURIComponent(messageId)}&idx=${t.idx}&format=${t.format}`;
            await triggerFalAsyncGeneration({
                messageId,
                idx: t.idx,
                format: t.format,
                prompt,
                webhookUrl: callbackUrl
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
    photoCount?: number;
}) {
    try {
        console.log('[CAMPAIGN] Saving studio result to persistent campaign...');

        // 🛡️ Basic Rate Limit / Concurrency Protection (Simple Semaphore)
        // Check if there's a campaign created in the last 15 seconds to avoid double-triggers
        const recentCampaign = await prisma.publicityCampaign.findFirst({
            where: { createdAt: { gte: new Date(Date.now() - 15000) } }
        });
        if (recentCampaign) {
            console.warn('[CAMPAIGN] Batch already in progress. Skipping duplicate trigger.');
            return { success: true, campaignId: recentCampaign.id };
        }

        // 1. Build webhook URL so Fal.ai can call back after generating
        // Prioritize NEXTAUTH_URL or VERCEL_URL for production stability
        const baseUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
        
        let finalHost = 'carmatchapp.net';
        if (!baseUrl) {
            const { headers: nextHeaders } = require('next/headers');
            const headersList = await nextHeaders();
            finalHost = headersList.get('host') || 'carmatchapp.net';
        } else {
            finalHost = baseUrl.replace(/^https?:\/\//, '');
        }

        const protocol = finalHost.includes('localhost') ? 'http' : 'https';
        const webhookUrl = `${protocol}://${finalHost}/api/studio/webhook`;

        // 2. Create the Campaign record
        const campaign = await prisma.publicityCampaign.create({
            data: {
                title: data.title || 'Nueva Campaña CarMatch',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                isActive: true,
                imageUrl: '',
                metadata: { 
                    strategy: data.strategy || 'Estrategia de Difusión', 
                    originalPrompt: data.imagePrompt || '' 
                }
            }
        });

        // 3. Create ONE Universal Post for all social media platforms
        const post = await prisma.socialPost.create({
            data: {
                campaignId: campaign.id,
                platform: 'INSTAGRAM',
                content: data.caption || '¡Mira lo nuevo en CarMatch!',
                videoScript: data.videoScript || '',
                aiPrompt: data.imagePrompt || '',
                status: 'DRAFT',
                targetPersona: 'Universal Diffusion'
            }
        });

        const photoCount = data.photoCount || 1;
        const callbackUrlBase = `${webhookUrl}?postId=${encodeURIComponent(post.id)}&format=vertical`;
        
        try {
            console.log(`[CAMPAIGN] Triggering UNIVERSAL generation for post ${post.id} (Count: ${photoCount})`);
            
            for (let i = 0; i < photoCount; i++) {
                // 🐌 Artificial Throttling: Wait 1.5s between each image in the carousel
                if (i > 0) {
                    console.log(`[CAMPAIGN] Throttling for slide ${i}...`);
                    await delay(1500);
                }

                const callbackUrl = `${callbackUrlBase}&idx=${i}`;

                // --- 🕵️‍♂️ PERSISTENT DEBUG LOGGING ---
                await prisma.systemLog.create({
                    data: {
                        level: 'INFO',
                        source: 'STUDIO-TRIGGER',
                        message: `Triggering Fal.ai for post ${post.id} (slide ${i})`,
                        metadata: { callbackUrl, photoCount, prompt: data.imagePrompt }
                    }
                });

                await triggerFalAsyncGeneration({
                    messageId: post.id,
                    idx: i,
                    format: 'vertical',
                    prompt: data.imagePrompt,
                    webhookUrl: callbackUrl
                });
                console.log(`[CAMPAIGN] ✅ Triggered slide ${i} for post ${post.id}`);
            }
        } catch (genErr: any) {
            console.error(`[CAMPAIGN] Fal.ai trigger failed:`, genErr);
            await prisma.systemLog.create({
                data: {
                    level: 'ERROR',
                    source: 'STUDIO-TRIGGER',
                    message: `Fal.ai trigger FAILED: ${genErr.message}`,
                    metadata: { error: genErr }
                }
            });
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

export async function deleteCampaign(id: string) {
    try {
        const session = await auth()
        // @ts-ignore
        if (!session?.user?.id || !session.user.isAdmin) throw new Error("Unauthorized: Admin only")

        // Delete associated posts first (manual since no formal cascade in schema)
        await prisma.socialPost.deleteMany({
            where: { campaignId: id }
        });

        // Delete the campaign
        await prisma.publicityCampaign.delete({
            where: { id: id }
        });

        return { success: true };
    } catch (error: any) {
        console.error('[CAMPAIGN] Delete Error:', error);
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

/**
 * Fetches the latest system logs for debugging purposes (Admin Only)
 */
export async function getSystemLogs() {
    try {
        const session = await auth();
        // @ts-ignore
        if (!session?.user?.id || !session.user.isAdmin) {
            return { success: false, error: 'Unauthorized' };
        }

        const logs = await prisma.systemLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 30
        });

        return { success: true, logs };
    } catch (error) {
        console.error('[LOGS] Error:', error);
        return { success: false, error: 'Error fetching logs' };
    }
}
