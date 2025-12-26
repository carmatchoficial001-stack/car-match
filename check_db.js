
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany({ select: { id: true, email: true, name: true } })
    console.log("Users:", users)

    const vehicles = await prisma.vehicle.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, title: true, userId: true, latitude: true, longitude: true }
    })
    console.log("Active Vehicles:", vehicles)

    // Check if there are active vehicles that don't belong to the first user (for example)
}

main()
    .catch((e) => {
        throw e
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
