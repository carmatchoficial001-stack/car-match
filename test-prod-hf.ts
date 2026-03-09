import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function simulateProductionHF() {
    const hfKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfKey) {
        console.error('Missing HUGGINGFACE_API_KEY');
        return;
    }

    const prompt = "A high-end luxury car drifting in Mexico City at night, cinematic lighting, 8k professional photography";
    const w = 1024, h = 1024;

    console.log(`Simulating HF generation: ${w}x${h}...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
        const hfRes = await fetch('https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${hfKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: { width: w, height: h }
            }),
            signal: controller.signal
        });

        console.log('Status:', hfRes.status);
        if (!hfRes.ok) {
            const errBody = await hfRes.text();
            console.error('HF Error:', hfRes.status, errBody);
        } else {
            const buffer = await hfRes.arrayBuffer();
            console.log('Success! Buffer size:', buffer.byteLength);
        }
    } catch (e: any) {
        console.error('Fetch failed:', e.message);
    } finally {
        clearTimeout(timeoutId);
    }
}

simulateProductionHF();
