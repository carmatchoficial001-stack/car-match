
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const id = "cmmms2m7o0001l70akov9wfg9";
    const post = await prisma.socialPost.findUnique({
        where: { id }
    });
    console.log('--- POST STATUS ---');
    console.log(JSON.stringify(post, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
