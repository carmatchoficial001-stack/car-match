
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const logs = await prisma.systemLog.findMany({
        where: {
            level: { in: ['ERROR', 'WARN'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    });
    console.log(JSON.stringify(logs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
