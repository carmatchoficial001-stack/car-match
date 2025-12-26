import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🗑️  Borrando base de datos...')

    try {
        // Borrar en orden para respetar Foreign Keys
        await prisma.favorite.deleteMany({})
        await prisma.message.deleteMany({})
        await prisma.chat.deleteMany({})
        await prisma.vehicle.deleteMany({})
        await prisma.business.deleteMany({})
        await prisma.account.deleteMany({})
        await prisma.session.deleteMany({})
        await prisma.user.deleteMany({})

        console.log('✅ Base de datos reseteada con éxito!')
    } catch (error) {
        console.error('❌ Error reseteando DB:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
