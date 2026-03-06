
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.studioMessage.count();
    console.log('StudioMessage count:', count);

    const allTables = ['User', 'StudioConversation', 'StudioMessage', 'SystemLog'];
    for (const table of allTables) {
        const c = await prisma[table.charAt(0).toLowerCase() + table.slice(1)].count();
        console.log(`${table} count:`, c);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
