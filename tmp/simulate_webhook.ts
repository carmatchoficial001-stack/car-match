
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Get a pending post
    const post = await prisma.socialPost.findFirst({
        where: { status: 'DRAFT' },
        orderBy: { createdAt: 'desc' }
    });

    if (!post) {
        console.log('No DRAFT posts found to test.');
        return;
    }

    console.log(`Testing webhook for Post: ${post.id}`);
    
    // 2. Simulate Fal.ai payload
    const payload = {
        request_id: "test_" + Date.now(),
        status: "OK",
        payload: {
            images: [
                { url: "https://placehold.co/600x400/png" }
            ]
        },
        metadata: {
            postId: post.id,
            idx: 0,
            format: "vertical"
        }
    };

    // 3. Call the webhook locally (via the actual handler if possible, or just log the intent)
    // Since I can't easily trigger a real HTTP request to the live site with secrets, 
    // I will check if the webhook logic itself is flawed by looking at the code again.
    
    console.log('Simulated Payload:', JSON.stringify(payload, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
