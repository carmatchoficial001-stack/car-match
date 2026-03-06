/**
 * Helper to build Image URLs for consistent image generation
 * Supports multiple providers: pollinations (default/free), huggingface (free with token)
 */
export function buildImageUrl(prompt: string, width: number, height: number, provider: 'pollinations' | 'huggingface' = 'pollinations'): string {
    const seed = Math.floor(Math.random() * 999999)
    const encoded = encodeURIComponent(prompt)

    if (provider === 'huggingface') {
        // Hugging Face doesn't use simple GET URLs for inference normally via their router
        // but some community proxies or specific structures exist. 
        // For standard HF, we'll return a special string that the server action detects
        // to handle the POST request correctly.
        return `HF_MODEL:black-forest-labs/FLUX.1-schnell:${encoded}`
    }

    // Default: Pollinations
    return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`
}

/**
 * Legacy helper for Pollinations
 */
export function buildPollinationsUrl(prompt: string, width: number, height: number): string {
    return buildImageUrl(prompt, width, height, 'pollinations')
}
