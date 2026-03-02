const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: 'dnhhcnr5h',
    api_key: '358342633821457',
    api_secret: 'rGEe6Xpc4r42SoNPW1WUMK_cl-o'
});

async function test() {
    try {
        const text = "<html><body><h1>Cloudflare Captcha</h1></body></html>";
        const base64Str = `data:image/jpeg;base64,${Buffer.from(text).toString('base64')}`;

        console.log('[AI-GEN] Uploading fake HTML base64 buffer to Cloudinary...');
        const uploadResult = await cloudinary.uploader.upload(base64Str, {
            folder: 'carmatch/ai_images',
            resource_type: 'image'
        });

        console.log('SUCCESS URL =', uploadResult.secure_url);
    } catch (err) {
        console.error('ERROR (Cloudinary properly rejected the fake image!):', err.message);
    }
}

test();
