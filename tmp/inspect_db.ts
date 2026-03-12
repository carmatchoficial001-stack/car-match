
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- CHECKING LAST 10 SOCIAL POSTS ---');
    try {
        const posts = await prisma.socialPost.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true,
                campaignId: true,
                status: true,
                imageUrl: true,
                createdAt: true,
                // We check if this exists. If it doesn't, this script will fail.
                metadata: true 
            }
        });
        console.log(JSON.stringify(posts, null, 2));
    } catch (e: any) {
        console.error('CRITICAL: Error accessing SocialPost table (Is metadata column missing?):', e.message);
    }

    console.log('\n--- CHECKING SYSTEM LOGS (WEBHOOK ERRORS) ---');
    try {
        const logs = await prisma.systemLog.findMany({
            where: {
                OR: [
                    { source: 'STUDIO-WEBHOOK' },
                    { source: 'STUDIO-TRIGGER' },
                    { level: 'ERROR' }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        console.log(JSON.stringify(logs, null, 2));
    } catch (e: any) {
        console.error('Error fetching logs:', e.message);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
