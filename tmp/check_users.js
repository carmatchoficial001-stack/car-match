const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const userCount = await prisma.user.count();
        console.log(`Total Users: ${userCount}`);

        const latestUsers = await prisma.user.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, email: true, createdAt: true }
        });
        console.log('Latest 5 Users:');
        console.log(JSON.stringify(latestUsers, null, 2));

        const studioConvCount = await prisma.studioConversation.count();
        console.log(`Total StudioConversations: ${studioConvCount}`);

        const studioMsgCount = await prisma.studioMessage.count();
        console.log(`Total StudioMessages: ${studioMsgCount}`);

    } catch (e) {
        console.error('DB ERROR:', e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
