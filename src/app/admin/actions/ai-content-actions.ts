// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

'use server'

import { geminiFlashConversational, geminiFlash, geminiPro } from '@/lib/ai/geminiModels'
import { prisma } from '@/lib/db'

// Helper to get country specific context
const getCountryContext = (countryCode: string) => {
    const contexts: any = {
        'MX': { name: 'México', slang: 'mexicano (wey, chido, nave, padrísimo)', currency: 'MXN' },
        'US': { name: 'USA', slang: 'American English / Spanglish depending on audience', currency: 'USD' },
        'CO': { name: 'Colombia', slang: 'colombiano (parce, chimba, carro)', currency: 'COP' },
        'ES': { name: 'España', slang: 'español de España (guay, coche, tío)', currency: 'EUR' },
        'AR': { name: 'Argentina', slang: 'argentino (che, auto, re copado)', currency: 'ARS' },
    }
    return contexts[countryCode] || contexts['MX']
}

export async function generateSocialCaption(topic: string, tone: string = 'professional', platform: string = 'general', targetCountry: string = 'MX') {
    try {
        const country = getCountryContext(targetCountry)

        const prompt = `
            Act as a viral social media expert specialized in the AUTOMOTIVE industry in ${country.name}.
            
            Task: Write a ${tone} caption for ${platform} about: "${topic}".
            
            Requirement:
            1. **PEOPLE DON'T READ**: Make it scannable. Max 2 short sentences per block.
            2. **VISUAL**: Use emojis to break text 🚗💨.
            3. **SIMPLE**: 5th-grade reading level. No complex words.
            4. **HOOK**: First line must be a thumb-stopper (e.g., "STOP SCROLLING 🛑").
            5. **Local Flavor**: Use ${country.slang} naturally.
            6. **Length**: KEEP IT SHORT. Under 200 chars if possible.
        `

        const result = await geminiFlashConversational.generateContent(prompt)
        const response = result.response
        return { success: true, content: response.text() }
    } catch (error) {
        console.error('Error generating caption:', error)
        return { success: false, error: 'Error generating caption' }
    }
}

export async function generateImagePrompt(topic: string, style: string = 'realistic', targetCountry: string = 'MX') {
    try {
        const country = getCountryContext(targetCountry)

        const prompt = `
            Create a detailed AI image generation prompt (Midjourney/DALL-E style) for an automotive or car-culture subject.
            Subject: ${topic}
            Style: ${style}
            
            Context:
            - The setting should look like a location in ${country.name} (streets, landscapes, or architecture typical of ${country.name}).
            - Lighting: Cinematic, professional photography.
            - Quality: 8k, photorealistic, highly detailed.
            - **BRANDING**: If the scene includes a smartphone, a store sign, a dealership, or an app interface, it MUST display the "**CarMatch**" brand.
            - **LOGO INTEGRITY**: Strictly forbidden to modify the logo's official colors, shape, or proportions. It must look professional and original.

            IMPORTANT: If the subject is a situation (like a date, a repair, or a person using an app), focus on the HUMAN EMOTION and the SCENE, not just a parked car.
            
            Return ONLY the prompt text in English.
        `

        const result = await geminiFlash.generateContent(prompt)
        const response = result.response

        return { success: true, content: response.text().trim() }
    } catch (error: any) {
        console.error('Error generating image prompt:', error)
        return { success: false, error: 'Error generating prompt: ' + error.message }
    }
}

export async function generateVeoPrompt(topic: string, style: string = 'Cinematic', targetCountry: string = 'MX') {
    try {
        const country = getCountryContext(targetCountry)

        const prompt = `
            Act as an AI VIDEO PROMPT ENGINEER for Google Veo 3 / Vertex AI.
            Create a highly technical video generation prompt for: "${topic}".
            
            Context: "${country.name}" style settings.
            Style: ${style}.
            
            Technical Requirements (Veo 3 Optimized):
            - Format: Cinematic 4K, 24fps.
            - Camera: Drone shot / Tracking shot / Low angle / Macro (choose best for subject).
            - Lighting: Golden hour / Neon / Volumetric lighting / Overcast soft light.
            - Texture: Photorealistic, 8k, highly detailed, slow motion (if action).
            - Motion: High motion blur, wind effects, dust, reflections, dynamic environment.
            - Composition: Rule of thirds, depth of field (bokeh).
            
            Return ONLY the raw prompt text (English). Start with "Cinematic shot of..."
        `

        const result = await geminiFlash.generateContent(prompt)
        const response = result.response
        return { success: true, content: response.text() }
    } catch (error) {
        console.error('Error generating Veo prompt:', error)
        return { success: false, error: 'Error generating prompt' }
    }
}

export async function generateVideoScript(topic: string, duration: string = '15 seconds', targetCountry: string = 'MX', videoStyle: string = 'showcase') {
    try {
        const country = getCountryContext(targetCountry)

        let stylePrompt = ''
        switch (videoStyle) {
            case 'funny':
                stylePrompt = `
                    Style: COMEDY SKETCH.
                    - Characters: 2 (e.g., Buyer vs Seller, or Driver vs Mechanic).
                    - Tone: Hilarious, relatable, sarcastic.
                    - Structure: Setup -> Conflict -> Funny Punchline -> Resolution.
                `
                break
            case 'emotional':
                stylePrompt = `
                    Style: EMOTIONAL / INSPIRING.
                    - Tone: Nostalgic, cinematic, motivational.
                    - Focus: The feeling of freedom, first car memory, or achieving a dream.
                    - Audio: Suggest slow, building cinematic music.
                `
                break
            case 'educational':
                stylePrompt = `
                    Style: EDUCATIONAL / TIPS.
                    - Tone: Expert, helpful, trustworthy.
                    - Format: "Did you know?" or "3 Tips to..."
                    - Focus: Maintenance, buying tips, safety.
                `
                break
            case 'versus':
                stylePrompt = `
                    Style: VERSUS BATTLE.
                    - Tone: High energy, competitive.
                    - Format: Compare two similar prestige cars (e.g. Mustang vs Camaro).
                    - Ending: Ask audience to vote in comments.
                `
                break
            case 'myths':
                stylePrompt = `
                    Style: MYTH BUSTERS.
                    - Tone: Investigative, surprising.
                    - Format: State a common car myth -> Debunk it with facts.
                `
                break
            case 'trivia':
                stylePrompt = `
                    Style: TRIVIA / QUIZ.
                    - Tone: Interactive, fun.
                    - Format: Ask a question -> Countdown -> Reveal answer.
                `
                break
            case 'future':
                stylePrompt = `
                    Style: FUTURISTIC / CONCEPT.
                    - Tone: Sci-fi, visionary.
                    - Focus: Imagine this car in the year 2050.
                `
                break
            case 'safety':
                stylePrompt = `
                    Style: REAL LIFE SAFETY (SOS).
                    - Scenario: Someone stranded (flat tire, battery dead).
                    - Solution: Use Map Store to find nearest help.
                    - Tone: Empathetic, problem-solving, relief.
                `
                break
            case 'security':
                stylePrompt = `
                    Style: ANTI-SCAM / SECURITY.
                    - Scenario: Buying or selling a used car.
                    - Focus: Checking papers, meeting in safe zones, avoiding fraud.
                    - Tone: Serious, watchful, authoritative "Big Brother" advice.
                `
                break
            case 'success':
                stylePrompt = `
                    Style: SUCCESS STORY / TESTIMONIAL.
                    - Scenario: User successfully sold their car and got paid safely.
                    - Focus: Trust, speed, ease of use of CarMatch.
                    - Tone: Happy, relieved, enthusiastic.
                `
                break
            case 'dreams':
                stylePrompt = `
                    Style: ASPIRATIONAL / DREAMS.
                    - Scenario: A child looking at a supercar, or someone buying their first car.
                    - Focus: The emotional connection, the "I made it" moment.
                    - Tone: Inspiring, heatwarming, cinematic.
                `
                break
            default: // showcase
                stylePrompt = `
                    Style: CINEMATIC SHOWCASE.
                    - Tone: High energy, fast cuts, beat-sync.
                    - Focus: Visual beauty of the car (angles, interior, details).
                `
        }

        const prompt = `
            Act as a VIRAL CONTENT DIRECTOR aiming for 2.8 BILLION views.
            Write a ${duration} video script for: "${topic}".
            
            SETTINGS:
            - Language: Spanish/English suited for ${country.name} (${country.slang}).
            - Vibe: High retention, fast-paced, "Hook -> Value -> CTA".
            
            ${stylePrompt}
            
            CRITICAL RULES:
            1. **VISUALS > AUDIO**: People watch without sound. Describe the VISUAL HOOK clearly.
            2. **HOOK IS EVERYTHING**: The first 3 seconds must stop the scroll.
            2. **GLOBAL APPEAL**: While using local slang, keep the visual storytelling universal.
            3. **FACTUAL ACCURACY**: Be precise about car culture.
            4. **READY TO PUBLISH**: Write the final script.
            
            Format:
            - Hook (0-3s): [Visual/Audio] + Text Overlay.
            - Body: Scene by scene.
            - Call to Action (MANDATORY): "Find your dream car on CarMatch" or "Sell it fast on CarMatch".
        `

        const result = await geminiPro.generateContent(prompt)
        const response = result.response
        return { success: true, content: response.text() }
    } catch (error) {
        console.error('Error generating script:', error)
        return { success: false, error: 'Error generating script' }
    }
}

// --- Infinite Variety Arrays ---
const PERSONAS = [
    'First Time Buyer (Student)', 'Growing Family (Safety focus)', 'Uber/Didi Driver (Economy focus)',
    'Off-Road Enthusiast', 'Luxury/Status Seeker', 'Car Collector / Geek',
    'Busy Mom/Dad', 'Young Professional', 'Mechanic / Expert', 'Bargin Hunter'
]

const SCENARIOS = [
    'Stuck in traffic', 'First date', 'Road trip to the beach', 'School run/pickup',
    'Rainy night breakdown (solution)', 'Winning a drag race (legal)', 'Impressing the boss',
    'Grocery shopping', 'Camping trip', 'Commuting to work', 'Late night drive', 'Sunday wash day',
    'Trying to sell a car to a stranger', 'Looking for a specific part', 'Scammed by a dealer'
]

const BRAND_HOOKS = [
    { hook: 'Sell Securely', angle: 'No strangers at your house. Verified buyers.' },
    { hook: 'Find Your Dream Car', angle: 'The Tinder for Cars. Swipe to find.' },
    { hook: 'Map Store Utility', angle: 'Find mechanics and help near you instantly.' },
    { hook: 'Price Check', angle: 'Are you overpaying? Check the real market value.' },
    { hook: 'Scam Protection', angle: 'Don\'t buy a lemon. Verify everything.' },
    { hook: 'Community', angle: 'Join the biggest car enthusiast network.' },
    { hook: 'Speed', angle: 'Sell your car in less than 24 hours.' }
]

export async function suggestCampaignFromInventory(targetCountry: string = 'MX') {
    try {
        const country = getCountryContext(targetCountry)

        // STRATEGY: 100% Brand / Platform Promotion (No specific inventory)
        // We combine: Brand Hook x Persona x Scenario x Video Style

        // 1. Select Random Combinatorial Variables
        const validStyles = [
            'showcase', 'funny', 'emotional', 'educational',
            'versus', 'myths', 'trivia', 'safety', 'security', 'success', 'dreams'
        ]
        const randomStyle = validStyles[Math.floor(Math.random() * validStyles.length)]
        const randomPersona = PERSONAS[Math.floor(Math.random() * PERSONAS.length)]
        const randomScenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]
        const randomBrandHook = BRAND_HOOKS[Math.floor(Math.random() * BRAND_HOOKS.length)]

        // 2. Ask Gemini to create a full BRAND campaign
        // 2. Ask Gemini to create a full BRAND campaign
        const prompt = `
            Act as a WORLD-CLASS SOCIAL MEDIA STRATEGIST for CarMatch (The "Tinder for Cars").
            Your goal is to reach a potential audience of 2.8 BILLION users globally.
            You are not just writing a post; you are launching a VIRAL MOVEMENT.

            Target Audience: ${randomPersona} in ${country.name}. Use local slang: ${country.slang}.
            
            UNIVERSE SETTINGS (Make it unique):
            - Core Message: ${randomBrandHook.hook} (${randomBrandHook.angle})
            - Micro-Scenario: ${randomScenario}
            - Video Style: ${randomStyle.toUpperCase()}
            
            CRITICAL LANGUAGE REQUIREMENT:
            - ALL content MUST be in SPANISH (español de México)
            - Use Mexican slang: ${country.slang}
            - NO English words except brand names (CarMatch, TikTok, etc.)
            
            IMPORTANT:
            - DO NOT promote a specific single car. Promote the APP/PLATFORM.
            - If the style is "Showcase", showcase the APP INTERFACE or a montage of cool cars available.
            - ATTITUDE: Aggressive growth, high energy, "FOMO".
            - **RULE**: "People don't read". Keep text minimal, visual, and punchy.
            
            CRITICAL: Return ONLY a valid JSON object. No markdown code blocks, no explanations.
            
            Return a JSON object with:
            {
                "internal_title": "Nombre de la campaña en ESPAÑOL",
                "caption": "Una caption visual con emojis en ESPAÑOL. MAX 3 líneas. DEBE incluir CTA: 'Descarga CarMatch'.",
                "imagePrompt": "An AI image prompt representing the scenario (Photorealistic, 8k, specify car brand and color if mentioned) - THIS MUST BE IN ENGLISH",
                "videoScript": "Un guión de video de 15 segundos en ESPAÑOL. Debe ser UN TEXTO CONTINUO, NO un array.",
                "videoPrompt_vertical": "Technical prompt in ENGLISH for vertical video (9:16). Describe the FIRST 3 SECONDS clearly (The Hook). Focus on motion and high-energy cinematography.",
                "videoPrompt_horizontal": "Technical prompt in ENGLISH for horizontal video (16:9). More cinematic landscape or slow motion storytelling.",
                "strategy": "Explicación en ESPAÑOL de por qué este ángulo será viral y ayudará a alcanzar la meta de 2.8B usuarios.",
                "platforms": {
                    "meta_ads": { "primary_text": "Copy en ESPAÑOL", "headline": "Título en ESPAÑOL", "description": "Desc en ESPAÑOL", "caption": "Caption IG en ESPAÑOL" },
                    "facebook_marketplace": { "title": "Título en ESPAÑOL", "description": "Detalles del auto en ESPAÑOL (precio ficticio coherente, km, estado)" },
                    "google_ads": {
                        "headlines": ["Título Gancho 1", "Título Gancho 2", "Título Gancho 3"],
                        "descriptions": ["Descripción de Ventaja 1", "Descripción de Ventaja 2"]
                    },
                    "tiktok_ads": { "caption": "Hook de impacto con hashtags", "script_notes": "Instrucciones de edición rápida" },
                    "youtube_shorts": { "title": "Título Viral", "description": "Descripción optimizada para SEO" },
                    "twitter_x": { "tweets": ["Tweet 1 con gancho", "Tweet 2 con CTA"] },
                    "threads": { "caption": "Hebra narrativa en ESPAÑOL" },
                    "snapchat_ads": { "headline": "Título Corto", "caption": "Llamada a la acción rápida" }
                }
            }
            
            IMPORTANT FOR videoScript:
            - Must be a SINGLE STRING, not an array
            - Write it as continuous text with scene descriptions
            - In SPANISH only
            - Example format: "Escena 1: Un joven atrapado en el tráfico... Escena 2: Abre CarMatch..."
        `

        // TIMEOUT & FALLBACK Protection
        let text = "";
        const FALLBACK_STRATEGY_JSON = JSON.stringify({
            "internal_title": "Campaña de Rescate CarMatch",
            "caption": "🔥 ¿Aun no tienes el auto de tus sueños? 🚗💨 Encuéntralo en CarMatch. La App #1 de compra-venta segura. 👇 ¡Descarga YA!",
            "imagePrompt": "Futuristic smartphone showing CarMatch app with a luxury car coming out of the screen, neon lights, cyber city background, 8k",
            "videoScript": "Escena 1: Primer plano de un celular con CarMatch. Escena 2: Dedo hace Swipe Right. Escena 3: El auto aparece mágicamente en la calle. Escena 4: Conductor feliz sube al auto. Texto: Tu Auto Ideal te Espera.",
            "videoPrompt": "Cinematic transition from smartphone screen to real life luxury car, magical effects, high energy, 8k",
            "strategy": "Estrategia de Alta Velocidad: Enfocada en la gratificación instantánea y la facilidad de uso de la app (Efecto Tinder).",
            "platforms": {
                "meta_ads": { "primary_text": "Encuentra tu nave en segundos.", "headline": "Swipe to Drive", "description": "Seguro y veloz" },
                "facebook_marketplace": { "title": "Auto Ideal CarMatch", "description": "Compra venta segura" },
                "google_ads": { "headlines": ["Auto Ideal", "CarMatch México", "Compra Segura"], "descriptions": ["La app #1 de autos", "Encuentra tu nave hoy"] },
                "tiktok_ads": { "caption": "Tu próxima nave está a un swipe #CarMatch", "script_notes": "Cinemática de swipe" }
            }
        });

        try {
            const result = await Promise.race([
                geminiFlashConversational.generateContent(prompt),
                new Promise<any>((_, reject) => setTimeout(() => reject(new Error("GEMINI_TIMEOUT")), 4000))
            ]);
            text = result.response.text();
            console.log('[AUTO-PILOT] Gemini generated strategy successfully.');
        } catch (err) {
            console.warn('[AUTO-PILOT] Gemini Timeout/Error. Using Fallback Strategy.');
            text = FALLBACK_STRATEGY_JSON;
        }

        // Clean up markdown code blocks if present
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim()

        try {
            const campaignData = JSON.parse(jsonString)

            // Ensure videoScript is a string
            if (Array.isArray(campaignData.videoScript)) {
                campaignData.videoScript = campaignData.videoScript.join(' ')
            } else if (typeof campaignData.videoScript === 'object') {
                campaignData.videoScript = JSON.stringify(campaignData.videoScript)
            }

            // 3. Initiate ASYNC Tasks
            console.log('[AUTO-PILOT] Iniciando tareas IA asíncronas...')
            const { createImagePrediction, createVideoPrediction } = await import('@/lib/ai/replicate-client')

            const basePrompt = campaignData.imagePrompt || 'Luxury car in Mexico City, cinematic'

            const [videoPendingId, imgSquareId, imgVerticalId, imgHorizontalId] = await Promise.all([
                createVideoPrediction(campaignData.videoPrompt || 'Car cinematic', '9:16').catch(e => { console.error('[AUTO-PILOT] Video Err:', e); return null; }),
                createImagePrediction(basePrompt, 1080, 1080).catch(e => { console.error('[AUTO-PILOT] ImgSq Err:', e); return null; }),
                createImagePrediction(basePrompt, 1080, 1920).catch(e => { console.error('[AUTO-PILOT] ImgVert Err:', e); return null; }),
                createImagePrediction(basePrompt, 1920, 1080).catch(e => { console.error('[AUTO-PILOT] ImgHoriz Err:', e); return null; })
            ])

            campaignData.videoPendingId = videoPendingId
            campaignData.imagePendingIds = {
                square: imgSquareId,
                vertical: imgVerticalId,
                horizontal: imgHorizontalId
            }

            // Mock vehicle object for UI compatibility
            const vehicleMock = { title: `Campaña: ${randomBrandHook.hook}`, price: 0, currency: 'USD', description: campaignData.strategy }

            return { success: true, vehicle: vehicleMock, campaignData }
        } catch (e) {
            console.error('Error parsing campaign JSON or starting AI:', e)
            return { success: false, error: 'Error al generar la estrategia o iniciar IA.' }
        }

    } catch (error) {
        console.error('Error in auto-pilot:', error)
        return { success: false, error: 'Error interno en piloto automático.' }
    }
}

// --- NEW SPLIT STRATEGIES FOR VIRAL CONTENT ---

export async function generateImageStrategy(chatHistory: any[], targetCountry: string = 'MX') {
    try {
        const country = getCountryContext(targetCountry)

        // Format history
        const contextStr = chatHistory.map(m => `${m.role === 'user' ? 'USUARIO' : 'IA'}: ${m.content}`).join('\n');

        const prompt = `
            Eres el DIRECTOR DE VIRALIDAD de CarMatch.
            Objetivo: 2.8 BILLONES DE USUARIOS.
            
            El usuario quiere una IMAGEN para ROMPER INTERNET.
            NO hagas un anuncio aburrido. Crea CONTENIDO NATIVO (Meme, Shitpost de calidad, Arte Épico, Trivia).

            PRINCIPIOS DE VIRALIDAD (APLICALOS):
            1. **Relatabilidad**: "Soy yo literal".
            2. **Debate**: "¿A o B?", "¿Es real?".
            3. **Sorpresa**: Algo visualmente impactante fuera de contexto.

            HISTORIAL DE CHAT:
            ${contextStr}
            
            INSTRUCCIONES CLAVE:
            - **OMNIPUBLICACIÓN (Carruseles)**: Aunque sean imágenes, plataformas como TikTok y Snapchat las aman como "Photo Swipes" (carruseles con música). Crea los copies pensando en este formato dinámico.
            - **CALIDAD VISUAL**: No seas genérico. Ruben odia lo común. Si pide un coche, describe el modelo exacto, el estado de la pintura, el entorno (calle de México con baches, taller rústico, agencia de lujo).
            - DIVERSIDAD EN LISTAS: Si el usuario pide múltiples fotos, una trivia o una lista, **ES OBLIGATORIO** que el array imagePrompts contenga prompts **DISTINTOS** para cada imagen. No repitas el mismo prompt. Cada imagen debe ser una escena diferente relacionada al tema.
            - **TRIVIA**: Si es trivia, cada prompt debe ser un reto visual (un detalle de motor, un interior raro, una silueta) correspondiente a una de las preguntas.
            - **LOGOS**: Menciona que si hay pantallas o letreros, deben decir "CarMatch".
            
            Output JSON EXACTO (sin campos adicionales, sin comentarios):
            {
                "internal_title": "Título breve de la campaña",
                "imagePrompt": "PROMPT PRINCIPAL EN INGLÉS MUY DETALLADO (Flux style).",
                "imagePrompts": ["ARRAY DE PROMPTS INDIVIDUALES EN INGLÉS. Obligatorio si el usuario pide más de una imagen o es una trivia. Crea escenas VARIADAS y DETALLADAS. (Hasta 10)."],
                "isTrivia": true/false (si detectas que es una trivia de preguntas y respuestas),
                "visualSummary": "Resumen en ESPAÑOL de lo que se generará (lista de escenas/fotos) para que el usuario confirme.",
                "caption": "Caption principal en ESPAÑOL (${country.slang}). Corto, gancho, emojis y hashtags #CarMatch.",
                "platforms": {
                    "facebook": {
                        "titulo": "Título llamativo para Facebook (max 80 chars)",
                        "descripcion": "Texto completo para Facebook. Puede ser más largo. Con emojis y CTA claro. Max 3 párrafos cortos."
                    },
                    "instagram": {
                        "caption": "Caption para Instagram. Emojis, line breaks, hasta 5 hashtags al final. Max 220 chars antes de 'ver más'."
                    },
                    "tiktok": {
                        "caption": "Caption corto y viral para TikTok (Formato Carrusel/Fotos). Max 150 chars. Hashtags trending. Lenguaje Gen-Z (${country.slang}). Sugerencia de audio viral.",
                        "swipe_style": "Describe cómo deben deslizarse las fotos (ej: 'Sync with beat', 'Slow transition')"
                    },
                    "snapchat": {
                        "caption": "Caption para Spotlight/Snap (Fotos). ULTRA casual. Max 100 chars.",
                        "audio_suggestion": "Tipo de música ideal"
                    },
                    "twitter_x": {
                        "tweet": "Tweet corto e impactante. Max 260 chars. Sin hashtags genéricos, máximo 2. Provoca reacción o retweet."
                    },
                    "youtube": {
                        "titulo": "Título SEO para YouTube Shorts (max 100 chars). Incluye keyword automotriz.",
                        "descripcion": "Descripción corta para YouTube. 2-3 líneas. Incluye #CarMatch #Autos y link ficticio (carmatch.app)."
                    },
                    "whatsapp": {
                        "mensaje": "Mensaje de difusión para WhatsApp/Status. Informal, amigable, con emoji al inicio. Max 3 líneas. Incluye link carmatch.app."
                    },
                    "linkedin": {
                        "post": "Post profesional para LinkedIn. Tono industria automotriz/tech. 2-3 párrafos. Reflexión + CTA. Máximo 600 chars."
                    },
                    "pinterest": {
                        "description": "Descripción para PIN de Pinterest. Inspiracional, visual. Max 200 chars. Incluye keywords automotrices y #CarMatch. Termina con link carmatch.app."
                    },
                    "google_ads": {
                        "headline": "Headline Google Display (max 30 chars). Claro y directo.",
                        "description": "Descripción Google Ads (max 90 chars). Beneficio principal + CTA."
                    },
                    "threads": {
                        "post": "Post para Threads/Meta. Hasta 500 chars. Conversacional."
                    },
                    "telegram": {
                        "mensaje": "Mensaje para Canal de Telegram. Usa negritas, emojis y un tono de 'oportunidad única'. Incluye link carmatch.app."
                    },
                    "reddit": {
                        "post": "Post para r/Autos o similar. Tono menos comercial, más de ayuda o geek. Sin sonar a anuncio."
                    },
                    "email": {
                        "asunto": "Asunto impactante para Newsletter",
                        "cuerpo": "Cuerpo corto (2 párrafos) con beneficios y CTA claro."
                    },
                    "push_sms": {
                        "texto": "Texto ultra-corto (max 120 chars) para Notificación Push o SMS."
                    }
                }
            }
        `;

        const result = await geminiFlashConversational.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
        });

        return { success: true, strategy: JSON.parse(result.response.text()) };

    } catch (error) {
        console.error('Error creating image strategy:', error);
        return { success: false, error: 'Error al diseñar la imagen.' };
    }
}

/**
 * Genera una propuesta de campaña (sin lanzar generación de Replicate)
 * para que el usuario la valide en el chat.
 */
export async function getCampaignStrategyPreview(history: any[], mode: 'IMAGE' | 'VIDEO' = 'IMAGE', targetCountry: string = 'MX') {
    try {
        if (mode === 'IMAGE') {
            return await generateImageStrategy(history, targetCountry);
        } else {
            return await generateVideoStrategy(history, targetCountry);
        }
    } catch (error) {
        console.error('Error getting strategy preview:', error);
        return { success: false, error: 'Error al generar la propuesta.' };
    }
}

export async function generateVideoStrategy(chatHistory: any[], targetCountry: string = 'MX') {
    try {
        const country = getCountryContext(targetCountry)
        const contextStr = chatHistory.map(m => `${m.role === 'user' ? 'USUARIO' : 'IA'}: ${m.content}`).join('\n');

        const prompt = `
            Eres el ARQUITECTO DE VIRALIDAD Nº1 DEL MUNDO para video en redes sociales.
            Has estudiado CADA video que pasó de 0 a 10 millones de vistas.
            Conoces los algoritmos de TikTok, Instagram, YouTube y Snapchat mejor que sus propios ingenieros.
            
            TU MISIÓN: Hacer a CarMatch VIRAL y MONETIZABLE en TODAS las plataformas de video.
            IMPORTANTE: Todo branding visual, letreros, apps o concesionarios sugeridos DEBEN usar el nombre o logo de "**CarMatch**".
            ⚠️ **OBLIGATORIO**: PROHIBIDO alterar colores, forma o proporciones del logo oficial. Debe respetarse la identidad visual original sin distorsiones.

            ══════════════════════════════════════════════════════
            ⚡ REGLA DE ORO — LOS PRIMEROS 3 SEGUNDOS SON TODO
            ══════════════════════════════════════════════════════
            El scroll se detiene en 0.3 segundos si algo llama la atención.
            El HOOK de los primeros 3 segundos determina si el video vive o muere.
            
            PATTERN INTERRUPTS — usa UNO de estos cinco tipos de hook comprobados:
            - SHOCK HOOK: Algo que nadie espera ver         → "Este carro se vendió en 3 minutos..."
            - CURIOSITY GAP: Pregunta sin respuesta al inicio → "El error que comete el 90% al comprar un carro..."
            - IDENTIDAD: Ataca el ego del viewer            → "Si manejas esto, definitivamente eres..."
            - CONTROVERSIA LEVE: Opinión polarizante        → "Los autos usados son MEJOR que los nuevos, y aquí está la prueba"
            - NÚMERO ESPECÍFICO: Específico = credibilidad  → "47 autos en esta app, 3 cuestan menos de $50,000"

            ══════════════════════════════════════════════════════
            📱 DURACIONES REALES POR PLATAFORMA (MÍNIMO 15 SEGUNDOS)
            ══════════════════════════════════════════════════════
            REGLA GLOBAL: Ningún video debe durar menos de 15 segundos.
            Videos cortos (<15s) no son monetizables y el algoritmo los penaliza.

            🎵 TIKTOK
              Formato: Vertical 9:16
              Duración óptima: 30s–60s (monetizable si la cuenta tiene +1000 subs y 10k views)
              Extra: hasta 3min si tienes una historia que mantiene el watch time

            📸 INSTAGRAM REELS
              Formato: Vertical 9:16
              Duración óptima: 30s–90s (el algoritmo premia 30-60s para alcance masivo)
              Extra: 60s+ mejora el watch time y la retención

            ▶️ YOUTUBE SHORTS
              Formato: Vertical 9:16
              Duración óptima: 30s–60s (monetizable con YouTube Partner Program)
              Extra: el título tiene más peso que TikTok para el descubrimiento

            📘 FACEBOOK REELS
              Formato: Vertical 9:16
              Duración óptima: 30s–90s (audiencia LATAM 25-45, alcance orgánico altísimo)
              Extra: Facebook In-Stream Ads activan desde 60s

            👻 SNAPCHAT SPOTLIGHT
              Formato: Vertical 9:16
              Duración óptima: 15s–60s (audiencia 13-25, muy rápida, máx impacto en 15-30s)

            🎬 YOUTUBE LARGO
              Formato: Horizontal 16:9
              Duración óptima: 3min–10min (monetizable con AdSense desde 8 minutos para mid-rolls)
              Extra: Reviews, comparativas de vehículos, tours de CarMatch

            ══════════════════════════════════════════════════════
            🔄 SISTEMA DE RETENCIÓN (secreto del algoritmo)
            ══════════════════════════════════════════════════════
            - Corte visual o cambio cada 3-5 segundos
            - Texto en pantalla siempre visible (no todos escuchan)
            - El final conecta con el inicio (loop visual) = +watchtime
            - Termina con pregunta o CTA que genere comentarios

            ══════════════════════════════════════════════════════
            💬 CONTEXTO DEL USUARIO
            ══════════════════════════════════════════════════════
            ${contextStr}
            
            ══════════════════════════════════════════════════════
            📋 OUTPUT JSON EXACTO — SIN COMENTARIOS
            ══════════════════════════════════════════════════════
            {
                "internal_title": "Título interno de la campaña (para referencia de Ruben)",
                "viral_angle": "En 1 línea: ángulo viral elegido y POR QUÉ funciona en el algoritmo",
                "hook_3s": "TEXTO EXACTO de los primeros 1-2 segundos en pantalla/voz. Pattern interrupt aplicado. Corto, impactante.",
                "hook_3s_visual": "Descripción de lo que se VE en esos primeros 3 segundos (ángulo de cámara, acción, elemento visual de impacto)",
                "videoScript": "Guión COMPLETO en ESPAÑOL con timing. Duración objetivo: 30-60 segundos, MÁXIMO 90 segundos. Estructura:\\n[00:00-00:03] HOOK\\n[00:03-00:10] DESARROLLO...\\nTexto en pantalla en MAYÚSCULAS entre [CORCHETES]. 🎵 Sugerencia de audio al final.",
                "monetization_cta": "Texto exacto del CTA al final que lleva a carmatch.app SIN sonar a anuncio. Natural y convincente.",
                "videoPrompt_vertical": "Prompt TÉCNICO en INGLÉS para IA de video (Minimax/Veo), formato VERTICAL 9:16, duración 45-60s. Incluye: hook visual inicial, 3-4 escenas con transiciones, iluminación, movimiento de cámara, energía alta. NO estático.",
                "videoPrompt_horizontal": "Mismo concepto en HORIZONTAL 16:9, duración 3-5 minutos. Perspectiva cinematográfica, más escenas, ritmo narrativo.",
                "recommended_format": "vertical",
                "master_style": "Descriptor de estilo en INGLÉS compartido por TODAS las escenas (paleta de colores, iluminación, mood, tipo de cámara). Ej: 'Cinematic dark background, neon purple accents, smooth camera motion, high energy car commercial style'",
                "target_duration_seconds": 60,
                "scenes": [
                    {
                        "id": 1,
                        "duration_seconds": 8,
                        "visual_prompt": "PROMPT EN INGLÉS para este clip específico (6-10s). Comienza con: [MASTER_STYLE]. Describe la acción visual específica de esta escena.",
                        "screen_text": "TEXTO EN PANTALLA para esta escena. Mayúsculas, impactante.",
                        "voiceover": "Lo que se dice en voz en esta escena"
                    }
                ],
                "platforms": {
                    "tiktok": {
                        "format": "Vertical 9:16",
                        "duration": "30s–60s (mín. 15s · monetizable)",
                        "caption": "Caption TikTok LISTO PARA PEGAR. Español ${country.slang}. Empieza con emoji. MAX 150 chars. 3-5 hashtags: #CarMatch #Autos #FYP + trending. Termina con pregunta que dispare replies.",
                        "audio_suggestion": "Estilo de audio/sonido ideal para este video en TikTok (describe el mood musical, ej: 'trap suave con build-up en segundo 3' o 'sonido viral de notificación al inicio')"
                    },
                    "instagram_reels": {
                        "format": "Vertical 9:16",
                        "duration": "30s–90s (mín. 15s · óptimo 60s para alcance)",
                        "caption": "Caption Instagram LISTO PARA PEGAR. Aspiracional. Gancho primera línea. Emojis naturales. Hashtags al final: #CarMatch #Reels #Autos #MercadoDeAutos + locales. Max 220 chars antes de 'ver más'."
                    },
                    "youtube_shorts": {
                        "format": "Vertical 9:16",
                        "duration": "30s–60s (mín. 15s · monetizable con YPP)",
                        "titulo": "Título YouTube Shorts LISTO PARA PEGAR. Max 100 chars. Keyword automotriz + emoción/número. Ej: 'Encontré el Civic 2024 más barato de México (vendido en 2 días)'",
                        "descripcion": "Descripción YouTube Shorts LISTA PARA PEGAR. 3 líneas. Palabras clave, #Shorts #CarMatch #Autos + link carmatch.app"
                    },
                    "facebook_reels": {
                        "format": "Vertical 9:16",
                        "duration": "30s–90s (mín. 15s · 60s+ activa In-Stream Ads)",
                        "caption": "Caption Facebook Reels LISTO PARA PEGAR. Descriptivo, audiencia 25-45 LATAM. Emojis. Explica el video brevemente. CTA claro (comenta, comparte). Termina con #CarMatch"
                    },
                    "snapchat": {
                        "format": "Vertical 9:16",
                        "duration": "15s–60s (óptimo 15-30s para audiencia joven)",
                        "caption": "Caption Snapchat Spotlight LISTO PARA PEGAR. ULTRA casual, audiencia 13-25. Máx 100 chars. Slang ${country.slang}. 1-2 hashtags máx."
                    },
                    "kwai": {
                        "format": "Vertical 9:16",
                        "duration": "15s–90s (viral en LATAM, audiencia MX/BR/CO)",
                        "caption": "Caption Kwai LISTO PARA PEGAR. Viral, dinámico, lenguaje coloquial LATAM. Max 150 chars. 3-5 hashtags: #CarMatch #Autos + trending Kwai. Termina con pregunta o reacción."
                    },
                    "twitter_x": {
                        "format": "Horizontal o Vertical",
                        "duration": "15s–140s (max 2:20 en X)",
                        "caption": "Tweet con video LISTO PARA PEGAR. Max 260 chars. Impactante, provoca retweet o reply. Máx 2 hashtags. Termina con pregunta o dato sorpresa."
                    },
                    "telegram": {
                        "mensaje": "Video post para Telegram. Negritas y tono de noticia/alerta viral. Link carmatch.app."
                    },
                    "reddit": {
                        "post": "Post para Reddit con video. Tono de discusión o curiosidad. 'Miren este hallazgo en CarMatch...'"
                    },
                    "email": {
                        "asunto": "Mira el video de la semana en CarMatch 🎬",
                        "cuerpo": "Introducción al video y link para verlo. Enfoque en el valor del video."
                    }
                }
            }
        `;

        const result = await geminiFlashConversational.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 1.0 }
        });

        return { success: true, strategy: JSON.parse(result.response.text()) };

    } catch (error) {
        console.error('Error creating video strategy:', error);
        return { success: false, error: 'Error al diseñar el video.' };
    }
}


// --- AI Chat for Publicity Agent ---
export async function chatWithPublicityAgent(messages: any[], targetCountry: string = 'MX') {
    try {
        const country = getCountryContext(targetCountry)

        const systemPrompt = `
            Eres "CarMatch Mastermind", una IA de Marketing Viral de Nivel DIOS.
            No eres un asistente básico.Eres el cerebro detrás de la expansión global de CarMatch hacia 2.8 BILLONES de usuarios.

            TU MISIÓN: DOMINACIÓN GLOBAL MEDIANTE CONTENIDO.
            
            Tus Herramientas Psicológicas(ÚSALAS):
1. ** Curiosidad(The Gap) **: "No creerás lo que encontramos en este Tsuru..."
2. ** Pertenencia(Tribalism) **: "Solo los verdaderos mecánicos entienden esto..."
3. ** Escasez / Miedo(FOMO) **: "El error que te está costando miles de pesos..."
4. ** Controversia(Leve) **: "Por qué los autos eléctricos son una estafa (o no)..."
5. ** Humor(Relatability) **: Memes de situaciones cotidianas del tráfico / taller.

            TONO Y ESTILO:
            - ** Idioma **: Español(México) con slang natural pero INTELIGENTE(${country.slang}).
            - ** Actitud **: Visionaria, agresiva(tipo Wolf of Wall Street pero ético), divertida, y data - driven.
            - ** Formato **: Usa emojis, listas cortas, y ve GRANO.
            
            TUS PODERES CREATIVOS ACTUALIZADOS:
            - ** Meme Architect **: Diseña memes visuales(Expectativa vs Realidad).
            - ** Trivia Master **: Crea trivias difíciles para generar comentarios.
            - ** Trend Surfer **: Conecta autos con tendencias pop(música, películas, noticias).
            - ** Storyteller **: Guiones de video que enganchen en los primeros 0.5 segundos.

            Contexto de CarMatch para vender:
- "El Tinder de los Autos"(Desliza y compra).
            - "Map Store"(Encuentra ayuda real en tiempo real).
            - Seguridad Total(Adiós estafas).

            SI EL USUARIO PIDE IDEAS, DALE ORO PURO.NO DEDES RESPUESTAS GENÉRICAS.
            PIENSA EN GRANDE.PIENSA EN VIRALIDAD.
        `

        // Convert messages to Gemini format
        const historyParts = [
            {
                role: "user",
                parts: [{ text: systemPrompt }],
            },
            {
                role: "model",
                parts: [{ text: `Entendido.Soy el Director de Marketing de CarMatch para ${country.name}. ¿En qué puedo ayudarte hoy ? 🚀` }],
            },
            ...messages.slice(0, -1).map((m: any) => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }],
            }))
        ]

        const chat = geminiFlashConversational.startChat({
            history: historyParts,
            generationConfig: {
                maxOutputTokens: 500, // Reduced for speed
            },
        });

        const lastMessage = messages[messages.length - 1].content

        // TIMEOUT PROTECTION (9s max to stay within Vercel 10s limit)
        try {
            const result = await Promise.race([
                chat.sendMessage(lastMessage),
                new Promise<any>((_, reject) => setTimeout(() => reject(new Error("CHAT_TIMEOUT")), 9000))
            ]);

            const response = result.response.text()
            return { success: true, message: response }

        } catch (timeoutErr) {
            console.warn('[AI-CHAT] Chat Timeout. Returning fallback.');
            return {
                success: true,
                message: "¡Qué interesante! 🚀 Estoy analizando esa idea a fondo para darte la mejor estrategia. Mientras tanto, ¿te gustaría que generemos una campaña rápida con lo que tenemos? O cuéntame más detalles."
            }
        }
    } catch (error) {
        console.error('Error in chatWithPublicityAgent:', error)
        return { success: false, error: 'Error connecting to AI Agent.' }
    }
}

import { generatePollinationsImage } from '@/lib/ai/asset-generator'

// --- FULL CAMPAIGN ASSET GENERATION ---
// --- STAGE 1: STRATEGY GENERATION (Gemini) ---
export async function generateCampaignStrategy(chatHistory: any[], targetCountry: string = 'MX') {
    try {
        const country = getCountryContext(targetCountry)

        // Format history for Gemini context
        const contextStr = chatHistory.map(m => `${m.role === 'user' ? 'USUARIO' : 'IA'}: ${m.content} `).join('\n');

        const prompt = `
            Eres un Especialista en Marketing de Alto Rendimiento, un Sintetizador de Ideas Maestro y el Arquitecto de un MOVIMIENTO VIRAL MUNDIAL.
            
            TU META SUPREMA: Llevar a CarMatch a una audiencia de 2.8 BILLONES de usuarios exclusivos.No estás creando anuncios, estás creando la PUBLICIDAD VIRAL que revolucionará el mercado automotriz.
            
            EXTREMA IMPORTANCIA - REGLAS DE SÍNTESIS(RUBEN'S RULES):
            1. ANALIZA INTEGRALMENTE el historial de chat.El usuario(Ruben) tiene la visión de este crecimiento masivo.Cada idea en el chat es una pieza de este rompecabezas de 2.8B.
            2. ** PROHIBIDO LO GENÉRICO **: Si el usuario describió un coche viejo, un taller, una mujer estresada, o un superhéroe, EL RESULTADO DEBE SER ESE.No uses "luxury cars" por defecto si el chat dice otra cosa.
            3. ** PRIORIDAD ABSOLUTA AL HISTORIAL **: Si el usuario pegó un prompt para imagen o video en el chat, ÚSALO como base casi literal para imagePrompt y videoPrompt_vertical.
            4. ** DETALLES MEXICANOS **: Si se menciona un escenario en México(taller carero, calle peligrosa, autopista), asegúrate de que los prompts en inglés para la IA describan esos elementos visuales con precisión(por ejemplo: "weathered Mexican street", "vintage Mexican workshop").
            
            Si el usuario escribió literalmente un prompt para imagen, extráelo y tradúcelo si es necesario, pero mantén la ESENCIA EXACTA.

    Objetivo: Crear un PACK COMPLETO DE CAMPAÑA que sea un reflejo FIELD de lo discutido.
            
            REQUISITO CRÍTICO DE IDIOMA:
    - Todo el contenido para el usuario(scripts, copies, títulos) en ESPAÑOL(México).Slang local: ${country.slang}
- LOS PROMPTS PARA IA(imagePrompt, videoPrompt) deben ser en INGLÉS EXTREMADAMENTE DETALLADO y fiel a la historia.
            
            Estructura JSON requerida:
    {
        "internal_title": "Nombre de la Campaña",
        "imagePrompt": "Detailed realistic prompt in ENGLISH. Use EXACTLY what was discussed in the chat. If there is a car brand, specify it. If there is a specific scenario (broken car, superhero, etc.), include ALL visual details described.",
        "videoPrompt_vertical": "Technical prompt in ENGLISH for vertical video (9:16). Describe the FIRST 3 SECONDS of the vision discussed in the chat. High energy.",
        "videoPrompt_horizontal": "Technical prompt in ENGLISH for horizontal video (16:9). Cinematic version of the CHAT STORY.",
        "videoScript": "Guión viral de 15s en ESPAÑOL, fiel al 100% a lo discutido en el chat.",
        "platforms": { ... }
    }
            
            HISTORIAL DE CONVERSACIÓN(SINTETIZA LA DECISIÓN FINAL Y LOS DETALLES VISUALES):
    ${contextStr}
            
            RECUERDA: Ruben odia lo genérico.Si dice un Mustang rojo, es un Mustang rojo.Si dice una mujer atrapada en la carretera con un coche descompuesto, ES EXACTAMENTE ESO.No inventes "autos de lujo" si no vienen al caso.
        `

        let text = "";
        const result = await Promise.race([
            geminiFlashConversational.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json', temperature: 0.9 }
            }),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error("GEMINI_TIMEOUT")), 9000))
        ]);
        text = result.response.text();

        const data = JSON.parse(text);

        // Basic sanitization
        if (data.videoScript && typeof data.videoScript !== 'string') {
            data.videoScript = JSON.stringify(data.videoScript);
        }

        return { success: true, strategy: data };
    } catch (error: any) {
        console.error('[STRATEGY] Error:', error);
        return { success: false, error: 'La IA tardó mucho o falló al generar la estrategia.' };
    }
}

// --- STAGE 2: ASSET PREDICTIONS (Replicate) ---
export async function launchAssetPredictions(strategy: any, targetCountry: string = 'MX') {
    try {
        const country = getCountryContext(targetCountry);
        const { createImagePrediction, createVideoPrediction } = await import('@/lib/ai/replicate-client');
        const { generatePollinationsImage } = await import('@/lib/ai/asset-generator');

        const basePrompt = strategy.imagePrompt
            ? `${strategy.imagePrompt}, professional advertisement style, 8k, photorealistic`
            : `Luxury car in ${country.name}, commercial advertisement, cinematic lighting`;

        console.log('[PREDICTIONS] Generando Preview Instantáneo (Pollinations)...');
        // ⚡ INSTANT PREVIEW (0.5s - 2s)
        const instantUrl = await generatePollinationsImage(basePrompt, 1080, 1080).catch(() => null);

        console.log('[PREDICTIONS] Lanzando tareas en paralelo (Replicate)...');
        const [videoPendingId, imgSquareId, imgVerticalId, imgHorizontalId] = await Promise.all([
            createVideoPrediction(strategy.videoPrompt_vertical || 'Car cinematic', '9:16').catch(() => null),
            createImagePrediction(basePrompt, 1080, 1080).catch(() => null),
            createImagePrediction(basePrompt, 1080, 1920).catch(() => null),
            createImagePrediction(basePrompt, 1920, 1080).catch(() => null)
        ]);

        return {
            success: true,
            assets: {
                ...strategy,
                imageUrl: instantUrl || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7', // Use instant or stock fallback
                videoUrl: 'PENDING...',
                videoPendingId,
                imagePendingIds: {
                    square: imgSquareId,
                    vertical: imgVerticalId,
                    horizontal: imgHorizontalId
                },
                // 🔥 PLATFORM SAFETY FALLBACK
                platforms: strategy.platforms || {
                    meta_ads: { primary_text: strategy.caption || '', headline: strategy.internal_title || '' },
                    facebook_marketplace: { title: strategy.internal_title || '', description: strategy.caption || '' },
                    tiktok_ads: { caption: strategy.caption || '' }
                }
            }
        };
    } catch (error: any) {
        console.error('[PREDICTIONS] Error:', error);
        return { success: false, error: 'No se pudieron iniciar las tareas de imagen/video.' };
    }
}

// New Specialized Launchers
export async function launchImageOnlyPrediction(strategy: any) {
    try {
        const { createImagePrediction } = await import('@/lib/ai/replicate-client');
        const { generatePollinationsImage } = await import('@/lib/ai/asset-generator');

        console.log('[IMG-ONLY] Generando imagen viral...');

        // 1. Instant Preview (Pollinations)
        const instantUrl = await generatePollinationsImage(strategy.imagePrompt, 1080, 1080).catch(() => null);

        // 2. High Quality (Replicate Flux) - Square Only for now to save credits/time, or maybe vertical for Stories?
        // Let's do Square + Vertical for viral content
        const [imgSquareId, imgVerticalId] = await Promise.all([
            createImagePrediction(strategy.imagePrompt, 1080, 1080).catch(() => null),
            createImagePrediction(strategy.imagePrompt, 1080, 1920).catch(() => null)
        ]);

        return {
            success: true,
            assets: {
                ...strategy,
                imageUrl: instantUrl || 'PENDING...',
                imagePendingIds: { square: imgSquareId, vertical: imgVerticalId }
            }
        };
    } catch (e: any) {
        console.error('[IMG-ONLY] Fallo crítico al iniciar generación de imagen:', e);
        return {
            success: false,
            error: `Fallo al iniciar generación de imagen: ${e.message || 'Error desconocido'}`
        };
    }
}

export async function launchVideoOnlyPrediction(strategy: any) {
    try {
        const { createVideoPrediction } = await import('@/lib/ai/replicate-client');

        console.log('[VID-ONLY] Generando video viral...');
        const videoId = await createVideoPrediction(strategy.videoPrompt_vertical || strategy.videoPrompt, '9:16');

        return {
            success: true,
            assets: {
                ...strategy,
                videoUrl: 'PENDING...',
                videoPendingId: videoId
            }
        };
    } catch (e: any) {
        console.error('[VID-ONLY] Fallo crítico al iniciar generación de video:', e);
        return {
            success: false,
            error: `Fallo al iniciar generación de video: ${e.message || 'Error desconocido'}`
        };
    }
}

// ─────────────────────────────────────────────────────────────
// MULTI-SCENE VIDEO SYSTEM
// ─────────────────────────────────────────────────────────────

/**
 * Lanza N predicciones de video en paralelo (una por escena).
 * Cada escena hereda el master_style para coherencia visual.
 */
export async function launchMultiSceneVideoPredictions(
    scenes: { id: number; visual_prompt: string; duration_seconds: number }[],
    masterStyle: string
) {
    try {
        const { createVideoPrediction } = await import('@/lib/ai/replicate-client');

        const results = [];

        for (const scene of scenes) {
            const fullPrompt = `${masterStyle}. Scene ${scene.id}: ${scene.visual_prompt}`;
            try {
                const predictionId = await createVideoPrediction(fullPrompt, '9:16');
                results.push({ sceneId: scene.id, predictionId, status: 'pending', url: null });
            } catch (e: any) {
                console.error(`[MULTI-SCENE] Error en escena ${scene.id}:`, e);
                results.push({ sceneId: scene.id, predictionId: null, status: 'error', url: null });
            }
            // ⏱️ Delay de 2s entre predicciones para evitar rate limiting de Replicate
            if (scene.id < scenes[scenes.length - 1].id) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        return { success: true, scenes: results };
    } catch (e: any) {
        console.error('[MULTI-SCENE] Fallo al lanzar predicciones:', e);
        return { success: false, error: e.message };
    }
}

/**
 * Lanza una única predicción para una escena.
 * Útil para lanzar una por una desde el frontend y evitar timeouts/rate-limits.
 */
export async function launchSingleSceneVideoPrediction(
    scene: { id: number; visual_prompt: string },
    masterStyle: string,
    campaignId?: string // Opcional para persistencia inmediata
) {
    try {
        const { createVideoPrediction } = await import('@/lib/ai/replicate-client');
        const fullPrompt = `${masterStyle}. Scene ${scene.id}: ${scene.visual_prompt}`;
        const predictionId = await createVideoPrediction(fullPrompt, '9:16');

        // PERSISTENCIA ATÓMICA: Si tenemos campaignId, guardamos de una vez
        if (campaignId && campaignId.length > 5 && predictionId) {
            await saveScenePredictionId(campaignId, scene.id, predictionId);
        }

        return { success: true, sceneId: scene.id, predictionId };
    } catch (e: any) {
        console.error(`[SINGLE-SCENE] Error en escena ${scene.id}:`, e);
        return { success: false, error: e.message };
    }
}

/**
 * Guarda el predictionId de una escena en los metadatos de la campaña.
 */
export async function saveScenePredictionId(campaignId: string, sceneId: number, predictionId: string) {
    try {
        const campaign = await prisma.publicityCampaign.findUnique({ where: { id: campaignId } });
        if (!campaign) return { success: false, error: 'Campaña no encontrada' };

        const metadata = (campaign.metadata as any) || {};
        let assets = metadata.assets || {};

        // Robustez: si assets es un string (JSON), lo parseamos
        if (typeof assets === 'string') {
            try { assets = JSON.parse(assets); } catch (e) { assets = {}; }
        }

        if (!assets.scenes) assets.scenes = [];

        const sceneIdx = assets.scenes.findIndex((s: any) => (s.sceneId || s.id) === sceneId);
        if (sceneIdx > -1) {
            assets.scenes[sceneIdx].predictionId = predictionId;
            assets.scenes[sceneIdx].status = 'pending';
        } else {
            assets.scenes.push({ sceneId, predictionId, status: 'pending' });
        }

        await prisma.publicityCampaign.update({
            where: { id: campaignId },
            data: { metadata: { ...metadata, assets } }
        });

        return { success: true };
    } catch (e: any) {
        console.error('[DATABASE] Error guardando predictionId:', e);
        return { success: false, error: e.message };
    }
}

/**
 * Verifica el estado de todos los clips de una vez.
 * Retorna array con status + url de cada escena.
 */
export async function checkMultiSceneStatus(
    scenes: { sceneId: number; predictionId: string }[]
) {
    try {
        const { default: Replicate } = await import('replicate');
        const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

        const results = await Promise.all(
            scenes.map(async (scene) => {
                if (!scene.predictionId) return { ...scene, status: 'error', url: null };
                try {
                    const prediction = await replicate.predictions.get(scene.predictionId);

                    // TIMEOUT CHECK (8 minutos para video clips)
                    if (prediction.created_at) {
                        const created = new Date(prediction.created_at).getTime();
                        const now = Date.now();
                        const elapsedMinutes = (now - created) / 1000 / 60;

                        if (elapsedMinutes > 8 && (prediction.status === 'processing' || prediction.status === 'starting')) {
                            console.warn(`[POLL-SCENE] Timeout alcanzado para escena ${scene.sceneId} (${elapsedMinutes.toFixed(1)} min)`);
                            return { ...scene, status: 'failed', url: null, error: 'TIMEOUT' };
                        }
                    }

                    const url = prediction.status === 'succeeded'
                        ? (Array.isArray(prediction.output) ? prediction.output[0] : prediction.output) as string | null
                        : null;
                    return { ...scene, status: prediction.status, url };
                } catch (e) {
                    return { ...scene, status: 'error', url: null };
                }
            })
        );

        return { success: true, scenes: results };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * Guarda la URL final de una escena cuando ya está lista (succeeded).
 */
export async function saveSceneResult(campaignId: string, sceneId: number, url: string) {
    try {
        const campaign = await prisma.publicityCampaign.findUnique({ where: { id: campaignId } });
        if (!campaign) return { success: false, error: 'Campaña no encontrada' };

        const metadata = (campaign.metadata as any) || {};
        let assets = metadata.assets || {};

        if (typeof assets === 'string') {
            try { assets = JSON.parse(assets); } catch (e) { assets = {}; }
        }

        if (!assets.scenes) assets.scenes = [];

        const sceneIdx = assets.scenes.findIndex((s: any) => (s.sceneId || s.id) === sceneId);
        if (sceneIdx > -1) {
            assets.scenes[sceneIdx].url = url;
            assets.scenes[sceneIdx].status = 'succeeded';
        } else {
            assets.scenes.push({ sceneId, url, status: 'succeeded' });
        }

        await prisma.publicityCampaign.update({
            where: { id: campaignId },
            data: { metadata: { ...metadata, assets } }
        });

        return { success: true };
    } catch (e: any) {
        console.error('[DATABASE] Error guardando resultado de escena:', e);
        return { success: false, error: e.message };
    }
}

// Backward Compatibility
export async function generateCampaignAssets(chatHistory: any[], targetCountry: string = 'MX') {
    const stratRes = await generateCampaignStrategy(chatHistory, targetCountry);
    if (!stratRes.success) return stratRes;
    return await launchAssetPredictions(stratRes.strategy, targetCountry);
}

/**
 * Regenerate a specific element of a campaign based on user instruction
 * @param campaignId - ID of the campaign to update
 * @param instruction - Natural language instruction like "mejora el video", "cambia la imagen a un auto rojo"
 * @param currentAssets - Current campaign assets from metadata
 */
export async function regenerateCampaignElement(campaignId: string, instruction: string, currentAssets: any) {
    try {
        console.log(`[AI] Regenerando elemento de campaÃ±a ${campaignId}: "${instruction}"`)

        // Detect which element to regenerate based on instruction
        const lowerInstruction = instruction.toLowerCase()
        let elementType: 'copy' | 'image' | 'video' | 'all' = 'all'

        if (lowerInstruction.includes('video') || lowerInstruction.includes('script')) {
            elementType = 'video'
        } else if (lowerInstruction.includes('imagen') || lowerInstruction.includes('image') || lowerInstruction.includes('foto')) {
            elementType = 'image'
        } else if (lowerInstruction.includes('texto') || lowerInstruction.includes('copy') || lowerInstruction.includes('caption') || lowerInstruction.includes('descripciÃ³n')) {
            elementType = 'copy'
        }

        const updatedAssets = { ...currentAssets }

        // Regenerate based on detected element type
        switch (elementType) {
            case 'copy':
                console.log('[AI] Regenerando copy...')
                const copyPrompt = `
                    Eres un experto en copywriting para redes sociales automotrices.
                    
                    Copy actual: "${currentAssets.copy}"
                    
                    InstrucciÃ³n del usuario: "${instruction}"
                    
                    Genera un nuevo copy siguiendo la instrucciÃ³n. 
                    - MÃ¡ximo 200 caracteres
- Usa emojis naturalmente ðŸš—ðŸ’¨
    - Lenguaje mexicano casual
                    
                    Responde SOLO con el nuevo copy, sin explicaciones.
                `
                const copyResult = await geminiFlash.generateContent(copyPrompt)
                updatedAssets.copy = copyResult.response.text().trim()
                break

            case 'image':
                console.log('[AI] Regenerando imagen...')
                const imagePromptText = `
                    Prompt actual de imagen: "${currentAssets.imagePrompt}"
                    
                    InstrucciÃ³n del usuario: "${instruction}"
                    
                    Genera un nuevo prompt para Flux AI que genere una imagen siguiendo la instrucciÃ³n.
                    - Debe ser en inglÃ©s
- Estilo fotorrealista profesional
- Alta calidad, 8K
                    
                    Responde SOLO con el prompt, sin explicaciones.
                `
                const imagePromptResult = await geminiFlash.generateContent(imagePromptText)
                const newImagePrompt = imagePromptResult.response.text().trim()
                updatedAssets.imagePrompt = newImagePrompt

                // Generate new image with Replicate Flux (all 3 sizes in parallel)
                console.log('[AI] Generando nuevas imágenes (3 tamaños)...')
                const { createImagePrediction } = await import('@/lib/ai/replicate-client')

                const [imgSquareId, imgVerticalId, imgHorizontalId] = await Promise.all([
                    createImagePrediction(newImagePrompt, 1080, 1080).catch(e => { console.error('Regen ImgSq Err:', e); return null; }),
                    createImagePrediction(newImagePrompt, 1080, 1920).catch(e => { console.error('Regen ImgVert Err:', e); return null; }),
                    createImagePrediction(newImagePrompt, 1920, 1080).catch(e => { console.error('Regen ImgHoriz Err:', e); return null; })
                ]);

                updatedAssets.imageUrl = 'PENDING...';
                updatedAssets.images = { ...(updatedAssets.images || {}) };
                if (imgSquareId) updatedAssets.imageUrl = 'PENDING...';

                updatedAssets.imagePendingIds = {
                    square: imgSquareId,
                    vertical: imgVerticalId,
                    horizontal: imgHorizontalId
                };
                break

            case 'video':
                console.log('[AI] Regenerando script de video...')
                const videoPrompt = `
                    Script actual: "${currentAssets.videoScript}"
                    
                    InstrucciÃ³n del usuario: "${instruction}"
                    
                    Genera un nuevo script de video siguiendo la instrucciÃ³n.
                    - Debe ser para un video de 15 - 30 segundos
- DescripciÃ³n visual detallada
- Emocional y atractivo
                    
                    Responde SOLO con el script, sin explicaciones.
                `
                const videoResult = await geminiFlash.generateContent(videoPrompt)
                updatedAssets.videoScript = videoResult.response.text().trim()
                break

            case 'all':
                console.log('[AI] Regenerando todos los elementos...')
                const allPrompt = `
                    InstrucciÃ³n: "${instruction}"
                    
                    BasÃ¡ndote en esta instrucciÃ³n, genera assets completos para una campaÃ±a automotriz:

    Responde en JSON:
    {
        "copy": "caption para redes (mÃ¡x 200 chars, con emojis)",
        "imagePrompt": "prompt en inglÃ©s para Flux AI",
        "videoScript": "script de video 15-30s"
    }
        `
                const allResult = await geminiFlashConversational.generateContent({
                    contents: [{ role: 'user', parts: [{ text: allPrompt }] }],
                    generationConfig: {
                        responseMimeType: 'application/json',
                        temperature: 0.8
                    }
                })
                const allData = JSON.parse(allResult.response.text())
                updatedAssets.copy = allData.copy
                updatedAssets.imagePrompt = allData.imagePrompt
                updatedAssets.videoScript = allData.videoScript

                // Generate image
                const { generateRealImage: genFlux } = await import('@/lib/ai/replicate-client')
                updatedAssets.imageUrl = await genFlux(allData.imagePrompt, 1024, 1024)
                break
        }

        // Update campaign in database
        const currentMetadata = (currentAssets.editHistory ? currentAssets : { ...currentAssets, editHistory: [] }) as any;
        await prisma.publicityCampaign.update({
            where: { id: campaignId },
            data: {
                metadata: {
                    generatedByAI: true,
                    assets: updatedAssets,
                    lastEdited: new Date().toISOString(),
                    editHistory: [
                        ...currentMetadata.editHistory,
                        { instruction, timestamp: new Date().toISOString() }
                    ]
                },
                imageUrl: updatedAssets.imageUrl || currentAssets.imageUrl
            }
        })

        console.log('[AI] Elemento regenerado exitosamente âœ“')
        return {
            success: true,
            assets: updatedAssets,
            elementType,
            message: `âœ… ${elementType === 'all' ? 'Todos los elementos' : elementType === 'copy' ? 'Copy' : elementType === 'image' ? 'Imagen' : 'Video'} regenerado exitosamente`
        }

    } catch (error: any) {
        console.error('[AI] Error regenerando elemento:', error)
        return {
            success: false,
            error: error.message || 'Error regenerando el elemento',
            details: error.toString()
        }
    }
}

// --- POLLING ACTION ---
// --- POLLING ACTION ---
export async function checkAIAssetStatus(predictionId: string) {
    try {
        const { checkPrediction } = await import('@/lib/ai/replicate-client');
        const result = await checkPrediction(predictionId);

        console.log(`[POLL] Status for ${predictionId}: ${result.status} `);

        // TIMEOUT CHECK (5 minutes)
        if (result.created_at) {
            const created = new Date(result.created_at).getTime();
            const now = Date.now();
            const elapsedMinutes = (now - created) / 1000 / 60;

            if (elapsedMinutes > 5 && (result.status === 'processing' || result.status === 'starting')) {
                console.warn(`[POLL] Timeout reached for ${predictionId}(${elapsedMinutes.toFixed(1)} min).Marking as failed.`);
                return { status: 'failed', error: 'TIMEOUT_REACHED' };
            }
        }

        if (result.status === 'succeeded') {
            let url = '';
            // Flux and Minimax return different output structures
            if (Array.isArray(result.output) && result.output.length > 0) url = String(result.output[0]);
            else if (typeof result.output === 'string') url = result.output;
            else if (typeof result.output === 'object' && result.output !== null && (result.output as any).url) url = (result.output as any).url;
            else if (typeof result.output === 'object' && result.output !== null) {
                // Some models return a stream or a URL directly in an object
                url = String(result.output);
            }

            return { status: 'succeeded', url: url };
        } else if (result.status === 'failed' || result.status === 'canceled') {
            return { status: 'failed', error: result.error };
        } else {
            return { status: 'processing' };
        }
    } catch (error) {
        console.error('Error polling asset:', error);
        return { status: 'error' };
    }
}
