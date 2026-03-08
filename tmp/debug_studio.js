const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- LATEST SYSTEM LOGS ---');
    const logs = await prisma.systemLog.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' }
    });
    console.log(JSON.stringify(logs, null, 2));

    console.log('\n--- LATEST STUDIO MESSAGES ---');
    const messages = await prisma.studioMessage.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
    });
    console.log(JSON.stringify(messages, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
