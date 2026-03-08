const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- LATEST SYSTEM LOGS (50) ---');
    const logs = await prisma.systemLog.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' }
    });
    console.log(JSON.stringify(logs, null, 2));

    console.log('\n--- LATEST STUDIO MESSAGES (10) ---');
    const messages = await prisma.studioMessage.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
    });

    messages.forEach(m => {
        console.log(`ID: ${m.id} | Status: ${m.images?._status} | Count: ${m.images?._photoCount} | LastUpdate: ${new Date(m.images?._lastUpdate || 0).toISOString()}`);
        // console.log(`Images: ${JSON.stringify(m.images, null, 2)}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
