
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const msgs = await prisma.studioMessage.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log(JSON.stringify(msgs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
