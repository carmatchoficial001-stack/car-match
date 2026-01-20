const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const usersCount = await prisma.user.count()
    const fpCount = await prisma.digitalFingerprint.count()
    console.log(`USERS: ${usersCount}, FINGERPRINTS: ${fpCount}`)

    const allFPs = await prisma.digitalFingerprint.findMany({
        include: { user: { select: { email: true } } }
    })

    allFPs.forEach(fp => {
        console.log(`[${fp.deviceHash.substring(0, 8)}] -> ${fp.user.email}`)
    })
}

main().catch(console.error).finally(() => prisma.$disconnect())
