
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Checking for vehicles with null users in selection...')
    const vehicles = await prisma.vehicle.findMany({
        select: {
            id: true,
            user: {
                select: {
                    isAdmin: true
                }
            }
        }
    })

    console.log(`Fetched ${vehicles.length} vehicles.`)

    let count = 0
    for (const v of (vehicles as any)) {
        if (!v.user) {
            count++
        }
    }

    if (count > 0) {
        console.log(`CRITICAL: Found ${count} vehicles where selecting user returns null. Accessing v.user.isAdmin will crash.`)
    } else {
        console.log('All vehicles have a user associated.')
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
