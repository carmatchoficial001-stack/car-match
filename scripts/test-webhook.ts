
import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    
    const url = 'https://carmatchapp.net/api/studio/webhook?postId=cmmp1zgc80001jy0aq7fa9akj&format=vertical&idx=0';
    
    console.log(`🚀 Simulating Fal.ai callback to ${url}...`);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'fal-ai/1.0'
            },
            body: JSON.stringify({
                request_id: "test-request-" + Date.now(),
                status: "OK",
                payload: {
                    images: [
                        {
                            url: "https://res.cloudinary.com/dnhhcnr5h/image/upload/v1741879809/test_image.jpg",
                            width: 768,
                            height: 1344,
                            content_type: "image/jpeg"
                        }
                    ]
                },
                metadata: {
                    postId: "cmmp1zgc80001jy0aq7fa9akj",
                    idx: 0,
                    format: "vertical"
                }
            })
        });
        
        const data = await response.json();
        console.log('✅ Response:', response.status, data);
        
        // Now check if a log was created in the DB
        console.log('🕵️‍♂️ Checking DB for webhook logs...');
        const logs = await prisma.systemLog.findMany({
            where: { source: 'STUDIO-WEBHOOK' },
            take: 1,
            orderBy: { createdAt: 'desc' }
        });
        
        if (logs.length > 0) {
            console.log('✨ Found log in DB:', logs[0].message, logs[0].createdAt);
        } else {
            console.log('❌ No webhook log found in DB.');
        }
    } catch (e: any) {
        console.error('💥 Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
