import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const fingerprints = await prisma.digitalFingerprint.findMany({
        include: {
            user: true
        }
    })

    console.log('--- Digital Fingerprints ---')
    console.log(`Total fingerprints: ${fingerprints.length}`)

    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true
        }
    })

    console.log('\n--- Users in DB ---')
    console.log(`Total users: ${users.length}`)
    users.forEach(u => console.log(`- ${u.email} (${u.id})`))

    const fpGroups: Record<string, string[]> = {}
    fingerprints.forEach(fp => {
        if (!fpGroups[fp.deviceHash]) fpGroups[fp.deviceHash] = []
        fpGroups[fp.deviceHash].push(fp.user.email || 'no-email')
    })

    console.log('\n--- Fingerprint Groups ---')
    Object.entries(fpGroups).forEach(([hash, emails]) => {
        console.log(`Hash: ${hash.substring(0, 8)}... matched emails: [${emails.join(', ')}]`)
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
