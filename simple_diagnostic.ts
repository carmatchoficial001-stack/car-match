
import dotenv from 'dotenv';
dotenv.config();

// MOCK IMPORTS (We can't import TS files directly easily without compilation in some setups, 
// so we'll mock the logic here to test the CONCEPTS and API connectivity)

async function testPollinations() {
    console.log('\n--- TESTING POLLINATIONS (Fallback Image) ---');
    const prompt = 'luxury car in mexico city';
    const width = 1080;
    const height = 1080;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true&model=flux`;

    console.log(`Generated URL: ${url}`);

    // Test connectivity
    try {
        const res = await fetch(url);
        console.log(`Status: ${res.status}`);
        if (res.ok) {
            console.log('✅ POLLINATIONS OK - Image reachable');
        } else {
            console.error('❌ POLLINATIONS ERROR - Image not reachable');
        }
    } catch (e) {
        console.error('❌ POLLINATIONS NETWORK ERROR:', e);
    }
}

async function testStockVideo() {
    console.log('\n--- TESTING STOCK VIDEO (Fallback) ---');
    const VIDEO_STOCK = {
        MUSTANG: 'https://cdn.pixabay.com/video/2024/05/24/213508_large.mp4',
    };

    console.log(`Testing URL: ${VIDEO_STOCK.MUSTANG}`);
    try {
        const res = await fetch(VIDEO_STOCK.MUSTANG, { method: 'HEAD' });
        console.log(`Status: ${res.status}`);
        console.log(`Content-Type: ${res.headers.get('content-type')}`);

        if (res.ok && res.headers.get('content-type')?.includes('video')) {
            console.log('✅ STOCK VIDEO OK - Video reachable and valid');
        } else {
            console.error('❌ STOCK VIDEO ERROR - Unreachable or invalid type');
        }
    } catch (e) {
        console.error('❌ STOCK VIDEO NETWORK ERROR:', e);
    }
}

async function testReplicateEnv() {
    console.log('\n--- TESTING REPLICATE ENV ---');
    if (process.env.REPLICATE_API_TOKEN) {
        console.log('✅ REPLICATE_API_TOKEN DETECTED in .env');
        console.log(`Token starts with: ${process.env.REPLICATE_API_TOKEN.substring(0, 4)}...`);
    } else {
        console.error('❌ REPLICATE_API_TOKEN MISSING in .env - This is why AI Images fail if fallback also fails.');
    }
}

async function run() {
    console.log('=== DIAGNOSTIC START ===');
    await testReplicateEnv();
    await testPollinations();
    await testStockVideo();
    console.log('=== DIAGNOSTIC END ===');
}

run();
