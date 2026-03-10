const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const today = new Date();
        today.setHours(0,0,0,0);

        console.log("Messages from today (" + today.toISOString() + "):");
        const messages = await prisma.studioMessage.findMany({
            where: {
                createdAt: { gte: today }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (messages.length === 0) {
            console.log("No messages found today.");
        } else {
            messages.forEach(msg => {
                console.log(`- [${msg.createdAt.toISOString()}] ID: ${msg.id}, Role: ${msg.role}, Status: ${msg.images?._status || 'N/A'}`);
            });
        }

        console.log("\nTesting FAL_KEY integration...");
        const falKey = process.env.FAL_KEY;
        if (!falKey) {
            console.log("FAL_KEY is missing in the environment of this script!");
        } else {
            console.log("FAL_KEY found: " + falKey.substring(0, 10) + "...");
            // Try a real fetch to Fal.ai (small test)
            const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
            
            console.log("Sending test request to Fal.ai...");
            const start = Date.now();
            const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${falKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: "A beautiful car logo",
                    image_size: { width: 512, height: 512 },
                    num_inference_steps: 4
                })
            });
            console.log(`Response status: ${res.status} (${Date.now() - start}ms)`);
            if (res.ok) {
                const data = await res.json();
                console.log("Success! Image URL received: " + data.images?.[0]?.url);
            } else {
                const err = await res.text();
                console.log("Error from Fal.ai: " + err);
            }
        }

    } catch (e) {
        console.error("Test failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
