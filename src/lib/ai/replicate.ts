import { generatePollinationsImage } from './asset-generator';

export async function generateFluxImage(prompt: string): Promise<string> {
    try {
        console.log('[AI-REPLICATE] Using generatePollinationsImage fallback for generateFluxImage to ensure Cloudinary upload');
        const imageUrl = await generatePollinationsImage(prompt, 1080, 1080);
        return imageUrl;
    } catch (error) {
        console.error('Error generating image URL:', error)
        return 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1000'
    }
}
