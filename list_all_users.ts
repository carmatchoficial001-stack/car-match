import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function listAllUsers() {
    const users = await prisma.user.findMany({
        select: { email: true, isAdmin: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 20
    });
    
    console.log("Last 20 Users:");
    users.forEach(u => {
        console.log(`- ${u.email} (Admin: ${u.isAdmin}, Created: ${u.createdAt.toISOString()})`);
    });
    process.exit(0);
}

listAllUsers().catch(console.error);
