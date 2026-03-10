import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkRecentActivity() {
    console.log("=== CHECKING RECENT STUDIO ACTIVITY ===");
    
    // Check sessions/users who have interacted lately
    const logs = await prisma.systemLog.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        orderBy: { createdAt: 'desc' },
        take: 20
    });
    
    console.log("Recent System Logs:");
    logs.forEach(l => {
        console.log(`[${l.createdAt.toISOString()}] ${l.source} [${l.level}]: ${l.message}`);
    });

    const convs = await prisma.studioConversation.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: { user: { select: { email: true, id: true } } }
    });

    console.log("\nLast 10 Conversations:");
    convs.forEach(c => {
        console.log(`- ${c.title} (User: ${c.user.email}, ID: ${c.user.id})`);
    });

    const msgs = await prisma.studioMessage.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { email: true } } }
    });

    console.log("\nLast 10 Messages:");
    msgs.forEach(m => {
        console.log(`- [${m.createdAt.toISOString()}] ${m.user.email}: ${m.role} - ${m.content.substring(0, 30)}`);
    });

    process.exit(0);
}

checkRecentActivity().catch(console.error);
