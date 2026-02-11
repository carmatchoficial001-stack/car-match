// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    console.warn("⚠️ Advertencia: OPENAI_API_KEY no está definida. DALL-E no funcionará.");
}

const openai = new OpenAI({
    apiKey: apiKey,
});

export async function generateSocialImage(prompt: string, size: "1024x1024" | "1024x1792" = "1024x1024") {
    try {
        if (!apiKey) return { success: false, error: 'Falta API Key de OpenAI' };

        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: size,
            quality: "standard", // "hd" es más caro, standard está bien.
        });

        const imageUrl = response.data[0].url;
        return { success: true, url: imageUrl };

    } catch (error: any) {
        console.warn("⚠️ Error DALL-E (o sin saldo), usando alternativa GRATIS (Unsplash)...");
        // Fallback: Return a high-quality Unsplash URL based on keywords
        const keywords = prompt.split(' ').slice(0, 3).join(',');
        return {
            success: true,
            url: `https://source.unsplash.com/1024x1024/?${encodeURIComponent(keywords)},car,luxury`,
            isFallback: true
        };
    }
}
