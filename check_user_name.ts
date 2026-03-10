import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkUserName() {
    const email = 'anaorzara@gmail.com';
    const user = await prisma.user.findUnique({
        where: { email },
        select: { name: true }
    });
    console.log(`User Name: ${user?.name || 'N/A'}`);
    process.exit(0);
}

checkUserName().catch(console.error);
