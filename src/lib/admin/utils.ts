/**
 * Helper to build Pollinations URL for consistent image generation
 */
export function buildPollinationsUrl(prompt: string, width: number, height: number): string {
    const seed = Math.floor(Math.random() * 999999)
    const encoded = encodeURIComponent(prompt)
    // Using model=flux for better quality as requested in previous sessions
    return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`
}
