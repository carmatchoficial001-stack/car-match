import { robustUploadToCloudinary } from './src/lib/cloudinary-server'
import { buildPollinationsUrl } from './src/lib/admin/utils'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

async function testUpload() {
    console.log("Testing Pollinations -> Cloudinary upload...");
    const prompt = "A red car parked on the beach, cinematic lighting, ultra-realistic 8k";
    const url = buildPollinationsUrl(prompt, 1080, 1080);

    console.log("URL:", url);

    const start = Date.now();
    const result = await robustUploadToCloudinary(url);
    const time = Date.now() - start;

    console.log(`Finished in ${time}ms`);
    console.log("Result:", JSON.stringify(result, null, 2));
}

testUpload().catch(console.error);
