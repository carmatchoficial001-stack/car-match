import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function cleanupUnauthorized() {
    const email = 'anaorzara@gmail.com';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.log("User not found, nothing to clean.");
        process.exit(0);
    }
    
    // Delete unauthorized studio records
    const msgs = await prisma.studioMessage.deleteMany({ where: { userId: user.id } });
    const convs = await prisma.studioConversation.deleteMany({ where: { userId: user.id } });
    
    console.log(`Cleaned up ${msgs.count} messages and ${convs.count} conversations for ${email}`);
    process.exit(0);
}

cleanupUnauthorized().catch(console.error);
