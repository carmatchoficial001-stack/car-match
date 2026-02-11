// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// MODIFIED TO REMOVE OPENAI DEPENDENCY AND USE UNSPLASH AS FALLBACK.

export async function generateSocialImage(prompt: string, size: "1024x1024" | "1024x1792" = "1024x1024") {
    try {
        // OpenAI DALL-E removed as per user request to avoid "module not found" errors.
        // Using Unsplash as the primary image source for now.

        // Extract keywords from prompt for better Unsplash search
        const keywords = prompt.split(' ').slice(0, 3).join(',');

        // Return a high-quality Unsplash URL based on keywords
        return {
            success: true,
            url: `https://source.unsplash.com/1024x1024/?${encodeURIComponent(keywords)},car,luxury`,
            isFallback: true
        };

    } catch (error: any) {
        console.warn("⚠️ Error generating image fallback:", error);
        return {
            success: true,
            url: `https://source.unsplash.com/1024x1024/?car,luxury`,
            isFallback: true
        };
    }
}
