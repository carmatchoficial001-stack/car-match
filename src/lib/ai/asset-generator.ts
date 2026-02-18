export async function generatePollinationsImage(prompt: string, width: number = 1080, height: number = 1350): Promise<string> {

    // 1. DIRECT GENERATION (Pollinations.ai)
    // This is now purely a fallback/free generator. 
    // The Replicate logic is handled in the parent function (ai-content-actions.ts)
    // to avoid circular dependencies and ensure clean fallback.

    // 2. Fallback: Pollinations.ai (Free, good quality)
    try {
        console.log('[AI-GEN] Attempting Pollinations Image...');

        // Limit prompt length to avoid URL errors (Pollinations/Browser limit)
        const safePrompt = prompt.trim().substring(0, 800)
        const encodedPrompt = encodeURIComponent(safePrompt)

        // Add random seed to ensure variety
        const randomSeed = Math.floor(Math.random() * 1000000)

        // Construct URL with high quality parameters
        // Model: flux (best for realism)
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&seed=${randomSeed}&nologo=true`

        // 🛡️ VALIDATION CHECK: Verify the URL actually works (Pollinations often throws 530/500)
        // If we don't check, Next.js Image component will crash when trying to optimize a broken link.
        try {
            const check = await fetch(imageUrl, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
            if (!check.ok) {
                console.warn(`[AI-GEN] Pollinations check failed (${check.status}). Using Stock Fallback.`);
                throw new Error(`Pollinations Status ${check.status}`);
            }
        } catch (validationErr) {
            console.warn('[AI-GEN] Pollinations unreachable. Using Stock Fallback.');
            // Fallback to a high-quality relevant Unsplash image
            // We can rotate these or select based on context if needed
            const keywords = prompt.split(' ').slice(0, 3).join(',');
            return `https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=${width}&h=${height}`;
        }

        return imageUrl
    } catch (error) {
        console.error('Error generating image URL:', error)
        // Fallback to stock image if something fails (though this is just a URL builder)
        return `https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=${width}&h=${height}`;
    }
}
