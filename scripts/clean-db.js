const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('🗑️  Starting database cleanup for PRODUCTION...')

    try {
        // 1. Delete all Users (Cascades to Vehicles, Businesses, Payments, etc.)
        console.log('Deleting all users (and their data)...')
        const userDelete = await prisma.user.deleteMany({})
        console.log(`✅ Deleted ${userDelete.count} users.`)

        // 2. Delete System Logs and Analytics that might not be linked to users
        console.log('Deleting analytics and logs...')
        const logs = await prisma.systemLog.deleteMany({})
        const search = await prisma.searchMetric.deleteMany({})
        const opps = await prisma.opportunityLog.deleteMany({})

        console.log(`✅ Deleted ${logs.count} system logs.`)
        console.log(`✅ Deleted ${search.count} search metrics.`)
        console.log(`✅ Deleted ${opps.count} opportunity logs.`)

        // IMPORTANT: check if there are other tables to clear
        // We explicitly DO NOT delete: Brand, Model, VehicleType, CreditPackage (Catalog/System Config)

        console.log('\n✨ Database cleanup complete! The app is ready for real users.')
        console.log('(Catalog data like Brands/Models was PRESERVED).')

    } catch (error) {
        console.error('❌ Error cleaning database:', error)
        process.exit(1)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
