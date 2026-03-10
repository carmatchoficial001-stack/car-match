import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function forceCreateHistory() {
    const adminEmail = 'carmatchoficial001@gmail.com';
    const user = await prisma.user.findUnique({ where: { email: adminEmail } });
    
    if (!user) {
        console.log(`User ${adminEmail} not found!`);
        process.exit(1);
    }
    
    console.log(`Found user ${user.email} (ID: ${user.id})`);
    
    try {
        const conv = await prisma.studioConversation.create({
            data: {
                userId: user.id,
                title: "Manual Test Conversation"
            }
        });
        console.log(`Created Conversation: ${conv.id}`);
        
        const msg = await prisma.studioMessage.create({
            data: {
                userId: user.id,
                conversationId: conv.id,
                role: 'user',
                content: 'Test message manually created',
                type: 'CHAT'
            }
        });
        console.log(`Created Message: ${msg.id}`);
        
        console.log("SUCCESS: Manual history creation worked!");
    } catch (e: any) {
        console.error("FAILURE: Manual history creation failed!");
        console.error(e.message);
    }
    process.exit(0);
}

forceCreateHistory().catch(console.error);
