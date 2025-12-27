
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function runTest() {
    console.log('🚀 Iniciando Prueba de Monetización CarMatch')

    // 1. Crear Usuario de Prueba
    const testEmail = `test_${Date.now()}@carmatch.com`
    console.log(`\n1. Creando usuario de prueba: ${testEmail}`)
    const user = await prisma.user.create({
        data: {
            name: 'Test User',
            email: testEmail,
            credits: 0
        }
    })
    console.log(`✅ Usuario creado. ID: ${user.id}, Créditos: ${user.credits}`)

    // 2. Publicar 1er Vehículo (Debería ser 6 meses gratis)
    console.log('\n2. Publicando 1er Vehículo...')
    const now = new Date()
    const vehicle1 = await prisma.vehicle.create({
        data: {
            userId: user.id,
            title: 'Auto Prueba 1',
            description: 'Desc',
            brand: 'Ford',
            model: 'Fiesta',
            year: 2020,
            price: 150000,
            city: 'CDMX',
            status: 'ACTIVE',
            isFreePublication: true,
            publishedAt: now,
            expiresAt: new Date(now.getFullYear(), now.getMonth() + 6, now.getDate()) // +6 meses
        }
    })
    console.log(`✅ Vehículo 1 creado. Expira: ${vehicle1.expiresAt?.toLocaleDateString()} (Esperado: +6 meses)`)

    // 3. Publicar 2do Vehículo (Debería ser 7 días gratis)
    console.log('\n3. Publicando 2do Vehículo...')
    const vehicle2 = await prisma.vehicle.create({
        data: {
            userId: user.id,
            title: 'Auto Prueba 2',
            description: 'Desc',
            brand: 'Chevrolet',
            model: 'Aveo',
            year: 2021,
            price: 180000,
            city: 'CDMX',
            status: 'ACTIVE',
            isFreePublication: false,
            publishedAt: now,
            expiresAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7) // +7 días
        }
    })
    console.log(`✅ Vehículo 2 creado. Expira: ${vehicle2.expiresAt?.toLocaleDateString()} (Esperado: +7 días)`)

    // 4. Publicar 1er Negocio (Debería ser 3 meses gratis)
    console.log('\n4. Publicando 1er Negocio...')
    const business1 = await prisma.business.create({
        data: {
            userId: user.id,
            name: 'Taller Test 1',
            category: 'TALLER',
            city: 'Mexico City',
            address: 'Calle Falsa 123',
            latitude: 19.4326,
            longitude: -99.1332,
            isFreePublication: true,
            publishedAt: now,
            expiresAt: new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()) // +3 meses
        }
    })
    console.log(`✅ Negocio 1 creado. Expira: ${business1.expiresAt?.toLocaleDateString()} (Esperado: +3 meses)`)

    // 5. Simular Compra de Crédito (+5 créditos)
    console.log('\n5. Simulando compra de paquete (5 créditos)...')
    await prisma.$transaction([
        prisma.user.update({
            where: { id: user.id },
            data: { credits: { increment: 5 } }
        }),
        prisma.creditTransaction.create({
            data: {
                userId: user.id,
                amount: 5,
                description: 'Compra de Paquete: 5 Créditos',
                details: { paymentId: 'simulated_stripe_id' }
            }
        })
    ])
    const userAfterBuy = await prisma.user.findUnique({ where: { id: user.id } })
    console.log(`✅ Créditos actuales: ${userAfterBuy?.credits}`)

    // 6. Publicar 2do Negocio (Cuesta 1 crédito)
    console.log('\n6. Publicando 2do Negocio (Debería costar 1 crédito)...')
    if ((userAfterBuy?.credits || 0) >= 1) {
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { credits: { decrement: 1 } }
            }),
            prisma.business.create({
                data: {
                    userId: user.id,
                    name: 'Refaccionaria Test 2',
                    category: 'REFACCIONES',
                    city: 'Mexico City',
                    address: 'Calle 2',
                    latitude: 19.4326,
                    longitude: -99.1332,
                    isFreePublication: false,
                    publishedAt: now,
                    expiresAt: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()) // +1 mes
                },
            }),
            prisma.creditTransaction.create({
                data: {
                    userId: user.id,
                    amount: -1,
                    description: 'Publicación negocio: Refaccionaria Test 2'
                }
            })
        ])
        console.log('✅ Negocio 2 creado con éxito.')
    } else {
        console.log('❌ Error: Créditos insuficientes (Inesperado)')
    }

    // 7. Verificar Saldo Final e Historial
    console.log('\n7. Verificando estado final...')
    const finalUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { creditTransactions: true }
    })
    console.log(`💰 Saldo Final: ${finalUser?.credits} (Esperado: 4)`)

    // Limpieza
    await prisma.user.delete({ where: { id: user.id } })
    console.log('\n✅ PRUEBA COMPLETADA y usuario de prueba eliminado.')
}

runTest()
    .catch(e => {
        console.error(e)
        // Ensure process exit even on error for the tool to capture output
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
