export async function generatePollinationsImage(prompt: string): Promise<string> {
    try {
        // Encode prompt for URL
        const encodedPrompt = encodeURIComponent(prompt.trim())

        // Add random seed to ensure variety
        const randomSeed = Math.floor(Math.random() * 1000000)

        // Construct URL with high quality parameters
        // Model: flux (best for realism)
        // Size: 1080x1350 (Vertical for social media)
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1080&height=1350&model=flux&seed=${randomSeed}&nologo=true`

        return imageUrl
    } catch (error) {
        console.error('Error generating image URL:', error)
        // Fallback to stock image if something fails (though this is just a URL builder)
        return 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1000'
    }
}
