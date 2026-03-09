import { robustUploadToCloudinary } from './src/lib/cloudinary-server';
import dotenv from 'dotenv';

dotenv.config();

async function diagnostic() {
    console.log("Starting Image Generation Diagnostic...");
    const testPrompt = "A futuristic car in Mexico City, cinematic lighting, 8k";
    const model = "black-forest-labs/FLUX.1-schnell";
    const encodedPrompt = encodeURIComponent(testPrompt);
    const mockUrl = `HF_MODEL:${model}:${encodedPrompt}`;

    console.log(`Testing robustUploadToCloudinary with ${mockUrl}`);
    const result = await robustUploadToCloudinary(mockUrl);

    if (result.success) {
        console.log("✅ SUCCESS! Image uploaded to Cloudinary:", result.secure_url);
    } else {
        console.error("❌ FAILURE:", result.error);
    }
}

diagnostic().catch(console.error);
