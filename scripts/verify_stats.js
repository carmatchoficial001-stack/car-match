
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('--- Verifying Real Stats ---')

    const totalUsers = await prisma.user.count()
    const completedPayments = await prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true, creditsAdded: true }
    })

    const totalRevenue = Number(completedPayments._sum.amount || 0)
    const creditsPurchased = completedPayments._sum.creditsAdded || 0

    console.log(`Total Users: ${totalUsers}`)
    console.log(`Real Revenue: ${totalRevenue}`)
    console.log(`Credits Purchased: ${creditsPurchased}`)

    if (totalRevenue === totalUsers * 15 && totalUsers > 0 && totalRevenue > 0) {
        console.warn('⚠️ WARNING: Revenue still matches the old simulated formula (totalUsers * 15). Check logic.')
    } else {
        console.log('✅ Success: Revenue is NOT using the fake formula.')
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
