export async function generatePollinationsImage(prompt: string, width: number = 1080, height: number = 1350): Promise<string> {
    try {
        // Limit prompt length to avoid URL errors (Pollinations/Browser limit)
        const safePrompt = prompt.trim().substring(0, 800)
        const encodedPrompt = encodeURIComponent(safePrompt)

        // Add random seed to ensure variety
        const randomSeed = Math.floor(Math.random() * 1000000)

        // Construct URL with high quality parameters
        // Model: flux (best for realism)
        // nologo=true to remove watermark if possible
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&seed=${randomSeed}&nologo=true&enhance=true`

        return imageUrl
    } catch (error) {
        console.error('Error generating image URL:', error)
        // Fallback to stock image if something fails (though this is just a URL builder)
        return 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1000'
    }
}
