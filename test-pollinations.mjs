import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary only if keys exist
cloudinary.config({
    cloud_name: 'dnhhcnr5h',
    api_key: '358342633821457',
    api_secret: 'rGEe6Xpc4r42SoNPW1WUMK_cl-o'
})

async function test() {
    try {
        const prompt = 'A beautiful red sports car, 4k';
        const safePrompt = prompt.trim().substring(0, 800)
        const encodedPrompt = encodeURIComponent(safePrompt)
        const randomSeed = 12345;
        const width = 1080;
        const height = 1080;

        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&seed=${randomSeed}&nologo=true`

        console.log('[AI-GEN] Downloading Pollinations image to Vercel memory...', imageUrl);

        const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
        if (!imgRes.ok) throw new Error(`Pollinations returned ${imgRes.status}`);

        const arrayBuffer = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Str = `data:image/jpeg;base64,${buffer.toString('base64')}`;

        console.log('[AI-GEN] Uploading base64 buffer to Cloudinary...', base64Str.substring(0, 50) + '...');
        const uploadResult = await cloudinary.uploader.upload(base64Str, {
            folder: 'carmatch/ai_images',
            resource_type: 'image'
        });

        console.log('SUCCESS:', uploadResult.secure_url);
    } catch (err) {
        console.error('ERROR:', err);
    }
}

test();
