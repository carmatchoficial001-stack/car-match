'use server'

import { geminiFlashConversational } from '@/lib/ai/geminiModels'

// ─────────────────────────────────────────────────────────────
// 🎨 IMAGE CHAT — CREATIVE DIRECTOR AI
// ─────────────────────────────────────────────────────────────

/**
 * Generates a Pollinations.ai image URL from a prompt
 */
import { buildPollinationsUrl } from '@/lib/admin/utils'
import { uploadUrlToCloudinary, robustUploadToCloudinary } from '@/lib/cloudinary-server'

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

        // Check if this is the user confirming they want the idea to become a campaign
        const isConfirming = /^(s[ií]|dale|hazlo|genera|listo|ok|va|arre|lánzalo|perfecto|créala|genérala|ya|claro|adelante|procede)/i.test(lastMessage.trim())

        const prompt = `Eres el DIRECTOR CREATIVO SUPREMO de CarMatch México.
Tu personalidad: Eres apasionado, visionario, dominas la jerga creativa y el marketing digital mexicano. 
Eres un genio capaz de crear publicidad de TODO tipo para CarMatch:
- Branding y estilo de vida (lifestyle)
- Eventos y lanzamientos
- Ofertas y promociones relámpago
- Memes y contenido viral
- Fotografía profesional editorial de cualquier vehículo o situación.

Tu objetivo es platicar con el usuario en ESPAÑOL para entender su visión.
Una vez que la idea esté clara, propón un "PROMPT FINAL" detallado.

REGLAS DE INTERACCIÓN:
1. Siempre habla en ESPAÑOL.
2. Si la idea es vaga, pregunta de forma creativa.
3. Cuando el usuario diga que la idea le gusta o pida generar/hacer la imagen, responde con "PROMPT_READY".

HISTORIAL:
${contextStr}

INSTRUCCIONES DE RESPUESTA JSON:
Si vas a proponer el diseño final, responde:
{
    "type": "PROMPT_READY",
    "message": "Mensaje entusiasta en ESPAÑOL sobre la campaña que diseñaste.",
    "imagePrompt": "ULTRA DETAILED prompt in ENGLISH (Camera, lens, lighting, composition, 8k, photorealistic). This prompt will be used to generate the image later.",
    "photoCount": 11,
    "platforms": {
        "instagram_feed": { "caption": "Caption viral...", "hashtags": "#CarMatchMX ..." },
        ...
    }
}

Si estás platicando o necesitas más info, responde:
{
    "type": "CHAT",
    "message": "Tu respuesta o pregunta creativa en ESPAÑOL (máx 3 líneas)"
}

REGLA CRÍTICA: Responde ÚNICAMENTE con JSON válido.`

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
        ]) as any

        let responseText = result.response.text().trim()
        // Clean markdown wrappers
        if (responseText.startsWith('```json')) responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
        else if (responseText.startsWith('```')) responseText = responseText.replace(/```/g, '').trim()

        const data = JSON.parse(responseText)

        if (data.type === 'PROMPT_READY' && data.imagePrompt) {
            // 🔥 NEW: Upload to Cloudinary to bypass Pollinations block
            console.log('[IMAGE-CHAT] Uploading generated images to Cloudinary...')
            const imagePrompt = data.imagePrompt
            const count = Math.max(1, Math.min(25, data.photoCount || 11))
            console.log(`[IMAGE-CHAT] Generando ${count} fotos para el pack creativo...`)

            const finalImages: Record<string, string> = {}

            // Generate base sizes
            const baseSizes = [
                { key: 'square', w: 1080, h: 1080, id: 'img_0' },
                { key: 'vertical', w: 1080, h: 1920, id: 'img_1' },
                { key: 'horizontal', w: 1200, h: 628, id: 'img_2' }
            ]

            for (let i = 0; i < Math.min(count, 3); i++) {
                const size = baseSizes[i]
                const res = await robustUploadToCloudinary(buildPollinationsUrl(imagePrompt, size.w, size.h))
                if (res.success) {
                    finalImages[size.key] = res.secure_url!
                    finalImages[size.id] = res.secure_url!
                }
            }

            // Gallery variations
            if (count > 3) {
                for (let i = 3; i < count; i++) {
                    const id = `img_${i}`
                    const varPrompt = `${imagePrompt}, variation ${i}, distinct cinematic angle`
                    const res = await robustUploadToCloudinary(buildPollinationsUrl(varPrompt, 1080, 1080))
                    if (res.success) finalImages[id] = res.secure_url!
                }
            }

            return {
                success: true,
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

        // 🔥 NEW: Upload to Cloudinary
        console.log('[IMAGE-VARIATION] Uploading variation to Cloudinary...')
        const rawImages = {
            square: buildPollinationsUrl(imagePrompt, 1080, 1080),
            vertical: buildPollinationsUrl(imagePrompt, 1080, 1920),
            horizontal: buildPollinationsUrl(imagePrompt, 1200, 628),
        }

        const resSquare = await robustUploadToCloudinary(rawImages.square)
        const resVertical = await robustUploadToCloudinary(rawImages.vertical)
        const resHorizontal = await robustUploadToCloudinary(rawImages.horizontal)

        return {
            success: true,
            message: data.message || 'Variación lista',
            imagePrompt,
            images: {
                square: resSquare.success ? resSquare.secure_url! : rawImages.square,
                vertical: resVertical.success ? resVertical.secure_url! : rawImages.vertical,
                horizontal: resHorizontal.success ? resHorizontal.secure_url! : rawImages.horizontal,
            }
        }
    } catch (error: any) {
        console.error('[IMAGE-VARIATION] Error:', error)
        return { success: false, message: `❌ Error: ${error.message}` }
    }
}
