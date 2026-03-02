import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: 'dnhhcnr5h',
    api_key: '358342633821457',
    api_secret: 'rGEe6Xpc4r42SoNPW1WUMK_cl-o'
});

async function test() {
    try {
        const imageUrl = `https://image.pollinations.ai/prompt/test?model=flux&seed=1245&nologo=true`;
        console.log('[AI-GEN] Fetching...', imageUrl);

        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) throw new Error(`Status HTTP ${imgRes.status}`);

        const arrayBuffer = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Str = `data:image/jpeg;base64,${buffer.toString('base64')}`;

        console.log('[AI-GEN] Base64 Ready, uploading to Cloudinary...');
        const uploadResult = await cloudinary.uploader.upload(base64Str, {
            folder: 'carmatch/ai_images',
            resource_type: 'image'
        });

        console.log('SUCCESS URL =', uploadResult.secure_url);
    } catch (err) {
        console.error('ERROR:', err);
    }
}

test();
