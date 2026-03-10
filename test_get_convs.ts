import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function testGetConvs() {
    const adminEmail = 'carmatchoficial001@gmail.com';
    const user = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!user) {
        console.log("Admin not found.");
        process.exit(1);
    }

    // This simulates the logic inside getStudioConversations
    const conversations = await prisma.studioConversation.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
        select: {
            id: true,
            title: true,
            updatedAt: true
        }
    })

    console.log(`Simulated fetch found ${conversations.length} conversations.`);
    conversations.forEach(c => {
        console.log(`- ${c.title} (${c.id})`);
    });
    
    process.exit(0);
}

testGetConvs().catch(console.error);
