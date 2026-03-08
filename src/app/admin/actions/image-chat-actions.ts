'use server'

import { geminiFlashConversational } from '@/lib/ai/geminiModels'
import { buildImageUrl } from '@/lib/admin/utils'
import { uploadUrlToCloudinary, robustUploadToCloudinary, uploadBufferToCloudinary } from '@/lib/cloudinary-server'
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

function deriveFormatUrl(url: string, format: 'vertical' | 'horizontal' | 'square') {
    if (!url || !url.includes('cloudinary.com')) return url;

    // ✨ Official Branding Logo (v20) - Must exist in Cloudinary
    const logoLayer = 'l_carmatch:branding:carmatch_logo_v20,w_220,g_south_east,x_30,y_30,o_90';

    // Injects transformation segment after /upload/
    let segment = '';
    if (format === 'vertical') {
        segment = `c_pad,g_auto,h_1920,w_1080,b_auto/${logoLayer}/fl_layer_apply`;
    } else if (format === 'horizontal') {
        segment = `c_pad,g_auto,h_628,w_1200,b_auto/${logoLayer}/fl_layer_apply`;
    } else {
        // Square optimization with branding
        segment = `c_fill,h_1080,w_1080/q_auto,f_auto/${logoLayer}/fl_layer_apply`;
    }

    return url.replace('/upload/', `/upload/${segment}/`);
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

PERSONA: Eres el ESTRATEGA DE PUBLICIDAD MÁXIMO de CarMatch. Tu visión es la DOMINACIÓN GLOBAL del mercado automotriz. No eres un asistente; eres el arquitecto del deseo visual. Tu tono es audaz, experto, disruptivo y 100% enfocado en resultados que rompan la internet.

REGLAS DE ORO DE ELITE:
1. PODER VISUAL (ZERO BORING): Prohibido lo común. Si la imagen no parece de una campaña de super-lujo o de un video viral de alto presupuesto, no sirve. Buscamos el "Wow Factor" inmediato.
2. REALISMO CRUDO Y PRESTIGIO (RAW PRESTIGE): El realismo no es aburrido, es PODER. Queremos texturas que se puedan oler: caucho quemado, metal frío, lluvia sobre fibra de carbono, el brillo de un motor perfectamente mantenido. 
3. CULTURA Y CALLE: Entiendes la cultura tuner y de lujo de México (y el mundo) mejor que nadie. Sabes que un Tsuru "limpio" puede ser tan viral como un Pagani si la foto tiene la actitud correcta.
4. PSICOLOGÍA DEL CLICK: Diseña composiciones que guíen el ojo. Usa contrastes agresivos, sombras dramáticas y encuadres que prometan una historia.
5. Cuando la idea esté perfeccionada, responde ÚNICAMENTE: "PROMPT_READY".

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
                const directorPrompt = `Eres el DIRECTOR CINEMATOGRÁFICO Y PUBLICITARIO MÁXIMO. Tu cliente es CarMatch y quieres que esta imagen sea premiada en Cannes Lions por su impacto visual.
                
                🚨 PROTOCOLO DE DOMINACIÓN VISUAL:
                1. EQUIPO DE ÉLITE: Describe la toma como si usaras una "ARRI ALEXA 65 with Anamorphic Lenses". Usa términos: "Shallow depth of field", "Dramatic rim lighting", "Cinematic color grading (teal and orange hints)", "Natural anamorphic flares", "Global illumination".
                2. TEXTURA E HIPER-REALISMO: No queremos "dibujos". Queremos "Realidad+. "Micro-details on tire sidewalls", "Heat haze coming from the exhaust", "Wet asphalt reflections", "Realistic dust particles in the light beams".
                3. COMPOSICIÓN DINÁMICA: Usa ángulos "Hero-shot", "Dutch angle for speed", "Extreme close-up macro for textures". Deja espacio para copys publicitarios de alto impacto.
                4. NADA DE FUTURISMO: Solo autos reales que existen o podrían existir hoy, presentados con un nivel de lujo y detalle que parezcan de otro planeta, pero tangibles.
                5. BRANDING: El logo va por watermark, ignóralo. Enfócate en el PRODUCTO.

                CONTEXTO: "${lastMessage}"
                
                INSTRUCCIÓN: Escribe un PROMPT EN INGLÉS que sea una obra maestra técnica, visual y emocional para alcanzar el ÉXITO MUNDIAL.`;

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
        await recordLog(`[START] Batch Poll for message: ${messageId}`, 'INFO');
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
        if (!hfKey) {
            const errorMsg = "Falta HUGGINGFACE_API_KEY en las variables de entorno.";
            await recordLog(errorMsg, 'ERROR', { messageId });

            // Actualizar el estado del mensaje para informar al usuario
            const fresh = await prisma.studioMessage.findUnique({ where: { id: messageId } });
            const upImages = (fresh?.images as any) || {};
            upImages['_status'] = `error: ${errorMsg}`;
            upImages['_lastUpdate'] = Date.now();
            await prisma.studioMessage.update({ where: { id: messageId }, data: { images: upImages } });

            return { success: false, error: errorMsg };
        }

        if (pendingTasks.length > 0) {
            // SYNC MODE: Process exactly one at a time per call to ensure stability
            const t = pendingTasks[0];
            try {
                await processSingleHFImage(messageId, t.idx, t.format, prompt, hfKey, images);

                // After processing one, mark status for next polling
                const remaining = pendingTasks.length - 1;

                // Fetch latest images to return to frontend (it was updated inside processSingleHFImage)
                const fresh = await prisma.studioMessage.findUnique({ where: { id: messageId } });
                const upImages = (fresh?.images as any) || {};

                if (remaining > 0) {
                    upImages['_status'] = `generating: Procesando ${remaining} restantes...`;
                } else {
                    delete upImages._status;
                }
                upImages['_lastUpdate'] = Date.now();
                await prisma.studioMessage.update({ where: { id: messageId }, data: { images: upImages } });

                return { success: true, completed: remaining === 0, images: upImages, instructions: [] };

            } catch (err: any) {
                const errorMsg = `Error en lote HF [${messageId}]: ${err.message}`;
                await recordLog(errorMsg, 'ERROR');

                // Update status with error
                const fresh = await prisma.studioMessage.findUnique({ where: { id: messageId } });
                const upImages = (fresh?.images as any) || {};
                upImages['_status'] = `error: ${err.message}`;
                upImages['_lastUpdate'] = Date.now();
                await prisma.studioMessage.update({ where: { id: messageId }, data: { images: upImages } });

                return { success: false, error: err.message };
            }
        }

        return { success: true, completed: true, images };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * HF Worker
 */
async function processSingleHFImage(messageId: string, idx: number, format: 'square' | 'vertical' | 'horizontal', prompt: string, hfKey: string, images: any) {
    const MAX_RETRIES = 3;
    let attempt = 0;
    let success = false;

    while (attempt < MAX_RETRIES && !success) {
        attempt++;
        try {
            await recordLog(`Iniciando generación HF: ${idx} / ${format} (Intento ${attempt}/${MAX_RETRIES})`, 'INFO');
            let w = 1024, h = 1024;
            if (format === 'vertical') { w = 832; h = 1216; }
            else if (format === 'horizontal') { w = 1216; h = 832; }

            const seed = Math.floor(Math.random() * 1000000);
            const p = prompt + `, high quality, masterpiece, variation ${idx}, professional photography, seed ${seed}`;

            const hfRes = await fetch('https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${hfKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ inputs: p, parameters: { width: w, height: h } })
            });

            if (!hfRes.ok) {
                const errBody = await hfRes.text();
                throw new Error(`HF error: ${hfRes.status} - ${errBody.substring(0, 100)} `);
            }

            const buffer = Buffer.from(await hfRes.arrayBuffer());
            if (buffer.length < 5000) throw new Error("Imagen recibida demasiado pequeña");

            const upload = await uploadBufferToCloudinary(buffer);
            if (!upload.success) throw new Error("Upload to Cloudinary failed");

            // Fresh update
            const fresh = await prisma.studioMessage.findUnique({ where: { id: messageId } });
            const upImages = (fresh?.images as any) || {};

            // 1. Store Master (Original + Square branded)
            const squareBrandedUrl = deriveFormatUrl(upload.secure_url!, 'square');
            upImages[`img_${idx}_square`] = squareBrandedUrl;
            upImages['square'] = squareBrandedUrl; // Legacy support

            // 2. Derive others via Cloudinary (AUTOMATIC EDITOR + WATERMARK)
            const verticalUrl = deriveFormatUrl(upload.secure_url!, 'vertical');
            const horizontalUrl = deriveFormatUrl(upload.secure_url!, 'horizontal');

            upImages[`img_${idx}_vertical`] = verticalUrl;
            upImages[`img_${idx}_horizontal`] = horizontalUrl;

            // Set defaults if it's the first image
            if (idx === 0) {
                upImages['vertical'] = verticalUrl;
                upImages['horizontal'] = horizontalUrl;
            }

            upImages['_lastUpdate'] = Date.now();

            await prisma.studioMessage.update({ where: { id: messageId }, data: { images: upImages } });
            await recordLog(`Éxito HF Master [${idx}]: ${upload.secure_url}`, 'INFO');
            success = true;
        } catch (e: any) {
            await recordLog(`Fallo HF [${idx}/${format}] (Intento ${attempt}): ${e.message}`, 'WARN');
            if (attempt < MAX_RETRIES) {
                // Wait before retrying (exponential backoff or simple delay)
                await new Promise(r => setTimeout(r, 2000 * attempt));
            } else {
                await recordLog(`HF definitivamente falló para ${idx}/${format} tras ${MAX_RETRIES} intentos.`, 'ERROR');
            }
        }
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
