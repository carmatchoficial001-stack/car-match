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
            Act as an AI VIDEO PROMPT ENGINEER for Google Veo / Sora.
            Create a highly technical video generation prompt for: "${topic}".
            
            Context: "${country.name}" style settings.
            Style: ${style}.
            
            Technical Requirements:
            - Camera: Drone shot / Tracking shot / Macro (choose best).
            - Lighting: Golden hour / Neon / Studio / Overcast.
            - Quality: 8k, photorealistic, highly detailed, slow motion.
            - Dynamics: High motion blur, wind effects, dust, reflections.
            
            Return ONLY the raw prompt text (English).
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
            
            IMPORTANT:
            - DO NOT promote a specific single car. Promote the APP/PLATFORM.
            - If the style is "Showcase", showcase the APP INTERFACE or a montage of cool cars available.
            - ATTITUDE: Aggressive growth, high energy, "FOMO".
            - **RULE**: "People don't read". Keep text minimal, visual, and punchy.
            
            Return a JSON object with:
            1. "caption": A visual, emoji-rich caption. MAX 3 lines. MUST include CTA: "Descarga CarMatch".
            2. "imagePrompt": An AI image prompt representing the scenario or the app solution (Photorealistic, 8k).
            3. "videoScript": A 15-second viral video script in the "${randomStyle}" style. Designed for high retention.
            4. "videoPrompt": A technical prompt optimized for Google Veo 3 / Sora. (e.g. "Cinematic drone shot of a [Car Model] driving through [Location], 8k, hyperrealistic, slow motion, golden hour lighting").
            5. "strategy": Why this specific angle will go viral and help reach the 2.8B user goal.
        `

        const result = await geminiFlashConversational.generateContent(prompt)
        const text = result.response.text()

        // Clean up markdown code blocks if present
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim()

        try {
            const campaignData = JSON.parse(jsonString)
            // Mock vehicle object for UI compatibility
            const vehicleMock = { title: `Campaña: ${randomBrandHook.hook}`, price: 0, currency: 'USD', description: campaignData.strategy }

            return { success: true, vehicle: vehicleMock, campaignData }
        } catch (e) {
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

        // 1. Context Analysis Prompt
        // 1. Context Analysis Prompt - MASS DIFFUSION & ADS EDITION
        const prompt = `
            Act as a Senior Performance Marketer. Analyze the chat history.
            Goal: Create a HIGH-CONVERSION GLOBAL AD CAMPAIGN PACK (Meta, Google, TikTok).
            Target Audience: Mass Market (2.8B+ users). Access to vehicle buyers.
            
            Context: The user wants to sell/promote in ${country.name}.
            
            Return a STRICT JSON object with these exact keys:
            
            {
                "internal_title": "Campaign Name",
                "imagePrompt": "Photorealistic prompt...",
                "videoPrompt": "Veo 3 technical prompt...",
                "videoScript": "Viral 15s script...",
                
                "platforms": {
                    "meta_ads": { 
                        "primary_text": "Main ad copy (persuasive, benefit-driven, clear offer)",
                        "headline": "Short, punchy headline (5-7 words max)",
                        "description": "Link description (Social proof or urgency)"
                    },
                    "facebook_marketplace": { 
                        "title": "SEO Optimized Title for maximum reach", 
                        "description": "Detailed description with keywords for search visibility" 
                    },
                    "google_ads": {
                        "headlines": ["Headline 1 (Keyword)", "Headline 2 (Benefit)", "Headline 3 (Offer)"],
                        "descriptions": ["Description 1 (Features)", "Description 2 (Call to Action)"]
                    },
                    "tiktok_ads": { 
                        "caption": "Viral hook caption with trending hashtags",
                        "script_notes": "Visual direction for a high-retention video ad"
                    },
                    "youtube_shorts": {
                        "title": "Clickbaity Title",
                        "description": "SEO description with links"
                    },
                    "twitter_x": { "tweets": ["Tweet 1 (News/Update style)", "Tweet 2 (Thread)"] }
                }
            }
            
            Last User Input: "${chatHistory[chatHistory.length - 1].content}"
        `

        const result = await geminiFlashConversational.generateContent(prompt)
        const text = result.response.text()
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim()

        const data = JSON.parse(jsonString)

        // 2. Generate Real Image URL using Pollinations
        // We use the prompt generated by Gemini to get a real image
        const generatedImageUrl = await generatePollinationsImage(data.imagePrompt || `Luxury car in ${country.name} street, 8k, photorealistic`)

        return {
            success: true,
            assets: {
                ...data,
                imageUrl: generatedImageUrl
            }
        }

    } catch (error) {
        console.error('Error generating assets:', error)
        return { success: false, error: 'Error generando los assets de la campaña.' }
    }
}
