/**
 * Helper to build Image URLs for consistent image generation
 * Strictly uses Hugging Face (FLUX) via HF_MODEL string detection in server actions.
 */
export function buildImageUrl(prompt: string, width: number, height: number): string {
    const encoded = encodeURIComponent(prompt)
    // We return a special string that the server action detects
    // to handle the POST request correctly to Hugging Face.
    return `HF_MODEL:black-forest-labs/FLUX.1-schnell:${encoded}`
}
