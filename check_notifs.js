const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkNotifications() {
  try {
    const notifications = await prisma.notification.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        business: true,
        vehicle: true
      }
    })

    console.log('Total notifications:', await prisma.notification.count())
    console.log('Recent 10 notifications:')
    notifications.forEach(n => {
      console.log(`- [${n.type}] ${n.title} (Business: ${n.businessId ? 'YES' : 'NO'}, Vehicle: ${n.vehicleId ? 'YES' : 'NO'})`)
    })

    const businessNotifs = await prisma.notification.count({
      where: { NOT: { businessId: null } }
    })
    console.log('\nTotal business notifications in DB:', businessNotifs)

    const vehicleNotifs = await prisma.notification.count({
      where: { NOT: { vehicleId: null } }
    })
    console.log('Total vehicle notifications in DB:', vehicleNotifs)

  } catch (error) {
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

checkNotifications()
