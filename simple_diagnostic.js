
const https = require('https');
require('dotenv').config();

// Simple fetch wrapper for Node < 18 (just in case, though Next 15 implies Node 18+)
// Actually Node 18+ has native fetch, so we'll try that first.
// If it fails, we'll use https.

async function checkUrl(url, method = 'HEAD') {
    try {
        const response = await fetch(url, { method });
        return { ok: response.ok, status: response.status, type: response.headers.get('content-type') };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

async function testPollinations() {
    console.log('\n--- TESTING POLLINATIONS (Fallback Image) ---');
    const prompt = 'luxury car in mexico city';
    const width = 1080;
    const height = 1080;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true&model=flux`;

    console.log(`Generated URL: ${url}`);
    const res = await checkUrl(url, 'GET'); // POLLINATIONS might not support HEAD well

    if (res.ok) {
        console.log('✅ POLLINATIONS OK - Image reachable');
    } else {
        console.error(`❌ POLLINATIONS ERROR - Status: ${res.status}, Error: ${res.error}`);
    }
}

async function testStockVideo() {
    console.log('\n--- TESTING STOCK VIDEO (Fallback) ---');
    const VIDEO_STOCK = {
        MUSTANG: 'https://cdn.pixabay.com/video/2024/05/24/213508_large.mp4',
    };

    console.log(`Testing URL: ${VIDEO_STOCK.MUSTANG}`);
    const res = await checkUrl(VIDEO_STOCK.MUSTANG, 'HEAD');

    if (res.ok) {
        console.log('✅ STOCK VIDEO OK - Video reachable');
    } else {
        console.error(`❌ STOCK VIDEO ERROR - Status: ${res.status}, Error: ${res.error}`);
    }
}

async function testReplicateEnv() {
    console.log('\n--- TESTING REPLICATE ENV ---');
    if (process.env.REPLICATE_API_TOKEN) {
        console.log('✅ REPLICATE_API_TOKEN DETECTED in .env');
        console.log(`Token starts with: ${process.env.REPLICATE_API_TOKEN.substring(0, 4)}...`);
    } else {
        console.error('❌ REPLICATE_API_TOKEN MISSING in .env');
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
