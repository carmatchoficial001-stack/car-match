import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkAdminUid() {
    const email = 'carmatchoficial001@gmail.com';
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
        console.log(`User found. Email: ${user.email}, ID: ${user.id}, Admin: ${user.isAdmin}`);
    } else {
        console.log("User not found.");
    }
    process.exit(0);
}

checkAdminUid().catch(console.error);
