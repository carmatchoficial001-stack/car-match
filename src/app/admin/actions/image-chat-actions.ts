'use server'

import { geminiFlashConversational } from '@/lib/ai/geminiModels'

// ─────────────────────────────────────────────────────────────
// 🎨 IMAGE CHAT — CREATIVE DIRECTOR AI
// ─────────────────────────────────────────────────────────────

/**
 * Generates a Pollinations.ai image URL from a prompt
 */
function buildPollinationsUrl(prompt: string, width: number, height: number): string {
    const seed = Math.floor(Math.random() * 999999)
    const encoded = encodeURIComponent(prompt)
    return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`
}

/**
 * Platform configurations with their optimal image sizes
 */
const PLATFORMS = {
    instagram_feed: { name: 'Instagram Feed', w: 1080, h: 1080, icon: '📸' },
    instagram_stories: { name: 'Instagram Stories', w: 1080, h: 1920, icon: '📱' },
    tiktok: { name: 'TikTok', w: 1080, h: 1920, icon: '🎵' },
    facebook: { name: 'Facebook', w: 1200, h: 628, icon: '👤' },
    x_twitter: { name: 'X (Twitter)', w: 1600, h: 900, icon: '𝕏' },
    google_ads: { name: 'Google Ads', w: 1200, h: 628, icon: '🔍' },
    snapchat: { name: 'Snapchat', w: 1080, h: 1920, icon: '👻' },
    kwai: { name: 'Kwai', w: 1080, h: 1920, icon: '🎬' },
} as const

type PlatformKey = keyof typeof PLATFORMS

/**
 * Main chat function — Creative Director AI
 * Returns either a conversational message or a complete creative pack
 */
export async function chatWithImageDirector(
    messages: { role: 'user' | 'assistant'; content: string }[],
    targetCountry: string = 'MX'
) {
    try {
        const lastMessage = messages[messages.length - 1]?.content || ''
        const contextStr = messages.map(m =>
            `${m.role === 'user' ? 'USUARIO' : 'DIRECTOR CREATIVO'}: ${m.content}`
        ).join('\n')

        // Check if this is the user confirming they want the image
        const isConfirming = /^(s[ií]|dale|hazlo|genera|listo|ok|va|arre|lánzalo|perfecto|créala|genérala|ya|claro)/i.test(lastMessage.trim())
        const isFirstMessage = messages.filter(m => m.role === 'user').length === 1

        // If it's the first message or a direct creative request, try to generate directly
        const wantsImage = isConfirming || isFirstMessage ||
            /generar?|cre[a-z]*|imagen|foto|diseñ|haz(me)?|quiero|necesito|dame/i.test(lastMessage)

        const prompt = `Eres el DIRECTOR CREATIVO SUPREMO de CarMatch, la red social #1 de autos.
Tu personalidad: Eres apasionado, visionario, hablas con jerga creativa mexicana. 
Eres un genio del marketing visual que domina TODAS las plataformas sociales.

REGLA SUPREMA: Cuando el usuario te pida una imagen, NO LE PREGUNTES MÁS. Genera directamente.
Solo haz preguntas si la idea es MUY vaga (ej: "haz algo bonito" sin contexto).
Si el usuario da cualquier descripción mínimamente clara, GENERA DE INMEDIATO.

${wantsImage ? `
🚨 EL USUARIO QUIERE UNA IMAGEN AHORA. DEBES responder con type "IMAGE_READY".
NO hagas más preguntas. Diseña la mejor imagen posible con la información que tienes.
` : ''}

HISTORIAL:
${contextStr}

INSTRUCCIONES DE RESPUESTA:
Si vas a generar imagen, responde con JSON:
{
    "type": "IMAGE_READY",
    "message": "Mensaje entusiasta en ESPAÑOL describiendo lo que creaste (máx 2 líneas)",
    "imagePrompt": "ULTRA DETAILED prompt in ENGLISH. 4000 chars. Include: exact camera angle, lens (35mm/85mm/fisheye), lighting (golden hour/neon/studio), style (photorealistic 8k/cinematic/editorial), composition details. NEVER include text in the image. Make it STUNNING.",
    "platforms": {
        "instagram_feed": { "caption": "Caption con emojis 🔥 y 30 hashtags relevantes", "hashtags": "#CarMatch #Autos ..." },
        "instagram_stories": { "caption": "Hook viral ultra corto para stories" },
        "tiktok": { "caption": "Caption TikTok viral con slang mexicano 🚗💨", "hashtags": "#CarMatch #AutosDelujo #fyp", "audio_suggestion": "Sugerencia de tipo de música o tendencia (ej: Phonk, Lo-fi chill, Motor roar)" },
        "facebook": { "caption": "Copy persuasivo con CTA claro para Facebook", "cta": "¡Descubre más en CarMatch!" },
        "x_twitter": { "caption": "Tweet corto y provocador (máx 280 chars)", "hashtags": "#CarMatch #Autos" },
        "google_ads": { "headline": "Título Google Ads (max 30 chars)", "description": "Descripción (max 90 chars)" },
        "snapchat": { "caption": "1 línea Gen-Z + 1 emoji" },
        "kwai": { "caption": "Caption popular/urbano para Kwai", "audio_suggestion": "Vibra de audio recomendada" }
    }
}

Si necesitas más info (SOLO si la idea es extremadamente vaga), responde:
{
    "type": "CHAT",
    "message": "Tu pregunta creativa en ESPAÑOL (máx 3 líneas, directo al grano)"
}

Responde ÚNICAMENTE con JSON válido.`

        const result = await Promise.race([
            geminiFlashConversational.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: 0.9,
                    maxOutputTokens: 4096
                }
            }),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT')), 15000)
            )
        ])

        let responseText = result.response.text().trim()
        // Clean markdown wrappers
        if (responseText.startsWith('```json')) responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
        else if (responseText.startsWith('```')) responseText = responseText.replace(/```/g, '').trim()

        const data = JSON.parse(responseText)

        if (data.type === 'IMAGE_READY' && data.imagePrompt) {
            // Generate images in 3 key sizes
            const imagePrompt = data.imagePrompt
            const images = {
                square: buildPollinationsUrl(imagePrompt, 1080, 1080),
                vertical: buildPollinationsUrl(imagePrompt, 1080, 1920),
                horizontal: buildPollinationsUrl(imagePrompt, 1200, 628),
            }

            return {
                success: true,
                type: 'IMAGE_READY' as const,
                message: data.message || '¡Tu imagen está lista! 🔥',
                imagePrompt,
                images,
                platforms: data.platforms || {},
            }
        }

        return {
            success: true,
            type: 'CHAT' as const,
            message: data.message || 'Cuéntame más sobre tu idea creativa...',
        }

    } catch (error: any) {
        console.error('[IMAGE-CHAT] Error:', error)
        if (error.message === 'TIMEOUT') {
            return { success: false, type: 'CHAT' as const, message: '⏱️ La IA tardó demasiado. Intenta de nuevo con una idea más corta.' }
        }
        return { success: false, type: 'CHAT' as const, message: `❌ Error: ${error.message || 'Algo salió mal'}` }
    }
}

/**
 * Generate a variation of an existing image
 */
export async function generateImageVariation(
    originalPrompt: string,
    instruction: string
) {
    try {
        const prompt = `Original image prompt: "${originalPrompt}"
        
User wants this modification: "${instruction}"

Generate a NEW image prompt in ENGLISH that applies the modification while keeping the core concept.
The prompt must be ultra-detailed (camera, lighting, composition, style).

Respond with JSON:
{
    "imagePrompt": "new detailed prompt in ENGLISH",
    "message": "Brief description of what changed (in SPANISH)"
}`

        const result = await geminiFlashConversational.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.8, maxOutputTokens: 2048 }
        })

        let text = result.response.text().trim()
        if (text.startsWith('```json')) text = text.replace(/```json/g, '').replace(/```/g, '').trim()

        const data = JSON.parse(text)
        const imagePrompt = data.imagePrompt

        return {
            success: true,
            message: data.message || 'Variación lista',
            imagePrompt,
            images: {
                square: buildPollinationsUrl(imagePrompt, 1080, 1080),
                vertical: buildPollinationsUrl(imagePrompt, 1080, 1920),
                horizontal: buildPollinationsUrl(imagePrompt, 1200, 628),
            }
        }
    } catch (error: any) {
        console.error('[IMAGE-VARIATION] Error:', error)
        return { success: false, message: `❌ Error: ${error.message}` }
    }
}
