import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkUserAdmin() {
    const email = 'anaorzara@gmail.com';
    const user = await prisma.user.findUnique({
        where: { email }
    });
    
    if (user) {
        console.log(`User Found:`);
        console.log(`- ID: ${user.id}`);
        console.log(`- Email: ${user.email}`);
        console.log(`- isAdmin: ${user.isAdmin}`);
        console.log(`- CreatedAt: ${user.createdAt.toISOString()}`);
    } else {
        console.log(`User ${email} not found.`);
    }
    process.exit(0);
}

checkUserAdmin().catch(console.error);
