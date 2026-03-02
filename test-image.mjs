import { generatePollinationsImage } from './src/lib/ai/asset-generator.js';

// Load env vars
import dotenv from 'dotenv';
dotenv.config();

console.log('Testing generatePollinationsImage...');
console.log('Expectation: Should return a Cloudinary URL or Unsplash fallback, NOT a Pollinations URL.');

async function run() {
    try {
        const url = await generatePollinationsImage('A nice red sports car, highly detailed, 8k');
        console.log('\n--- RESULT ---');
        console.log(url);

        if (url.includes('cloudinary.com')) {
            console.log('✅ SUCCESS: Cloudinary URL returned.');
        } else if (url.includes('unsplash.com')) {
            console.log('⚠️ WARNING: Unsplash fallback returned. Cloudinary might be misconfigured.');
        } else if (url.includes('pollinations.ai')) {
            console.error('❌ ERROR: Raw Pollinations URL returned! Frontend will show black image.');
        } else {
            console.log('❓ UNKNOWN URL TYPE');
        }
    } catch (e) {
        console.error('Test Failed:', e);
    }
}

run();
