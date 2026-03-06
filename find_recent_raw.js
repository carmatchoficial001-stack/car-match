
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const result = await prisma.$queryRaw`SELECT id, content, "imagePrompt", images FROM "StudioMessage" WHERE "createdAt" > ${oneHourAgo}`;
    console.log('Recent messages:', JSON.stringify(result, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
