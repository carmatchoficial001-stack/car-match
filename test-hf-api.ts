import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function testHF() {
    const hfKey = process.env.HUGGINGFACE_API_KEY;
    console.log('HF Key exists:', !!hfKey);
    if (!hfKey) return;

    console.log('Testing HF API...');
    try {
        const hfRes = await fetch('https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${hfKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: "A futuristic car in Mexico City",
                parameters: { width: 512, height: 512 }
            })
        });

        console.log('Status:', hfRes.status);
        if (!hfRes.ok) {
            const body = await hfRes.text();
            console.log('Error Body:', body);
        } else {
            const buffer = await hfRes.arrayBuffer();
            console.log('Success! Received image buffer of size:', buffer.byteLength);
        }
    } catch (e) {
        console.error('Fetch failed:', e);
    }
}

testHF();
