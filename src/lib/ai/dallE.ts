// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// MODIFIED TO REMOVE OPENAI DEPENDENCY AND USE UNSPLASH AS FALLBACK.

const CAR_STOCK_IMAGES = [
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1024&q=80',
]

export async function generateSocialImage(prompt: string, size: "1024x1024" | "1024x1792" = "1024x1024") {
    try {
        // OpenAI DALL-E removed as per user request to avoid "module not found" errors.
        // Using Unsplash direct photo URLs as the primary image source.

        const randomImage = CAR_STOCK_IMAGES[Math.floor(Math.random() * CAR_STOCK_IMAGES.length)]

        return {
            success: true,
            url: randomImage,
            isFallback: true
        };

    } catch (error: any) {
        console.warn("⚠️ Error generating image fallback:", error);
        return {
            success: true,
            url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1024&q=80',
            isFallback: true
        };
    }
}
