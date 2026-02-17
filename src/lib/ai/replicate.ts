
export async function generateFluxImage(prompt: string): Promise<string> {
    try {
        // Encode prompt for URL
        const encodedPrompt = encodeURIComponent(prompt.trim())

        // Add random seed to ensure variety
        const randomSeed = Math.floor(Math.random() * 1000000)

        // Construct URL with high quality parameters
        // Model: flux (best for realism)
        // Default to square for generic usage if dimensions not specified
        const width = 1080
        const height = 1080
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&seed=${randomSeed}&nologo=true`

        return imageUrl
    } catch (error) {
        console.error('Error generating image URL:', error)
        return 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1000'
    }
}
