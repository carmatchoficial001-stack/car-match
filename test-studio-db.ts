import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Checking StudioConversations...");
    const conversations = await prisma.studioConversation.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' }
    });
    console.log("Found conversations:", conversations.length);
    for (const conv of conversations) {
        console.log(`- Conv ID: ${conv.id}, Title: ${conv.title}`);
    }

    console.log("\nChecking last 5 StudioMessages...");
    const messages = await prisma.studioMessage.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
    });
    console.log("Found messages:", messages.length);
    for (const msg of messages) {
        console.log(`- Msg ID: ${msg.id}, Role: ${msg.role}, Type: ${msg.type}`);
        if (msg.images) {
            console.log(`  Images:`, JSON.stringify(msg.images, null, 2));
        }
    }

    console.log("\nChecking last 50 SystemLogs from StudioWorker...");
    const logs = await prisma.systemLog.findMany({
        where: { source: 'StudioWorker' },
        take: 50,
        orderBy: { createdAt: 'desc' }
    });
    console.log("Found logs:", logs.length);
    for (const log of logs) {
        console.log(`[${log.createdAt.toISOString()}] ${log.level}: ${log.message}`);
        if (log.metadata) {
            console.log(`  Metadata:`, JSON.stringify(log.metadata, null, 2));
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
