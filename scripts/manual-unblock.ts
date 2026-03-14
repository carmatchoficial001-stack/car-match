
import { PrismaClient } from '@prisma/client';
import { performFalGeneration } from '../src/app/admin/actions/studio-generate-logic';
import { uploadUrlToCloudinary } from '../src/app/lib/cloudinary-server';

const prisma = new PrismaClient();

async function unblockCampaign() {
    const campaignId = 'cmmp1zgbx0000jy0akbbwqt7e';
    const postId = 'cmmp1zgc80001jy0aq7fa9akj';

    console.log(`🚀 Starting manual unblock for Post ${postId}...`);

    try {
        const post = await prisma.socialPost.findUnique({
            where: { id: postId }
        });

        if (!post) throw new Error("Post not found");
        if (!post.aiPrompt) throw new Error("No prompt in post");

        const prompt = post.aiPrompt;
        const falKey = process.env.FAL_KEY;

        console.log(`🎨 Generating images for prompt: "${prompt.substring(0, 50)}..."`);

        // Generate 2 images (as requested in the campaign)
        const images: Record<string, string> = {};
        
        for (let i = 0; i < 2; i++) {
            console.log(`📸 Generating slide ${i}...`);
            const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${falKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt + `, high quality, variation ${i}, professional photography`,
                    image_size: { width: 768, height: 1344 },
                    num_inference_steps: 4,
                    enable_safety_checker: true
                })
            });

            if (!res.ok) throw new Error(`Fal error: ${res.status}`);
            const data = await res.json();
            const rawUrl = data.images[0].url;
            console.log(`✨ Got Fal URL: ${rawUrl}`);

            images[`img_${i}_vertical`] = rawUrl;
            if (i === 0) images['vertical'] = rawUrl;
        }

        console.log(`💾 Updating Database...`);
        await prisma.socialPost.update({
            where: { id: postId },
            data: {
                imageUrl: images['vertical'],
                status: 'PREVIEW',
                metadata: {
                    ...(post.metadata as any || {}),
                    ...images
                }
            }
        });

        await prisma.publicityCampaign.update({
            where: { id: campaignId },
            data: { imageUrl: images['vertical'] }
        });

        console.log(`✅ Campaign ${campaignId} unblocked successfully!`);

    } catch (err: any) {
        console.error(`💥 Unblock failed:`, err.message);
    } finally {
        await prisma.$disconnect();
    }
}

unblockCampaign();
