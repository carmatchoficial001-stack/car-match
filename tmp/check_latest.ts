
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- LATEST 5 SOCIAL POSTS ---');
    const posts = await prisma.socialPost.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log(JSON.stringify(posts, null, 2));

    console.log('--- LATEST 5 CAMPAIGNS ---');
    const campaigns = await prisma.publicityCampaign.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log(JSON.stringify(campaigns, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
