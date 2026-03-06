
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const logs = await prisma.systemLog.findMany({
        where: {
            message: { contains: 'Studio' }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    });
    console.log('Studio related logs:', JSON.stringify(logs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
