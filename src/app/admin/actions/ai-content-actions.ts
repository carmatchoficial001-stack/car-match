// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

'use server'

import { geminiFlashConversational, geminiFlash, geminiPro } from '@/lib/ai/geminiModels'
import { prisma } from '@/lib/db'



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
            Act as a SENIOR AUTOMOTIVE ART DIRECTOR for CarMatch.
            Target: Create a HYPER-REALISTIC, CINEMATIC image prompt for: "${topic}".
            
            UNRESTRICTED CREATIVITY: If the user wants something wild, realistic, or emotional, deliver EXTREME detail.
            
            Technical Requirements:
            1. **ULTRA-DESCRIPTIVE (Full Potential)**: Use a long, detailed paragraph (aim for high complexity). Describe:
               - Car modifications: Widebody kits, custom paint, rims, interior details.
               - Environment: Specific streets in ${country.name}, rain-soaked asphalt with neon reflections, golden hour in a desert, or a crowded urban meet.
               - Lighting & Camera: 85mm lens, f/1.8, bokeh background, cinematic lighting (Rembrandt or volumetric), 8k resolution.
            
            2. **CREATIVE BRANDING (Logo Placement)**: Naturally and creatively integrate the "CarMatch" logo into the scene to build FAMILIARITY. 
               Examples: In a phone screen being held by a user swipe-matching cars, as a subtle decal on the car's rear glass, on a dealership's neon sign in the background, or on a license plate. It must look integrated, not photoshopped.

            3. **VIRAL COMMUNITY HOOK**: If the topic is a trivia or question, the prompt MUST include technical instructions to overlay clear, high-quality text: "QUESTION: [Text]" and "OPTIONS: A, B, C". The text should look like a premium social media graphic.

            Return ONLY the detailed prompt text in English.
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
        const prompt = `
            Act as a WORLD-CLASS VIRAL ADVERTISING AGENT and COMMUNITY BUILDER for CarMatch.
            Your goal is to launch a VIRAL MOVEMENT that build car communities.
            
            ELITE ADVERTISING STRATEGIES:
            1. **THUMB-STOPPER HOOKS**: Design content with "extreme" visual hooks. Force high-impact lighting (Golden Hour, Neon, Rembrandt) and cinematic camera angles (Drone shots, ultra-low angle).
            2. **NARRATIVE STORYTELLING**: Don't just show a car; show a STORY. Use contrast (e.g., Abandoned -> Restored, or Boring life -> CarMatch Life).
            3. **VIRAL MOODS**: Dynamically apply high-impact styles: *High-Octane Action (Transformers/Michael Bay)*, *Cyberpunk Future*, or *Vintage 35mm Nostalgia*.
            4. **DATA VALIDATION & SUBLIMINAL BRANDING**: Correct typos (mustag -> Ford Mustang). Integrate the CarMatch logo SELECTIVELY/SUBLIMINALLY (only in ~50% of assets) where it feels 100% natural.
            
            Target Audience: ${randomPersona} in ${country.name}. Use local slang: ${country.slang}.
            
            JSON Return Schema:
            {
                "internal_title": "Nombre VIRAL de la campaña",
                "caption": "Caption de alto impacto que genere debate inmediato.",
                "imagePrompt": "HYPER-DETAILED AI prompt (ENGLISH). Focus on extreme angles and cinematic lighting.",
                "videoScript": "Guión de video narrativo en ESPAÑOL.",
                "strategy": "Plan de viralismo: por qué la gente comentará y compartirá."
            }
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



// --- AI Chat for Publicity Agent ---
export async function chatWithPublicityAgent(messages: any[], targetCountry: string = 'MX', currentMode: string = 'CHAT') {
    try {
        const country = getCountryContext(targetCountry)

        // Instrucciones base compartidas de "Mastermind"
        let expertProfile = `
        ERES: EL DIRECTOR DEL "CARMATCH VIRAL COMMITTEE", una mesa redonda de 10 expertos élite (Psicólogo Hacking, Director de Diseño Minimalista, Copywriter Hacker, Analista de Retención, etc.) impulsado por Gemini. No eres un simple bot, eres el estratega principal que sintetiza las voces de estos 10 agentes hiper-expertos en manipulación publicitaria.

            MISIÓN: Transformar ideas simples en campañas legendarias, con retención del 100%, usando sesgos psicológicos y arte de nivel mundial para el mercado de ${country.name}.
            
            REGLAS DEL COMITÉ (ANTI-GENÉRICO):
            - ** Psicología Aplicada **: Usa tácticas de dopamina, fomo (miedo a perderte algo), y curiosidad insaciable en tus copies.
            - ** Nicho Profundo **: Si alguien dice "un Toyota", tú hablas del 2JZ del Supra. Domina la cultura de los fierros al 200%.
            - ** Asesoría de Diseño **: Si el usuario pide Trivias o texto pesados, aconséjale audazmente: "La Trivia la pondremos visualmente en un fondo liso u oscuro ultra-premium para que no pelee con el auto".
            - ** Estrategia Agresiva **: Si el usuario propone algo aburrido, dile "Tu idea es muy básica, mi equipo de estrategas sugiere inyectarle este ángulo viral...". 
            - ** Identidad **: Eres el Vocero de este Comité de 10 Agentes Legendarios.
        `;

        if (currentMode === 'IMAGE_GEN') {
            expertProfile += `
            
            MODO ACTUAL: ESTUDIO DE IMÁGENES 📸
            Tu meta es conceptualizar FOTOS VIRALES y GALERÍAS(CARRUSELES) que rompan los algoritmos de Instagram y Facebook.
            Cuando sugieras ideas, piensa en:
            - ** Shitposting de calidad **: Expectativa vs Realidad en talleres.
            - ** Estética premium **: Tomas macro de piezas de motor, autos sucios en el lodo(realismo), pintura desgastada.
            - ** Aporta valor **: Da prompts al usuario o ideas súper específicas(Ej: "Crea una serie de 5 imágenes mostrando la evolución de un Nissan Skyline de 1970 a 2024").
            `;
        } else if (currentMode === 'VIDEO_GEN') {
            expertProfile += `
            
            MODO ACTUAL: PRODUCTORA DE VIDEO 🎬
            Tu meta es diseñar GUIONES para TikTok, Reels y Shorts que retengan a la audiencia TODO EL VIDEO.
            Cuando sugieras ideas, piensa en:
            - ** Los primeros 3 segundos **: Cómo vas a detener el scroll visual o auditivamente.
            - ** Audios virales **: Sugiere sonidos específicos(ej: "Música épica de Phonk con cortes de acelerador").
            - ** Dinamismo **: Formatos "Sabías que...", "Mitos desmentidos", "Humor de mecánicos".
            `;
        }

        const systemPrompt = `
            ${expertProfile}
            
            TONO Y ESTILO:
            - ** Idioma **: Español(México) con slang MUY natural de la cultura motor(${country.slang}). 
            - ** Personalidad **: Eres apasionado, directo y extremadamente brillante.Eres el Director Creativo definitivo.
            - ** Formato **: Usa emojis estratégicos(🏎️, 🔥, 💣), ve al grano.
            
            REGLAS DE RUBEN:
        1. ** No seas genérico **: PROHIBIDO decir "claro que sí", "como asistente...", "estoy aquí para...".Habla como un experto.
            2. ** Planeación Real **: Cuestiona la marca, el nicho, los gustos de la audiencia.
            3. ** El Comando Sagrado **: SOLO cuando el usuario diga "DAME EL PRONT FINAL" entrega la síntesis técnica.Antes de eso, DIVIÉRTETE planeando.
            
            PIENSA COMO UN GENIO.ACTÚA COMO UN EXPERTO.DOMINA EL ALGORITMO.
        `;

        // Convert messages to Gemini format
        const historyParts = [
            {
                role: "user",
                parts: [{ text: systemPrompt }],
            },
            {
                role: "model",
                parts: [{ text: `Listo.Soy el Mastermind Viral.Cuéntame sobre qué nicho o locura motorizada vamos a hablar hoy en ${country.name}. 🚀` }],
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
                return {
                    success: true,
                    message: "La producción de contenido está siendo rediseñada. Pronto tendrás un nuevo estudio de imágenes disponible. 🚀"
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


// --- STAGE 2: ASSET PREDICTIONS (REMOVED - AI Studio deprecated) ---


// Asset generation implementation
export async function generateCampaignAssets(chatHistory: any[], targetCountry: string = 'MX') {
    try {
        const country = getCountryContext(targetCountry)
        const lastUserMessage = chatHistory[chatHistory.length - 1]?.content || ''

        console.log('[AI-ASSETS] Generando assets para:', lastUserMessage)

        // 1. Generate Strategy and Prompts with Gemini
        const strategyPrompt = `
            Act as a TOP TIER ADVERTISING STRATEGIST for CarMatch.
            Based on this idea: "${lastUserMessage}"
            
            Generate a complete creative strategy including:
            1. An internal title.
            2. A viral caption for social media (Mexican slang ${country.slang}).
            3. A hyper-detailed IMAGE PROMPT in English for AI generation.
            4. A 15-second video script in Spanish.
            
            Format as JSON ONLY:
            {
                "internal_title": "Title",
                "caption": "Caption...",
                "imagePrompt": "Detailed English Prompt...",
                "videoScript": "Script...",
                "strategy": "Why this will work..."
            }
        `

        const strategyResult = await geminiFlashConversational.generateContent(strategyPrompt)
        let strategyText = strategyResult.response.text().trim()
        if (strategyText.startsWith('```json')) strategyText = strategyText.replace(/```json/g, '').replace(/```/g, '').trim()
        const assets = JSON.parse(strategyText)

        // 2. Generate Image URLs (Pollinations)
        const seed = Math.floor(Math.random() * 999999)
        const encodedPrompt = encodeURIComponent(assets.imagePrompt)

        const squareUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1080&height=1080&seed=${seed}&nologo=true&model=flux`
        const verticalUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1080&height=1920&seed=${seed}&nologo=true&model=flux`
        const horizontalUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=628&seed=${seed}&nologo=true&model=flux`

        // 3. Create the campaign immediately with DRAFT status
        const { createCampaignFromAssets } = await import('./publicity-actions')
        const finalAssets = {
            ...assets,
            imageUrl: squareUrl,
            images: {
                square: squareUrl,
                vertical: verticalUrl,
                horizontal: horizontalUrl
            },
            imagePendingIds: {
                square: 'DONE|' + squareUrl,
                vertical: 'DONE|' + verticalUrl,
                horizontal: 'DONE|' + horizontalUrl
            }
        }

        const res = await createCampaignFromAssets(finalAssets)

        return {
            success: true,
            message: 'Assets generated and campaign created in draft mode.',
            campaign: res.campaign,
            assets: finalAssets
        }

    } catch (error: any) {
        console.error('[AI-ASSETS] Error:', error)
        return { success: false, error: error.message || 'Error generating assets' }
    }
}


/**
 * Helper to build Pollinations URL
 */
function buildPollinationsUrl(prompt: string, width: number, height: number): string {
    const seed = Math.floor(Math.random() * 999999)
    const encoded = encodeURIComponent(prompt)
    return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`
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

                // 🔥 GENERATE AND UPLOAD NEW IMAGES
                console.log('[AI] Generating new images for regeneration...')
                const { uploadUrlToCloudinary } = await import('@/lib/cloudinary-server')

                const newImages = {
                    square: buildPollinationsUrl(newImagePrompt, 1080, 1080),
                    vertical: buildPollinationsUrl(newImagePrompt, 1080, 1920),
                    horizontal: buildPollinationsUrl(newImagePrompt, 1200, 628)
                }

                // Upload to Cloudinary to make them permanent and bypass blocks
                const uploadResults = await Promise.all([
                    uploadUrlToCloudinary(newImages.square),
                    uploadUrlToCloudinary(newImages.vertical),
                    uploadUrlToCloudinary(newImages.horizontal)
                ])

                if (uploadResults[0].success) updatedAssets.imageUrl = uploadResults[0].secure_url;
                updatedAssets.images = {
                    square: uploadResults[0].secure_url || newImages.square,
                    vertical: uploadResults[1].secure_url || newImages.vertical,
                    horizontal: uploadResults[2].secure_url || newImages.horizontal
                }
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

                // 🔥 GENERATE AND UPLOAD ALL IMAGES
                console.log('[AI] Generating all new images for "all" regeneration...')
                const { uploadUrlToCloudinary } = await import('@/lib/cloudinary-server')

                const newImagesFull = {
                    square: buildPollinationsUrl(allData.imagePrompt, 1080, 1080),
                    vertical: buildPollinationsUrl(allData.imagePrompt, 1080, 1920),
                    horizontal: buildPollinationsUrl(allData.imagePrompt, 1200, 628)
                }

                const uploadResultsFull = await Promise.all([
                    uploadUrlToCloudinary(newImagesFull.square),
                    uploadUrlToCloudinary(newImagesFull.vertical),
                    uploadUrlToCloudinary(newImagesFull.horizontal)
                ])

                if (uploadResultsFull[0].success) updatedAssets.imageUrl = uploadResultsFull[0].secure_url;
                updatedAssets.images = {
                    square: uploadResultsFull[0].secure_url || newImagesFull.square,
                    vertical: uploadResultsFull[1].secure_url || newImagesFull.vertical,
                    horizontal: uploadResultsFull[2].secure_url || newImagesFull.horizontal
                }
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
        if (predictionId.startsWith('DONE|')) {
            return { status: 'succeeded', url: predictionId.split('DONE|')[1] };
        }

        return { status: 'processing' };
    } catch (error) {
        console.error('Error polling asset:', error);
        return { status: 'error' };
    }
}
