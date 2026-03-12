
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    console.log(`--- SYSTEM LOGS (LAST 10 MINUTES - Since ${tenMinutesAgo.toISOString()}) ---`);
    const logs = await prisma.systemLog.findMany({
        where: {
            createdAt: { gte: tenMinutesAgo }
        },
        orderBy: { createdAt: 'desc' }
    });
    console.log(JSON.stringify(logs, null, 2));

    console.log('\n--- LATEST CAMPAIGNS & POSTS (LAST 10 MINUTES) ---');
    const posts = await prisma.socialPost.findMany({
        where: {
            createdAt: { gte: tenMinutesAgo }
        },
        orderBy: { createdAt: 'desc' },
        include: {
            campaign: true
        }
    });
    console.log(JSON.stringify(posts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
