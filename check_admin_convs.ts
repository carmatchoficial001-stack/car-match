import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkAdminConvs() {
    const adminEmail = 'carmatchoficial001@gmail.com';
    const user = await prisma.user.findUnique({ where: { email: adminEmail } });
    
    if (!user) {
        console.log("Admin user not found.");
        process.exit(0);
    }

    const convs = await prisma.studioConversation.findMany({
        where: { userId: user.id }
    });

    console.log(`Found ${convs.length} conversations for admin.`);
    convs.forEach(c => {
        console.log(`- ID: ${c.id}, Title: ${c.title}, Created: ${c.createdAt.toISOString()}`);
    });

    process.exit(0);
}

checkAdminConvs().catch(console.error);
