// Automotive fallback images (Unsplash direct photo URLs - always work)
const AUTOMOTIVE_FALLBACKS = [
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1469285994282-454cbe0daa37?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1485291571150-772bcfc10da5?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1080&q=80',
]

function getRandomFallback(): string {
    return AUTOMOTIVE_FALLBACKS[Math.floor(Math.random() * AUTOMOTIVE_FALLBACKS.length)]
}

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
            const check = await fetch(imageUrl, { method: 'HEAD', signal: AbortSignal.timeout(4000) });
            if (!check.ok) {
                console.warn(`[AI-GEN] Pollinations check failed (${check.status}). Using Stock Fallback.`);
                throw new Error(`Pollinations Status ${check.status}`);
            }
        } catch (validationErr) {
            console.warn('[AI-GEN] Pollinations unreachable. Using automotive stock fallback.');
            return getRandomFallback();
        }

        return imageUrl
    } catch (error) {
        console.error('Error generating image URL:', error)
        // Fallback to a high-quality automotive stock image
        return getRandomFallback();
    }
}
