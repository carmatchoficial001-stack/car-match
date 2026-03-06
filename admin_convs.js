
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const userId = 'cmkooyxr30000js0auooig5e4';
    const convs = await prisma.studioConversation.findMany({
        where: { userId: userId }
    });
    console.log('Admin conversations:', JSON.stringify(convs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
