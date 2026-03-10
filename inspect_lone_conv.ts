import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function inspectLoneConv() {
    const conv = await prisma.studioConversation.findFirst({
        include: { user: { select: { email: true } } }
    });
    
    if (conv) {
        console.log("Found Conversation:");
        console.log(`- ID: ${conv.id}`);
        console.log(`- Title: ${conv.title}`);
        console.log(`- User: ${conv.user.email}`);
        console.log(`- Created At: ${conv.createdAt.toISOString()}`);
        console.log(`- Updated At: ${conv.updatedAt.toISOString()}`);
    } else {
        console.log("No conversation found.");
    }
    process.exit(0);
}

inspectLoneConv().catch(console.error);
