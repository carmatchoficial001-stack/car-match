import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkTotalHistory() {
    console.log("=== CHECKING TOTAL STUDIO RECORDS ===");
    const convCount = await prisma.studioConversation.count();
    const msgCount = await prisma.studioMessage.count();
    const logCount = await prisma.systemLog.count({
        where: { source: { in: ['STUDIO-HISTORY', 'STUDIO-CONV', 'STUDIO-WORKER'] } }
    });
    
    console.log(`Total Conversations: ${convCount}`);
    console.log(`Total Messages: ${msgCount}`);
    console.log(`Total Studio Logs: ${logCount}`);
    
    if (msgCount > 0) {
        const latestMsgs = await prisma.studioMessage.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { user: { select: { email: true } } }
        });
        latestMsgs.forEach(m => {
            console.log(`- [${m.createdAt.toISOString()}] ${m.user.email}: ${m.role} - ${m.content.substring(0, 30)}`);
        });
    }

    if (logCount > 0) {
        const latestLogs = await prisma.systemLog.findMany({
            where: { source: { in: ['STUDIO-HISTORY', 'STUDIO-CONV', 'STUDIO-WORKER'] } },
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        latestLogs.forEach(l => {
            console.log(`- [${l.createdAt.toISOString()}] ${l.source} [${l.level}]: ${l.message}`);
        });
    }
    
    process.exit(0);
}

checkTotalHistory().catch(console.error);
