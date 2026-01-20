const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('--- START DIAGNOSTIC ---')
    const users = await prisma.user.findMany({
        select: { id: true, email: true }
    })
    console.log(`Total Users: ${users.length}`)

    const fingerprints = await prisma.digitalFingerprint.findMany()
    console.log(`Total Fingerprints: ${fingerprints.length}`)

    fingerprints.forEach(fp => {
        const user = users.find(u => u.id === fp.userId)
        console.log(`Fingerprint [${fp.deviceHash.substring(0, 8)}...] -> User: ${user ? user.email : fp.userId}`)
    })

    console.log('--- END DIAGNOSTIC ---')
}

main().catch(console.error).finally(() => prisma.$disconnect())
