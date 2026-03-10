import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkUnauthorizedConv() {
    const convId = 'cmmarawd30005jm0awtvb40z4'; // No, wait, that was the userId.
    // Let me find the conv by user email.
    const user = await prisma.user.findUnique({ where: { email: 'anaorzara@gmail.com' } });
    if (!user) {
        console.log("User not found");
        process.exit(0);
    }
    
    const convs = await prisma.studioConversation.findMany({
        where: { userId: user.id },
        include: { messages: true }
    });
    
    console.log(`Found ${convs.length} conversations for ${user.email}`);
    convs.forEach(c => {
        console.log(`- Conv ID: ${c.id}, Title: ${c.title}`);
        console.log(`  Messages: ${c.messages.length}`);
        c.messages.forEach(m => {
            console.log(`    [${m.role}] ${m.content.substring(0, 50)}...`);
            if (m.images) console.log(`    Images: ${JSON.stringify(m.images)}`);
        });
    });
    process.exit(0);
}

checkUnauthorizedConv().catch(console.error);
