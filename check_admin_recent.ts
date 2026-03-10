import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkAdminMessages() {
    const adminEmail = 'carmatchoficial001@gmail.com';
    const user = await prisma.user.findUnique({ where: { email: adminEmail } });
    
    if (!user) {
        console.log("Admin user not found.");
        process.exit(0);
    }

    const messages = await prisma.studioMessage.findMany({
        where: {
            userId: user.id,
            createdAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    console.log(`Found ${messages.length} messages from admin in the last 2 hours.`);
    messages.forEach(m => {
        console.log(`- [${m.createdAt.toISOString()}] Role: ${m.role}, Type: ${m.type}, Content: ${m.content.substring(0, 30)}...`);
    });

    process.exit(0);
}

checkAdminMessages().catch(console.error);
