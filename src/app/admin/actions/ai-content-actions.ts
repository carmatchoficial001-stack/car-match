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
            Create a detailed AI image generation prompt (Midjourney/DALL-E style) for an automotive subject.
            Subject: ${topic}
            Style: ${style}
            
            Context:
            - The setting should look like a location in ${country.name} (streets, landscapes, or architecture typical of ${country.name}).
            - Lighting: Cinematic, professional automotive photography.
            - Quality: 8k, photorealistic, highly detailed.
            
            Return ONLY the prompt text.
        `

        const result = await geminiFlash.generateContent(prompt)
        const response = result.response
        return { success: true, content: response.text() }
    } catch (error) {
        console.error('Error generating prompt:', error)
        return { success: false, error: 'Error generating prompt' }
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
                "caption": "Una caption visual con emojis en ESPAÑOL. MAX 3 líneas. DEBE incluir CTA: 'Descarga CarMatch'.",
                "imagePrompt": "An AI image prompt representing the scenario (Photorealistic, 8k) - THIS CAN BE IN ENGLISH",
                "videoScript": "Un guión de video de 15 segundos en ESPAÑOL en el estilo '${randomStyle}'. Debe ser UN TEXTO CONTINUO, NO un array.",
                "videoPrompt": "A technical prompt for Google Veo 3 / Sora in ENGLISH (e.g. 'Cinematic drone shot of a car driving through Mexico City, 8k, hyperrealistic, slow motion, golden hour lighting').",
                "strategy": "Explicación en ESPAÑOL de por qué este ángulo será viral y ayudará a alcanzar la meta de 2.8B usuarios."
            }
            
            IMPORTANT FOR videoScript:
            - Must be a SINGLE STRING, not an array
            - Write it as continuous text with scene descriptions
            - In SPANISH only
            - Example format: "Escena 1: Un joven atrapado en el tráfico... Escena 2: Abre CarMatch..."
        `

        const result = await geminiFlashConversational.generateContent(prompt)
        const text = result.response.text()

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

            // Mock vehicle object for UI compatibility
            const vehicleMock = { title: `Campaña: ${randomBrandHook.hook}`, price: 0, currency: 'USD', description: campaignData.strategy }

            return { success: true, vehicle: vehicleMock, campaignData }
        } catch (e) {
            console.error('Error parsing campaign JSON:', e)
            return { success: false, error: 'Error al interpretar la respuesta de IA.' }
        }

    } catch (error) {
        console.error('Error in auto-pilot:', error)
        return { success: false, error: 'Error interno en piloto automático.' }
    }
}

// --- AI Chat for Publicity Agent ---
export async function chatWithPublicityAgent(messages: any[], targetCountry: string = 'MX') {
    try {
        const country = getCountryContext(targetCountry)

        const systemPrompt = `
            You are "CarMatch Marketing Director", an elite AI marketing strategist specialized in the automotive industry in ${country.name}.
            
            Your Goal: Help the user create viral marketing campaigns, brainstorm ideas, and write scripts/copy for CarMatch.
            
            Tone: Professional, creative, enthusiastic, data-driven.
            Language: Spanish (localized for ${country.name}).
            
            Key Capabilities:
            1. Suggest Hook angles for specific cars.
            2. Write video scripts (TikTok/Reels).
            3. Create image prompts for DALL-E/Midjourney.
            4. Analyze trends in ${country.name}.
            
            Context about CarMatch:
            - "The Tinder for Cars" (Swipe feature).
            - Map Store (Find mechanics/services).
            - Safe, Verified, Fast.
            
            Keep responses concise and actionable. Use emojis.
        `

        // Convert messages to Gemini format
        const historyParts = [
            {
                role: "user",
                parts: [{ text: systemPrompt }],
            },
            {
                role: "model",
                parts: [{ text: `Entendido. Soy el Director de Marketing de CarMatch para ${country.name}. ¿En qué puedo ayudarte hoy? 🚀` }],
            },
            ...messages.slice(0, -1).map((m: any) => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }],
            }))
        ]

        const chat = geminiFlashConversational.startChat({
            history: historyParts,
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        const lastMessage = messages[messages.length - 1].content
        const result = await chat.sendMessage(lastMessage)
        const response = result.response.text()

        return { success: true, message: response }
    } catch (error) {
        console.error('Error in chatWithPublicityAgent:', error)
        return { success: false, error: 'Error connecting to AI Agent.' }
    }
}

import { generatePollinationsImage } from '@/lib/ai/asset-generator'

// --- FULL CAMPAIGN ASSET GENERATION ---
export async function generateCampaignAssets(chatHistory: any[], targetCountry: string = 'MX') {
    try {
        const country = getCountryContext(targetCountry)

        // 1. Context Analysis Prompt - MASS DIFFUSION & ADS EDITION
        const prompt = `
            Eres un Especialista en Marketing de Alto Rendimiento. Analiza el historial de chat.
            Objetivo: Crear un PACK COMPLETO DE CAMPAÑA PUBLICITARIA DE ALTA CONVERSIÓN (Meta, Google, TikTok).
            Audiencia Objetivo: Mercado masivo (2.8B+ usuarios). Compradores de vehículos.
            
            Contexto: El usuario quiere vender/promocionar en ${country.name}.
            Slang local: ${country.slang}
            
            REQUISITO CRÍTICO DE IDIOMA:
            - TODO el contenido DEBE estar en ESPAÑOL (español de México)
            - Usa slang mexicano: ${country.slang}
            - SIN palabras en inglés excepto nombres de marca (CarMatch, Meta, TikTok, etc.)
            - primary_text, headlines, descriptions, captions, scripts - TODO en ESPAÑOL
            
            REGLAS CRÍTICAS DE FORMATO JSON:
            1. Devuelve SOLO un objeto JSON válido
            2. NO uses comas al final (trailing commas) antes de } o ]
            3. USA SOLO comillas dobles "", nunca comillas simples ''
            4. NO incluyas comentarios // o /* */
            5. NO uses caracteres especiales que rompan el JSON
            6. Asegúrate que todas las comillas estén balanceadas
            7. NO agregues texto antes del { inicial o después del } final
            
            Estructura JSON requerida:
            {
                "internal_title": "Nombre de la Campaña en ESPAÑOL",
                "imagePrompt": "Prompt fotorealista en INGLÉS (para IA de imágenes)...",
                "videoPrompt_vertical": "Prompt técnico para Veo 3 en INGLÉS (9:16 Vertical para Reels/TikTok)...",
                "videoPrompt_horizontal": "Prompt técnico para Veo 3 en INGLÉS (16:9 Cinemático para YouTube)...",
                "videoScript": "Guión viral de 15s para Reels/TikTok en ESPAÑOL. Debe ser UN TEXTO CONTINUO describiendo las escenas, NO un array. Ejemplo: 'Escena 1: Un joven frustrado... Escena 2: Abre CarMatch...'",
                
                "platforms": {
                    "meta_ads": { 
                        "primary_text": "Copy principal del anuncio en ESPAÑOL (persuasivo, enfocado en beneficios, oferta clara)",
                        "headline": "Título corto y contundente en ESPAÑOL (máximo 5-7 palabras)",
                        "description": "Descripción del enlace en ESPAÑOL (prueba social o urgencia)"
                    },
                    "facebook_marketplace": { 
                        "title": "Título optimizado SEO en ESPAÑOL para máximo alcance", 
                        "description": "Descripción detallada en ESPAÑOL con palabras clave para visibilidad" 
                    },
                    "google_ads": {
                        "headlines": ["Título 1 en ESPAÑOL (Palabra clave)", "Título 2 en ESPAÑOL (Beneficio)", "Título 3 en ESPAÑOL (Oferta)"],
                        "descriptions": ["Descripción 1 en ESPAÑOL (Características)", "Descripción 2 en ESPAÑOL (Llamado a la acción)"]
                    },
                    "tiktok_ads": { 
                        "caption": "Caption de gancho viral en ESPAÑOL con hashtags trending",
                        "script_notes": "Dirección visual en ESPAÑOL para un video publicitario de alta retención"
                    },
                    "youtube_shorts": {
                        "title": "Título clickbait en ESPAÑOL",
                        "description": "Descripción SEO en ESPAÑOL con enlaces"
                    },
                    "twitter_x": { "tweets": ["Tweet 1 en ESPAÑOL (estilo noticias/actualización)", "Tweet 2 en ESPAÑOL (hilo)"] },
                    "threads": { "text": "Gancho de venta casual y auténtico en ESPAÑOL, basado en preguntas para iniciar conversación (venta suave)." },
                    "snapchat_ads": { "headline": "Título urgente/divertido en ESPAÑOL", "caption": "Caption corto en ESPAÑOL para Spotlight" },
                    "messaging_apps": { "broadcast_message": "Texto de oferta directa y exclusiva en ESPAÑOL para Canales de WhatsApp/Telegram (Alto FOMO). Corto y urgente." }
                }
            }
            
            IMPORTANTE para videoScript:
            - Debe ser UN STRING ÚNICO, NO un array
            - Escríbelo como texto continuo con descripciones de escenas
            - Solo en ESPAÑOL
            - Formato ejemplo: "Escena 1: Un joven atrapado en el tráfico mira su teléfono frustrado. Escena 2: Abre CarMatch y sus ojos se iluminan al ver opciones increíbles. Escena 3: Hace swipe a su carro ideal y sonríe."
            
            Último mensaje del usuario: "${chatHistory[chatHistory.length - 1].content}"
        `

        console.log('[AI] Generando contenido de campaña...')

        // Use JSON mode for guaranteed valid JSON output
        const result = await geminiFlashConversational.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.8
            }
        })

        const text = result.response.text()
        console.log('[AI] Respuesta JSON recibida, parseando...')

        // With JSON mode, the response should already be valid JSON
        // Still do minimal cleanup just in case
        let jsonString = text.trim()

        let data
        try {
            data = JSON.parse(jsonString)
            console.log('[AI] JSON parseado correctamente ✓')
        } catch (parseError: any) {
            console.error('[AI] Error parseando JSON:', parseError.message)
            console.error('[AI] JSON problemático:', jsonString.substring(0, 1000))

            // Try to find the problematic area
            const errorMatch = parseError.message.match(/position (\d+)/)
            if (errorMatch) {
                const pos = parseInt(errorMatch[1])
                const contextStart = Math.max(0, pos - 100)
                const contextEnd = Math.min(jsonString.length, pos + 100)
                console.error('[AI] Contexto del error:', jsonString.substring(contextStart, contextEnd))
            }

            throw new Error(`Error crítico de parseo. Por favor intenta de nuevo con un mensaje más corto y simple.`)
        }

        // Validate required fields
        if (!data.internal_title || !data.imagePrompt || !data.platforms) {
            console.error('[AI] Campos faltantes. Data recibida:', Object.keys(data))
            throw new Error('La respuesta de IA no contiene todos los campos requeridos')
        }

        // Ensure videoScript is a string (fix [object Object] issue)
        if (data.videoScript) {
            if (Array.isArray(data.videoScript)) {
                // If it's an array, join with spaces
                data.videoScript = data.videoScript.join(' ')
                console.log('[AI] videoScript convertido de array a string')
            } else if (typeof data.videoScript === 'object' && data.videoScript !== null) {
                // If it's an object, stringify it
                data.videoScript = JSON.stringify(data.videoScript)
                console.log('[AI] videoScript convertido de object a string')
            }
        }

        console.log('[AI] JSON parseado correctamente, generando imágenes...')

        // 2. Generate Real Image URLs using Pollinations (Multi-Format)
        const basePrompt = data.imagePrompt || `Luxury car in ${country.name} street, 8k, photorealistic`

        // Parallel generation for speed with error handling
        try {
            const [imgSquare, imgVertical, imgHorizontal] = await Promise.all([
                generatePollinationsImage(basePrompt, 1080, 1080), // Square (Feed)
                generatePollinationsImage(basePrompt, 1080, 1920), // Vertical (Stories)
                generatePollinationsImage(basePrompt, 1920, 1080)  // Horizontal (Web/Thumb)
            ])

            console.log('[AI] Imágenes generadas exitosamente')

            return {
                success: true,
                assets: {
                    ...data,
                    imageUrl: imgSquare, // Default for preview
                    images: {
                        square: imgSquare,
                        vertical: imgVertical,
                        horizontal: imgHorizontal
                    }
                }
            }
        } catch (imageError: any) {
            console.error('[AI] Error generando imágenes:', imageError)
            throw new Error(`Error generando imágenes: ${imageError.message}`)
        }

    } catch (error: any) {
        console.error('[AI] Error crítico en generateCampaignAssets:', error)
        return {
            success: false,
            error: error.message || 'Error generando los assets de la campaña.',
            details: error.toString()
        }
    }
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

                // Generate new image with Replicate Flux
                console.log('[AI] Generando nueva imagen con Flux...')
                const { generateFluxImage } = await import('@/lib/ai/replicate')
                const imageUrl = await generateFluxImage(newImagePrompt)
                updatedAssets.imageUrl = imageUrl
                break

            case 'video':
                console.log('[AI] Regenerando script de video...')
                const videoPrompt = `
                    Script actual: "${currentAssets.videoScript}"
                    
                    InstrucciÃ³n del usuario: "${instruction}"
                    
                    Genera un nuevo script de video siguiendo la instrucciÃ³n.
                    - Debe ser para un video de 15-30 segundos
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
                const { generateFluxImage: genFlux } = await import('@/lib/ai/replicate')
                updatedAssets.imageUrl = await genFlux(allData.imagePrompt)
                break
        }

        // Update campaign in database
        const currentMetadata = currentAssets.editHistory ? currentAssets : { ...currentAssets, editHistory: [] }
        await prisma.publicityCampaign.update({
            where: { id: campaignId },
            data: {
                metadata: JSON.stringify({
                    generatedByAI: true,
                    assets: updatedAssets,
                    lastEdited: new Date().toISOString(),
                    editHistory: [
                        ...currentMetadata.editHistory,
                        { instruction, timestamp: new Date().toISOString() }
                    ]
                }),
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
