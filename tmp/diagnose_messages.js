const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('\n--- LATEST 5 STUDIO MESSAGES ---');
    const messages = await prisma.studioMessage.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
    });

    for (const m of messages) {
        console.log(`\nID: ${m.id}`);
        console.log(`Role: ${m.role}`);
        console.log(`Content Snippet: ${m.content?.substring(0, 50)}`);
        console.log(`Images JSON: ${JSON.stringify(m.images, null, 2)}`);
        console.log(`CreatedAt: ${m.createdAt.toISOString()}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
