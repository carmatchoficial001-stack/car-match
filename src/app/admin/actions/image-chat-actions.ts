'use server'

import { geminiFlashConversational } from '@/lib/ai/geminiModels'
import { buildImageUrl } from '@/lib/admin/utils'
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

/**
 * Internal helper to determine which formats (Square, Vertical, Horizontal) are needed.
 * Now defaults to ALL THREE for general distribution as requested.
 */
function getRequiredFormats(platforms: Record<string, any> = {}) {
    // The user wants specialized results for EACH platform mentioned.
    // To ensure full coverage (TikTok/X=Vertical, IG Feed=Square, FB/Ads=Horizontal),
    // we generate all three main formats for the pack.
    return ['square', 'vertical', 'horizontal'] as const;
}

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
Tu objetivo es platicar con el usuario en ESPAÑOL DE MÉXICO para entender su visión.
Una vez que la idea esté clara, propón un "PROMPT_READY" detallado.

REGLAS DE INTERACCIÓN:
1. Siempre habla en ESPAÑOL DE MÉXICO (adaptado culturalmente, profesional y creativo).
2. ¡MÁXIMA VERSATILIDAD!: Somos un HUB de información y comunidad. Genera contenido para:
   - NOTICIAS Y LANZAMIENTOS: El último deportivo, filtraciones, noticias de la industria, "spyshots".
   - TECNOLOGÍA Y FUTURO: Inteligencia artificial en autos, conducción autónoma, motores de hidrógeno, gadgets.
   - DISEÑO Y CONCEPTOS: Sketches futuristas, prototipos de salones internacionales, evolución del diseño.
   - NEGOCIOS LOCALES: Talleres, detailing, refaccionarias, autolavados.
   - COMUNIDAD Y DEBATE: Trivias, retos, comparativas "Duelo de Titanes", historias de aficionados.
3. El objetivo es que CarMatch sea la referencia número 1 donde el usuario encuentra TODO sobre el mundo motor.
4. Cuando el usuario pida generar la imagen, responde con "PROMPT_READY".

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
        if (responseText.startsWith('```json')) responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
        else if (responseText.startsWith('```')) responseText = responseText.replace(/```/g, '').trim()

        const data = JSON.parse(responseText)

        if (data.type === 'PROMPT_READY' && data.imagePrompt) {
            const imagePrompt = data.imagePrompt
            const count = Math.max(1, Math.min(100, data.photoCount || 1))

            const finalImages: Record<string, any> = {
                '_status': 'generating',
                '_imagePrompt': imagePrompt,
                '_photoCount': count,
                '_lastUpdate': Date.now()
            }

            let messageId: string | undefined = undefined
            if (conversationId) {
                // System Instruction for the visual prompt (Natural branding)
                const directorPrompt = `Eres el DIRECTOR DE ARTE de CarMatch. Tu objetivo es crear imágenes de alta gama donde la marca esté presente de forma sofisticada.
                Analiza este contexto: "${lastMessage}"
                
                🚨 IDENTIDAD CORPORATIVA ESTRICTA (LOGO OFICIAL V20):
                1. EL LOGO ES INVARIABLE: No se permiten variaciones de color ni de modelo de auto.
                2. ICONO: Debe ser EXACTAMENTE un SUPERDEPORTIVO NARANJA estilizado visto de frente (estilo agresivo y moderno) con acentos laterales en AZUL PROFUNDO.
                3. TEXTO: La palabra "CarMatch" debe aparecer debajo del auto en una tipografía Sans-Serif moderna y color naranja brillante.
                4. INTEGRACIÓN SUTIL: El logo completo debe integrarse NATURALMENTE en la escena (grabado en vidrio, emblema en pared, pantalla digital, bordado en piel).
                
                INSTRUCCIÓN: Toma el prompt del usuario y transfórmalo en un ULTRA-DETAILED IMAGE PROMPT en INGLÉS que incluya estas reglas de branding.`;

                // Refine the prompt using Gemini before saving
                const refinement = await geminiFlashConversational.generateContent({
                    contents: [
                        { role: 'system', parts: [{ text: directorPrompt }] },
                        { role: 'user', parts: [{ text: `Refina este prompt: ${imagePrompt}` }] }
                    ]
                }) as any;
                const refinedPrompt = refinement.response.text().trim() || imagePrompt;

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

        return {
            success: true,
            type: 'CHAT' as const,
            message: data.message || 'Cuéntame más sobre tu idea...',
        }
    } catch (error: any) {
        return { success: false, type: 'CHAT' as const, message: `❌ Error: ${error.message}` }
    }
}

/**
 * Generates the next available image in a multi-format batch.
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
                    if (pendingTasks.length >= 2) break;
                }
            }
            if (pendingTasks.length >= 2) break;
        }

        if (pendingTasks.length === 0) {
            delete images._status;
            delete images._imagePrompt;
            delete images._photoCount;
            delete images._lastUpdate;
            await prisma.studioMessage.update({ where: { id: messageId }, data: { images } });
            return { success: true, completed: true, images };
        }

        const hfKey = process.env.HUGGINGFACE_API_KEY || "";
        if (hfKey) {
            // FIRE AND FORGET: Process all in background to avoid Server Action timeout
            (async () => {
                for (const t of pendingTasks) {
                    try {
                        const fresh = await prisma.studioMessage.findUnique({ where: { id: messageId } });
                        const currentImg = (fresh?.images as any) || {};
                        if (!currentImg[`img_${t.idx}_${t.format}`]) {
                            await processSingleHFImage(messageId, t.idx, t.format, prompt, hfKey, currentImg);
                        }
                    } catch (err: any) {
                        await recordLog(`HF Background Error [${messageId}]: ${err.message}`, 'ERROR');
                    }
                }
            })();

            // Mark as processing in DB so UI knows we are working
            images['_status'] = `generating: HF Mode (${pendingTasks.length} pending)`;
            images['_lastUpdate'] = Date.now();
            await prisma.studioMessage.update({ where: { id: messageId }, data: { images } });
        }

        // ALWAYS return instructions for Pollinations as a client-side fallback/immediate result
        const targets = pendingTasks.map(t => {
            let w = 1080, h = 1080;
            if (t.format === 'vertical') { w = 1080; h = 1920; }
            else if (t.format === 'horizontal') { w = 1200; h = 628; }
            const seed = Math.floor(Math.random() * 1000000);
            return {
                idx: t.idx,
                format: t.format,
                url: buildImageUrl(`${prompt}, variation ${t.idx}, seed ${seed}`, w, h, 'pollinations'),
                provider: 'pollinations'
            };
        });

        return { success: true, completed: false, instructions: targets };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * HF Worker
 */
async function processSingleHFImage(messageId: string, idx: number, format: 'square' | 'vertical' | 'horizontal', prompt: string, hfKey: string, images: any) {
    try {
        await recordLog(`Iniciando generación HF: ${idx} / ${format}`, 'INFO');
        let w = 1024, h = 1024;
        if (format === 'vertical') { w = 832; h = 1216; }
        else if (format === 'horizontal') { w = 1216; h = 832; }

        const seed = Math.floor(Math.random() * 1000000);
        const p = prompt + `, high quality, masterpiece, professional car photography, variations, seed ${seed}`;

        const hfRes = await fetch('https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${hfKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ inputs: p, parameters: { width: w, height: h } })
        });

        if (!hfRes.ok) {
            const errBody = await hfRes.text();
            throw new Error(`HF error: ${hfRes.status} - ${errBody.substring(0, 100)}`);
        }

        const buffer = Buffer.from(await hfRes.arrayBuffer());
        if (buffer.length < 5000) throw new Error("Imagen recibida demasiado pequeña (error de modelo)");

        const upload = await robustUploadBufferToCloudinary(buffer);
        if (!upload.success) throw new Error("Upload to Cloudinary failed");

        // Fresh fetch before update to avoid overwriting other parallel updates
        const fresh = await prisma.studioMessage.findUnique({ where: { id: messageId } });
        const upImages = (fresh?.images as any) || {};

        upImages[`img_${idx}_${format}`] = upload.secure_url;
        if (idx === 0) upImages[format] = upload.secure_url; // Backwards compat
        upImages['_lastUpdate'] = Date.now();

        await prisma.studioMessage.update({ where: { id: messageId }, data: { images: upImages } });
        await recordLog(`Éxito HF [${idx}/${format}]: ${upload.secure_url}`, 'INFO');
    } catch (e: any) {
        await recordLog(`Fallo HF [${idx}/${format}]: ${e.message}`, 'ERROR');
        throw e;
    }
}

/**
 * Client Upload Bridge
 */
export async function uploadClientGeneratedImage(messageId: string, idx: number, base64: string, format: string = 'square') {
    try {
        const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const res = await robustUploadBufferToCloudinary(buffer);
        if (res.success && res.secure_url) {
            const msg = await prisma.studioMessage.findUnique({ where: { id: messageId } });
            const images = (msg?.images as any) || {};
            images[`img_${idx}_${format}`] = res.secure_url;
            images['_lastUpdate'] = Date.now();
            await prisma.studioMessage.update({ where: { id: messageId }, data: { images } });
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
    return await chatWithImageDirector([{ role: 'user', content: `Genera una campaña de ${n} estilo ${f}` }], conversationId);
}

export async function restartStudioWorker(messageId: string) {
    const msg = await prisma.studioMessage.findUnique({ where: { id: messageId } });
    if (!msg) return { success: false };
    const images = (msg.images as any) || {};
    images._status = 'generating: restarted';
    images._lastUpdate = Date.now();
    await prisma.studioMessage.update({ where: { id: messageId }, data: { images } });
    return { success: true };
}
