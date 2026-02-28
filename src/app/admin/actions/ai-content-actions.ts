// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

'use server'

import { geminiFlashConversational, geminiFlash, geminiPro } from '@/lib/ai/geminiModels'
import { prisma } from '@/lib/db'
import Replicate from 'replicate'
import { createImagePrediction, createVideoPrediction, checkPrediction } from '@/lib/ai/replicate-client'
import { generatePollinationsImage } from '@/lib/ai/asset-generator'


// Helper to get country specific context
const getCountryContext = (countryCode: string) => {
    const contexts: any = {
        'MX': { name: 'México', slang: 'mexicano (wey, chido, nave, padrísimo)', currency: 'MXN', language: 'Spanish (Mexican)' },
        'US': { name: 'USA', slang: 'American English / Spanglish', currency: 'USD', language: 'English' },
        'CO': { name: 'Colombia', slang: 'parce, chimba, carro', currency: 'COP', language: 'Spanish (Colombian)' },
        'ES': { name: 'España', slang: 'guay, coche, tío', currency: 'EUR', language: 'Spanish (Spain)' },
        'AR': { name: 'Argentina', slang: 'che, auto, re copado', currency: 'ARS', language: 'Spanish (Argentina)' },
        'BR': { name: 'Brazil', slang: 'português (top, massa, carro)', currency: 'BRL', language: 'Portuguese' },
        'JP': { name: 'Japan', slang: 'Japanese car culture (shakotan, kyusha)', currency: 'JPY', language: 'Japanese' },
        'DE': { name: 'Germany', slang: 'German efficiency, autobahn', currency: 'EUR', language: 'German' },
        'FR': { name: 'France', slang: 'French (voiture, route)', currency: 'EUR', language: 'French' },
        'IT': { name: 'Italy', slang: 'Italian passion (macchina, passione)', currency: 'EUR', language: 'Italian' },
        'GB': { name: 'UK', slang: 'mate, bloody fast, motor', currency: 'GBP', language: 'English (UK)' },
        'IN': { name: 'India', slang: 'Indian automotive context (gaadi)', currency: 'INR', language: 'Hindi' },
        'TR': { name: 'Turkey', slang: 'Turkish context (araba)', currency: 'TRY', language: 'Turkish' },
        'RU': { name: 'Russia', slang: 'Russian context (mashina)', currency: 'RUB', language: 'Russian' },
        'CN': { name: 'China', slang: 'Chinese automotive context', currency: 'CNY', language: 'Chinese' },
        'KR': { name: 'South Korea', slang: 'Korean automotive context', currency: 'KRW', language: 'Korean' },
        'TH': { name: 'Thailand', slang: 'Thai automotive context', currency: 'THB', language: 'Thai' },
        'VN': { name: 'Vietnam', slang: 'Vietnamese automotive context', currency: 'VND', language: 'Vietnamese' },
        'ID': { name: 'Indonesia', slang: 'Indonesian automotive context (mobil)', currency: 'IDR', language: 'Indonesian' },
        'PL': { name: 'Poland', slang: 'Polish car terms (samochód)', currency: 'PLN', language: 'Polish' },
        'TR_TR': { name: 'Turkey', slang: 'Turkish automotive', currency: 'TRY', language: 'Turkish' },
    }
    const ctx = contexts[countryCode] || contexts['MX']
    return { ...ctx, code: countryCode }
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
            - **BRANDING & LOGO**: The scene MUST prominently and accurately feature the official "**CarMatch**" logo. The logo is the original corporate identity: professional, modern, and associated with a premium automotive marketplace. If the scene shows a dealership, the logo is on the main totem; if it's a smartphone, it's the app's splash screen; if it's a car, it's a discrete decal or on a license plate.
            - **LOGO INTEGRITY**: DO NOT alter the logo's colors, shape, or proportions. It must look like a high-end, official corporate branding.

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
            - ALL content MUST be in the native language of ${country.name}: ${country.language}.
            - Use local slang: ${country.slang}
            - NO English words except brand names (CarMatch, TikTok, Instagram, etc.) if they are used locally.
            
            IMPORTANT:
            - DO NOT promote a specific single car. Promote the APP/PLATFORM as a GLOBAL MOVEMENT.
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

            const basePrompt = campaignData.imagePrompt || 'Luxury car in Mexico City, cinematic'

            const [videoPendingId, imgSquareId, imgVerticalId, imgHorizontalId, imgPortraitId] = await Promise.all([
                createVideoPrediction(campaignData.videoPrompt || 'Car cinematic', '9:16').catch(e => { console.error('[AUTO-PILOT] Video Err:', e); return null; }),
                createImagePrediction(basePrompt, 1080, 1080).catch(e => { console.error('[AUTO-PILOT] ImgSq Err:', e); return null; }),
                createImagePrediction(basePrompt, 1080, 1920).catch(e => { console.error('[AUTO-PILOT] ImgVert Err:', e); return null; }),
                createImagePrediction(basePrompt, 1920, 1080).catch(e => { console.error('[AUTO-PILOT] ImgHoriz Err:', e); return null; }),
                createImagePrediction(basePrompt, 1080, 1350).catch(e => { console.error('[AUTO-PILOT] ImgPortrait Err:', e); return null; })
            ])

            campaignData.videoPendingId = videoPendingId
            campaignData.imagePendingIds = {
                square: imgSquareId,
                vertical: imgVerticalId,
                horizontal: imgHorizontalId,
                portrait: imgPortraitId
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
            Eres el DIRECTOR DE ARTE y VIRALIDAD EXTREMA de CarMatch.
            El usuario CONFIRMÓ una idea genial en el chat, y ahora debes ESTRUCTURARLA LISTA PARA PRODUCCIÓN como IMAGEN/CARRUSEL.
            
            ⚠️ REGLA DE ADHERENCIA NIVEL DIOS (MANDATORIO):
            - Revisa el HISTORIAL DE CHAT minuciosamente. 
            - Si el usuario habló de una TRIVIA, la campaña debe ser de TRIVIA. 
            - Si el usuario pidió un número específico de fotos (ej: "3 imágenes"), DEBES generar exactamente ese número de prompts en 'imagePrompts'.
            - NO ALUCINES. Si no se habló de "2JZ" o "lodo", no lo pongas. Cíñete 100% a lo platicado.

            SOBRE EL CONTENIDO:
            - Debe ser PROFUNDO en el nicho automotriz hablado. Si es JDM, usa referencias exactas. Si es mecánica, detalles crudos.
            - DEBE ser interactivo, polémico, o altamente relatable. NO "anuncios bonitos".
            - Integra la marca "CarMatch" sutilmente, pero dale TODO el peso a la cultura motor.

            HISTORIAL DE CHAT DE REFERENCIA (ESTO ES SAGRADO):
            ${contextStr}
            
            REGLAS DE ADHERENCIA CRÍTICA:
            1. **Escucha cada detalle**: Si el usuario mencionó colores, marcas de autos específicas, o una atmósfera particular, DEBES incluirlo.
            2. **Frecuencia de Ideas**: El tamaño de tu array 'imagePrompts' debe ser EXACTAMENTE el solicitado por el usuario en el chat.
            3. **Logo CarMatch**: El logo debe integrarse como parte de la escena de forma elegante.
            
            INSTRUCCIONES TÉCNICAS DE FORMATO:
            - **CARRUSELES O SERIES**: Genera un array de prompts INDIVIDUALES Y DISTINTOS para 'imagePrompts'. Cada uno debe ser una toma diferente (Close-up, Wide, Medium) pero bajo la misma narrativa.
            - **PROMPTS SUPER DETALLADOS**: En INGLÉS técnico de fotografía (ej. "Shot on Fujifilm XT4, cinematic street lighting, hyper-realistic car textures, 8k").
            
            Output JSON EXACTO (sin marcas de markdown):
            {
                "internal_title": "Título estratégico de la campaña",
                "imagePrompt": "PROMPT PRINCIPAL EN INGLÉS MUY DETALLADO.",
                "imagePrompts": ["PROMTS INDIVIDUALES. Uno por cada imagen solicitada. Mínimo 1, máximo lo pedido por el usuario."],
                "visualSummary": "Resumen en ESPAÑOL de qué fotos se van a generar y por qué.",
                "caption": "Caption principal en ESPAÑOL (${country.slang}).",
                "platforms": {
                    "facebook_marketplace": { "titulo": "...", "descripcion": "..." },
                    "instagram": { "caption": "..." },
                    "twitter_x": { "tweet": "..." },
                    "threads": { "post": "..." },
                    "linkedin": { "post": "..." },
                    "whatsapp": { "mensaje": "..." },
                    "pinterest": { "description": "..." }
                }
            }
        `;

        const result = await Promise.race([
            geminiFlash.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json', temperature: 0.7, maxOutputTokens: 4096 }
            }),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error("STRATEGY_TIMEOUT")), 30000))
        ]);

        const responseText = result.response.text();
        try {
            return { success: true, strategy: JSON.parse(responseText) };
        } catch (parseError) {
            console.error('Invalid JSON from Gemini (Image Strategy):', responseText);
            throw new Error('FAILED_TO_PARSE_STRATEGY');
        }

    } catch (error: any) {
        console.error('Error creating image strategy:', error);

        // Return a more descriptive error if it's a timeout
        if (error.message === 'STRATEGY_TIMEOUT') {
            return { success: false, error: 'La IA tardó demasiado en diseñar la campaña. Intenta con una idea más simple o presiona reintentar.' };
        }

        return { success: false, error: 'Error al diseñar la imagen estratégica. Intenta de nuevo.' };
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
            Eres el CINEASTA VIRAL Nº1 Y EXPERTO EXTREMO EN NICHOS AUTOMOTRICES.
            El usuario CONFIRMÓ una gran idea. Tienes que estructurarla en un formato de GUIÓN DE VIDEO EXPLOSIVO.
            
            REQUISITOS DEL NICHO MOTOR:
            - Eres un purista. Si el chat trata de Drift, usa "ángulo de dirección, freno de mano, humo de llantas, JDM". Si es de rutas, usa "4-low, tracción bloqueo de diferencial", etc.
            - TODO visual (pistas de off road, talleres clandestinos, autódromos) se debe describir profesionalmente para la IA de video.

            REGLAS DEL VIDEO CORTO (TikTok / Shorts / Reels):
            - LOS PRIMEROS 3 SEGUNDOS DEBEN CAUSAR UN MICRO-SHOCK.
            - Cortes bruscos, alto dinamismo.
            - Textos grandes en pantalla. 
            
            HISTORIAL DE CHAT BASE (SIGUE LAS ÓRDENES DEL USUARIO):
            ${contextStr}
            
            REGLAS DE ADHERENCIA MAESTRA:
            1. **Cero Genéricos**: Si el usuario planeó algo específico, NO uses el fallback. Adapta el guión exactamente a lo que se platicó.
            2. **Atención al Detalle**: Si se mencionaron marcas, lugares o sonidos específicos, deben estar en el JSON.
            3. **Master Style**: Define un estilo visual en inglés que se aplique a TODAS las escenas para que el video no parezca un collage de cosas distintas.
            
            FORMATOS REQUERIDOS EN EL RESULTADO:
            - Guion escena por escena
            - Adaptaciones del título/caption para cada entorno nativo.
            
            📋 OUTPUT JSON EXACTO — SIN COMENTARIOS
            {
                "internal_title": "Título interno de la campaña de Video",
                "viral_angle": "Por qué psicológicamente esto hará que repliquen y comenten",
                "hook_3s": "TEXTO EXACTO del gancho en los primeros 3 segundos (En MAYÚSCULAS)",
                "visualSummary": "Resumen en ESPAÑOL amable de lo que será el video (Explicado para el usuario).",
                "videoScript": "Guión COMPLETO en ESPAÑOL. Tiempos, Texto en pantalla, y Locución.",
                "monetization_cta": "Frase de cierre integrando CarMatch a la trama",
                "recommended_format": "vertical",
                "master_style": "Estilo cinematográfico en INGLÉS (Ej: 'Raw documentary style, handheld fast camera, neon lights, gritty urban garage 8k').",
                "scenes": [
                    {
                        "id": 1,
                        "duration_seconds": 6,
                        "visual_prompt": "PROMPT EN INGLÉS PARA IA DE VIDEO. [MASTER_STYLE] + qué está pasando de forma hyperrealista.",
                        "screen_text": "TEXTO EN PANTALLA"
                    }
                ],
                "platforms": {
                    "tiktok": {
                        "caption": "Caption TikTok de NICHO PROFUNDO. Emojis, slang ${country.slang}. Directo a la vena. Max 150 chars. Hashtags muy específicos + #CarMatch.",
                        "audio_suggestion": "Qué sonido trending o tipo de música poner de fondo (ej 'Phonk slowed down' o 'Motor revving con beat de rap')"
                    },
                    "instagram_reels": {
                        "caption": "Reels Caption. Más estética y 'lifestyle' pero rudo si es de mecánica. Textos un poco más elaborados. Tags al final."
                    },
                    "youtube_shorts": {
                        "titulo": "Título SEO Youtube Shorts (Max 80 chars, muy clickbait pero cumpliendo)",
                        "descripcion": "Descripción con keywords automotrices ocultas para el algoritmo."
                    },
                    "facebook_reels": {
                        "caption": "Reels para gente de 30+ en Face. Preguntas directas ('¿Quién más prefiere un V8 a uno automático?'). CTA explícito de compartir."
                    },
                    "snapchat": {
                        "caption": "Ultra corto. Para Gen-Z. 1 línea + 1 Emoji."
                    },
                    "youtube_largo": {
                        "titulo": "Sugerencia de cómo expandir esta idea en un video formato 16:9 tradicional (Ej: 'Restaurando este V8 en 24h')",
                        "descripcion": "Estructura general de qué contar en 8 minutos."
                    }
                }
            }
        `;

        const result = await Promise.race([
            geminiFlash.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json', temperature: 0.7, maxOutputTokens: 4096 }
            }),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error("STRATEGY_TIMEOUT")), 30000))
        ]);

        const responseText = result.response.text();
        try {
            return { success: true, strategy: JSON.parse(responseText) };
        } catch (parseError) {
            console.error('Invalid JSON from Gemini (Video Strategy):', responseText);
            throw new Error('FAILED_TO_PARSE_STRATEGY');
        }

    } catch (error: any) {
        console.error('Error creating video strategy:', error);

        if (error.message === 'STRATEGY_TIMEOUT') {
            return { success: false, error: 'El Lab de Video tardó demasiado. Intenta de nuevo con una idea más corta.' };
        }

        return { success: false, error: 'Error al diseñar el video estratégico. Intenta de nuevo.' };
    }
}


// --- AI Chat for Publicity Agent ---
export async function chatWithPublicityAgent(messages: any[], targetCountry: string = 'MX', currentMode: string = 'CHAT') {
    try {
        const country = getCountryContext(targetCountry)

        // Instrucciones base compartidas de "Mastermind"
        let expertProfile = `
            ERES: EL MASTERMIND DE CARMATCH (Propulsado por los modelos más rápidos de Google Gemini). No eres un bot, eres un DIRECTOR CREATIVO DE ÉLITE.
            
            MISIÓN: Transformar ideas simples en campañas legendarias para el mercado de ${country.name}.
            
            REGLAS MASTERMIND (ANTI-GENÉRICO):
            - **Cero Palabrería**: Habla directo, rudo y con pasión por los fierros. 
            - **Nicho Profundo**: Si alguien dice "un Toyota", tú hablas de un Supra, de un Corolla AE86 o de un GR Yaris. Conoce el lenguaje de la cultura motor.
            - **Estrategia Agresiva**: Si el usuario propone algo aburrido, dile "Tu idea es muy básica, mejor hagamos esto...". 
            - **Identidad**: Si te preguntan, eres el Mastermind de CarMatch. Punto.
        `;

        if (currentMode === 'IMAGE_GEN') {
            expertProfile += `
            
            MODO ACTUAL: ESTUDIO DE IMÁGENES 📸
            Tu meta es conceptualizar FOTOS VIRALES y GALERÍAS (CARRUSELES) que rompan los algoritmos de Instagram y Facebook.
            Cuando sugieras ideas, piensa en:
            - **Shitposting de calidad**: Expectativa vs Realidad en talleres.
            - **Estética premium**: Tomas macro de piezas de motor, autos sucios en el lodo (realismo), pintura desgastada.
            - **Aporta valor**: Da prompts al usuario o ideas súper específicas (Ej: "Crea una serie de 5 imágenes mostrando la evolución de un Nissan Skyline de 1970 a 2024").
            `;
        } else if (currentMode === 'VIDEO_GEN') {
            expertProfile += `
            
            MODO ACTUAL: PRODUCTORA DE VIDEO 🎬
            Tu meta es diseñar GUIONES para TikTok, Reels y Shorts que retengan a la audiencia TODO EL VIDEO.
            Cuando sugieras ideas, piensa en:
            - **Los primeros 3 segundos**: Cómo vas a detener el scroll visual o auditivamente.
            - **Audios virales**: Sugiere sonidos específicos (ej: "Música épica de Phonk con cortes de acelerador").
            - **Dinamismo**: Formatos "Sabías que...", "Mitos desmentidos", "Humor de mecánicos".
            `;
        }

        const systemPrompt = `
            ${expertProfile}
            
            TONO Y ESTILO:
            - **Idioma**: Español (México) con slang MUY natural de la cultura motor (${country.slang}). 
            - **Personalidad**: Eres apasionado, directo y extremadamente brillante. Eres el Director Creativo definitivo.
            - **Formato**: Usa emojis estratégicos (🏎️, 🔥, 💣), ve al grano.
            
            REGLAS DE RUBEN:
            1. **No seas genérico**: PROHIBIDO decir "claro que sí", "como asistente...", "estoy aquí para...". Habla como un experto.
            2. **Planeación Real**: Cuestiona la marca, el nicho, los gustos de la audiencia.
            3. **El Comando Sagrado**: SOLO cuando el usuario diga "DAME EL PRONT FINAL" entrega la síntesis técnica. Antes de eso, DIVIÉRTETE planeando.
            
            PIENSA COMO UN GENIO. ACTÚA COMO UN EXPERTO. DOMINA EL ALGORITMO.
        `;

        // Convert messages to Gemini format
        const historyParts = [
            {
                role: "user",
                parts: [{ text: systemPrompt }],
            },
            {
                role: "model",
                parts: [{ text: `Listo. Soy el Mastermind Viral. Cuéntame sobre qué nicho o locura motorizada vamos a hablar hoy en ${country.name}. 🚀` }],
            },
            ...messages.slice(0, -1).map((m: any) => {
                let text = m.content;
                // Si el contenido es JSON (guardado por nosotros), extraemos solo el texto para la IA
                if (text && text.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(text);
                        text = parsed.content || text;
                    } catch (e) {
                        // Not JSON, keep as is
                    }
                }
                return {
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text }],
                };
            })
        ]

        const chat = geminiFlashConversational.startChat({
            history: historyParts,
            generationConfig: {
                maxOutputTokens: 4096,
                temperature: 0.8,
            },
        });

        const lastMessage = messages[messages.length - 1].content

        // TIMEOUT PROTECTION (9s max to stay within Vercel 10s limit)
        try {
            // Check if user is asking for the final prompt
            const isAskingForFinal = lastMessage.toLowerCase().includes('dame el pront final') ||
                lastMessage.toLowerCase().includes('dame el prompt final') ||
                lastMessage.toLowerCase().includes('listo la produccion')

            if (isAskingForFinal) {
                // If asking for final, we trigger the strategy generation immediately
                const stratRes = await getCampaignStrategyPreview(messages, currentMode === 'VIDEO_GEN' ? 'VIDEO' : 'IMAGE', targetCountry);
                if (stratRes.success) {
                    return {
                        success: true,
                        message: "¡Excelente decisión! He sintetizado toda nuestra planeación en este Prompt Maestro. Aquí tienes los detalles técnicos para iniciar la producción.",
                        type: 'PROPOSAL',
                        strategy: stratRes.strategy
                    }
                }
            }

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
                message: "¡Qué onda! Ando calibrando los motores centrales para darte una respuesta ruda. Cuéntame más de esa idea que traes en mente... ¿Qué coches vamos a usar? 🏎️🔥"
            }
        }
    } catch (error) {
        console.error('Error in chatWithPublicityAgent:', error)
        return { success: false, error: 'Error connecting to AI Agent.' }
    }
}


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
        "imagePrompt": "Detailed realistic prompt in ENGLISH. Use EXACTLY what was discussed in the chat. MUST describe the ORIGINAL CarMatch logo appearing naturally in the scene (smartphone screen, dealership totem, etc.). Use photorealistic style, 8k.",
        "videoPrompt_vertical": "Technical prompt in ENGLISH for vertical video (9:16). Describe the FIRST 3 SECONDS of the vision discussed in the chat. Include CarMatch branding.",
        "videoPrompt_horizontal": "Technical prompt in ENGLISH for horizontal video (16:9). Cinematic version of the CHAT STORY with CarMatch logo integration.",
        "videoScript": "Guión viral de 15s en el idioma nativo que sea fiel al 100% a lo discutido en el chat.",
        "platforms": { ... }
    }
            
            HISTORIAL DE CONVERSACIÓN (SINTETIZA LA DECISIÓN FINAL Y LOS DETALLES VISUALES):
    ${contextStr}
            
            RECUERDA: Ruben odia lo genérico. Si dice un Mustang rojo, es un Mustang rojo. Si dice una mujer atrapada en la carretera con un coche descompuesto, ES EXACTAMENTE ESO. No inventes "autos de lujo" si no vienen al caso.
            
            CRITICAL LANGUAGE REQUIREMENT:
            - EVERYTHING (descriptions, scripts, platform copies) must be in ${country.language} for ${country.name}.
            - PROMPS for AI (imagePrompt, videoPrompt) remain in ENGLISH for technical precision.
        `

        let text = "";
        const result = await Promise.race([
            geminiFlashConversational.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json', temperature: 0.9, maxOutputTokens: 4096 }
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

        const basePrompt = strategy.imagePrompt
            ? `${strategy.imagePrompt}, professional advertisement style, 8k, photorealistic`
            : `Luxury car in ${country.name}, commercial advertisement, cinematic lighting`;

        console.log('[PREDICTIONS] Generando Preview Instantáneo (Pollinations)...');
        // ⚡ INSTANT PREVIEW (0.5s - 2s)
        const instantUrl = await generatePollinationsImage(basePrompt, 1080, 1080).catch(() => null);

        console.log('[PREDICTIONS] Lanzando tareas en paralelo (Replicate)...');
        const [videoPendingId, imgSquareId, imgVerticalId, imgHorizontalId, imgPortraitId] = await Promise.all([
            createVideoPrediction(strategy.videoPrompt_vertical || 'Car cinematic', '9:16').catch(() => null),
            createImagePrediction(basePrompt, 1080, 1080).catch(() => null),
            createImagePrediction(basePrompt, 1080, 1920).catch(() => null),
            createImagePrediction(basePrompt, 1920, 1080).catch(() => null),
            createImagePrediction(basePrompt, 1080, 1350).catch(() => null)
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
                    horizontal: imgHorizontalId,
                    portrait: imgPortraitId
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

/**
 * Lanza una serie de predicciones de imagen basadas en un array de prompts.
 * Si no hay array, usa el prompt principal N veces (usando semillas diferentes).
 */
export async function launchBatchImagePredictions(strategy: any, count: number = 3) {
    try {
        console.log(`[BATCH-IMG] Lanzando producción de ${count} imágenes...`);

        const prompts = strategy.imagePrompts && Array.isArray(strategy.imagePrompts)
            ? strategy.imagePrompts
            : Array.from({ length: count }).map(() => strategy.imagePrompt);

        // Solo lanzamos los primeros N para no saturar
        const limitedPrompts = prompts.slice(0, 50);

        const result = await Promise.race([
            Promise.all(limitedPrompts.map((p: string, i: number) =>
                createImagePrediction(p, 1080, 1080).catch(e => {
                    console.error(`[BATCH-IMG] Error en imagen ${i}:`, e);
                    return null;
                })
            )),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error("REPLICATE_BATCH_TIMEOUT")), 15000))
        ]);

        const predictions = result;

        const imagePendingIds: Record<string, string | null> = {};
        predictions.forEach((id: string | null, i: number) => {
            if (id) imagePendingIds[`img_${i}`] = id;
        });

        // Set the first successful prediction as the main "square" for the campaign
        const firstSuccess = predictions.find((id: string | null) => id !== null);
        if (firstSuccess) imagePendingIds.square = firstSuccess;

        return {
            success: true,
            imagePendingIds
        };
    } catch (error: any) {
        console.error('[BATCH-IMG] Error general:', error);
        return { success: false, error: error.message };
    }
}

export async function launchVideoOnlyPrediction(strategy: any) {
    try {

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
                    BasÃ¡ndote en esta instrucciÃ³n, genera assets completos para una campaÃ±a automotriz:

    Responde SOLO con un JSON vÃ¡lido, sin bloques de cÃ³digo:
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

                let rawAllText = allResult.response.text().trim();
                // Limpiar posibles bloques markdown de la IA
                if (rawAllText.startsWith('```json')) rawAllText = rawAllText.replace(/```json/g, '').replace(/```/g, '').trim();
                else if (rawAllText.startsWith('```')) rawAllText = rawAllText.replace(/```/g, '').trim();

                const allData = JSON.parse(rawAllText)
                updatedAssets.copy = allData.copy
                updatedAssets.imagePrompt = allData.imagePrompt
                updatedAssets.videoScript = allData.videoScript

                // Generate image ASYNC to prevent Vercel timeout
                console.log('[AI] Lanzando generacion de imagenes (all)...')

                const [imgSquareAll, imgVerticalAll, imgHorizontalAll] = await Promise.all([
                    createImagePrediction(allData.imagePrompt, 1080, 1080).catch(e => { console.error('RegenAll ImgSq Err:', e); return null; }),
                    createImagePrediction(allData.imagePrompt, 1080, 1920).catch(e => { console.error('RegenAll ImgVert Err:', e); return null; }),
                    createImagePrediction(allData.imagePrompt, 1920, 1080).catch(e => { console.error('RegenAll ImgHoriz Err:', e); return null; })
                ]);

                updatedAssets.imageUrl = 'PENDING...';
                updatedAssets.images = { ...(updatedAssets.images || {}) };
                if (imgSquareAll) updatedAssets.imageUrl = 'PENDING...';

                updatedAssets.imagePendingIds = {
                    square: imgSquareAll,
                    vertical: imgVerticalAll,
                    horizontal: imgHorizontalAll
                };
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
            message: `âœ… ${elementType === 'all' ? 'Campaña' : elementType === 'copy' ? 'Copy' : elementType === 'image' ? 'Imagen' : 'Video'} regenerado exitosamente`
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
