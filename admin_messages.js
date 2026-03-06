
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const userId = 'cmkooyxr30000js0auooig5e4';
    const msgs = await prisma.studioMessage.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: 10
    });
    console.log('Admin messages:', JSON.stringify(msgs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
