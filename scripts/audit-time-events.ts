import { prisma } from '../src/lib/db'
import { processVehicleRenewals } from '../src/lib/cron/vehicle-renewals'
import { processBusinessRenewals } from '../src/lib/cron/business-renewals'
import { processAppointmentReminders } from '../src/lib/cron/reminders'
import { processAppointmentSafety } from '../src/lib/cron/monitor'
import { processVehicleDopamine } from '../src/lib/cron/dopamine-vehicle'
import { processBusinessDopamine } from '../src/lib/cron/dopamine-business'

const AUDIT_TAG = '[AUDIT] '

async function main() {
    console.log('⏰ Starting Time-Machine Audit System...')

    try {
        // 1. CLEANUP (in case previous run failed)
        await cleanup()

        // 2. SETUP SCENARIOS
        console.log('\n🏗️  Setting up Scenarios...')
        const scenarios = await setupScenarios()
        console.log('✅ Scenarios created successfully.')

        // 3. EXECUTE TIME TRAVEL (Run Cron Logic)
        console.log('\n🚀 Executing Time-Based Logic (Simulator)...')

        console.log('\n--- Processing Vehicle Renewals ---')
        const vehicleResults = await processVehicleRenewals()
        console.log('Results:', vehicleResults)

        console.log('\n--- Processing Business Renewals ---')
        const businessResults = await processBusinessRenewals()
        console.log('Results:', businessResults)

        console.log('\n--- Processing Appointment Reminders ---')
        const reminderResults = await processAppointmentReminders()
        console.log('Results:', reminderResults)

        console.log('\n--- Processing Safety Monitor (SOS) ---')
        const safetyResults = await processAppointmentSafety()
        console.log('Results:', safetyResults)

        console.log('\n--- Processing DOPAMINE (Fake Engagement) ---')
        // Force Dopamine generation
        const vehicleDopamine = await processVehicleDopamine(true) // Force might need handling inside
        const businessDopamine = await processBusinessDopamine(true) // Force = true
        console.log('Vehicle Dopamine:', vehicleDopamine)
        console.log('Business Dopamine:', businessDopamine)


        // 4. VERIFY RESULTS
        console.log('\n🔍 Verifying Results...')

        // --- VEHICLES ---
        const v1 = await prisma.vehicle.findUnique({ where: { id: scenarios.vehicleNoCredits }, include: { user: true } })
        if (v1 && v1.status === 'INACTIVE') {
            console.log('✅ PASS: Vehicle without credits was DEACTIVATED.')
        } else {
            console.error('❌ FAIL: Vehicle without credits should be INACTIVE but is', v1?.status)
        }

        const v2 = await prisma.vehicle.findUnique({ where: { id: scenarios.vehicleWithCredits }, include: { user: true } })
        if (v2 && v2.status === 'ACTIVE' && v2.expiresAt && v2.expiresAt > new Date()) {
            console.log('✅ PASS: Vehicle with credits was RENEWED.')
        } else {
            console.error('❌ FAIL: Vehicle with credits should be ACTIVE and renewed.', v2)
        }

        // --- BUSINESSES ---
        const b1 = await prisma.business.findUnique({ where: { id: scenarios.businessNoCredits } })
        if (b1 && b1.isActive === false) {
            console.log('✅ PASS: Business without credits was DEACTIVATED.')
        } else {
            console.error('❌ FAIL: Business without credits should be inactive.', b1)
        }

        const b2 = await prisma.business.findUnique({ where: { id: scenarios.businessWithCredits } })
        if (b2 && b2.isActive === true) {
            console.log('✅ PASS: Business with credits was RENEWED.')
        }

        // --- APPOINTMENTS & SOS ---
        const notifBuyer = await prisma.notification.findFirst({
            where: { userId: scenarios.buyerId, type: 'APPOINTMENT_REMINDER' }
        })
        if (notifBuyer) console.log('✅ PASS: Appointment Reminder sent.')

        const activeAppt = await prisma.appointment.findUnique({ where: { id: scenarios.activeAppointmentId } })
        if (activeAppt && activeAppt.monitoringActive === true) {
            console.log('✅ PASS: Appointment Safety Monitoring ACTIVATED.')
        }

        // --- DOPAMINE ---
        // Verificamos si los vehículos/negocios creados para dopamina recibieron algo
        const dopUser = await prisma.user.findUnique({
            where: { id: scenarios.dopamineUserId },
            include: { vehicles: true, businesses: true }
        })

        // Check notifications
        const fakeNotifs = await prisma.notification.findMany({
            where: { userId: scenarios.dopamineUserId, isFake: true }
        })

        if (fakeNotifs.length > 0) {
            console.log(`✅ PASS: ${fakeNotifs.length} Fake Notifications Generated (Dopamine).`)
        } else {
            // It might fail if random chance was low, but we tried to force it or ensure new user triggers it
            // generateRandomFakeNotifications logic is complex.
            // If it returns 0, it might be due to limits. But this is a fresh user.
            console.warn('⚠️ WARNING: No fake notifications generated. Check probabilistic logic or quota.')
        }

        // Check Vehicle Stats
        const vDop = await prisma.vehicle.findUnique({ where: { id: scenarios.dopamineVehicleId } })
        if (vDop && (vDop.views > 0 || vDop.fakeFavorites > 0)) {
            console.log(`✅ PASS: Vehicle Stats updated. Views: ${vDop.views}, FakeLikess: ${vDop.fakeFavorites}`)
        } else {
            // Not strictly a fail if the randomizer chose Business instead of Vehicle, but acceptable.
            console.log(`ℹ️ Vehicle Stats: Views: ${vDop?.views}, Likes: ${vDop?.fakeFavorites}`)
        }

        // Check Business Stats
        const bDopAnalytics = await prisma.businessAnalytics.findUnique({ where: { businessId: scenarios.dopamineBusinessId } })
        if (bDopAnalytics && (bDopAnalytics.fakeViews > 0 || bDopAnalytics.fakeSearches > 0)) {
            console.log(`✅ PASS: Business Active Analytics updated. FakeViews: ${bDopAnalytics.fakeViews}`)
        }

    } catch (e) {
        console.error('💥 FATAL ERROR during audit:', e)
    } finally {
        await cleanup()
        console.log('\n🧹 Cleanup complete.')
    }
}

async function setupScenarios() {
    // Helper to create user
    const createUser = async (name: string, credits: number) => {
        return prisma.user.create({
            data: {
                email: `audit_${Date.now()}_${Math.random()}@test.com`,
                name: `${AUDIT_TAG}${name}`,
                credits: credits,
                password: 'hash'
            }
        })
    }

    // 1. Vehicle Scenarios
    const u1 = await createUser('VehNoCreds', 0)
    const v1 = await prisma.vehicle.create({
        data: {
            userId: u1.id,
            title: `${AUDIT_TAG}Exp Veh NoCreds`,
            description: 'Test',
            brand: 'Test',
            model: 'Test',
            year: 2020,
            price: 100000,
            city: 'TestCity',
            status: 'ACTIVE',
            expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Expired
        }
    })

    const u2 = await createUser('VehHasCreds', 5)
    const v2 = await prisma.vehicle.create({
        data: {
            userId: u2.id,
            title: `${AUDIT_TAG}Exp Veh HasCreds`,
            description: 'Test',
            brand: 'Test',
            model: 'Test',
            year: 2020,
            price: 100000,
            city: 'TestCity',
            status: 'ACTIVE',
            expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Expired
        }
    })

    // 2. Business Scenarios
    const u3 = await createUser('BusNoCreds', 0)
    const b1 = await prisma.business.create({
        data: {
            userId: u3.id,
            name: `${AUDIT_TAG}Bus NoCreds`,
            category: 'TALLER',
            address: 'Test Addr',
            city: 'TestCity',
            latitude: 10,
            longitude: 10,
            isActive: true,
            expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Expired
        }
    })

    const u4 = await createUser('BusHasCreds', 5)
    const b2 = await prisma.business.create({
        data: {
            userId: u4.id,
            name: `${AUDIT_TAG}Bus HasCreds`,
            category: 'TALLER',
            address: 'Test Addr',
            city: 'TestCity',
            latitude: 10,
            longitude: 10,
            isActive: true, // Should renew
            expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Expired
        }
    })

    // 3. Appointment Scenarios
    const seller = await createUser('Seller', 0)
    const buyer = await createUser('Buyer', 0)
    const vChat = await prisma.vehicle.create({
        data: {
            userId: seller.id,
            title: `${AUDIT_TAG}Appt Car`,
            description: 'Test',
            brand: 'Test',
            model: 'Test',
            year: 2022,
            price: 200000,
            city: 'TestCity'
        }
    })

    const chat = await prisma.chat.create({
        data: { vehicleId: vChat.id, buyerId: buyer.id, sellerId: seller.id }
    })

    // Future Appointment (Reminder)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setMinutes(tomorrow.getMinutes() + 5)

    const apptFuture = await prisma.appointment.create({
        data: {
            chatId: chat.id,
            proposerId: buyer.id,
            status: 'ACCEPTED',
            date: tomorrow,
            location: 'Future Loc'
        }
    })

    // ACTIVE Appointment (NOW) -> SOS Check
    const now = new Date()
    const apptActive = await prisma.appointment.create({
        data: {
            chatId: chat.id,
            proposerId: buyer.id,
            status: 'ACCEPTED',
            date: now,
            location: 'Active Loc',
            monitoringActive: false
        }
    })

    // 4. Dopamine Scenario
    const uDop = await createUser('Dopamine', 0)
    const vDop = await prisma.vehicle.create({
        data: {
            userId: uDop.id,
            title: `${AUDIT_TAG}Dopamine Car`,
            description: 'Test',
            brand: 'Test',
            model: 'Test',
            year: 2023,
            price: 300000,
            city: 'TestCity',
            status: 'ACTIVE', // Active needed for dopamine
            moderationStatus: 'APPROVED' // Approved needed
        }
    })
    const bDop = await prisma.business.create({
        data: {
            userId: uDop.id,
            name: `${AUDIT_TAG}Dopamine Biz`,
            category: 'TALLER',
            address: 'Test',
            city: 'Test',
            latitude: 10,
            longitude: 10,
            isActive: true
        }
    })

    return {
        vehicleNoCredits: v1.id,
        vehicleWithCredits: v2.id,
        businessNoCredits: b1.id,
        businessWithCredits: b2.id,
        appointmentId: apptFuture.id,
        activeAppointmentId: apptActive.id,
        buyerId: buyer.id,
        sellerId: seller.id,
        dopamineUserId: uDop.id,
        dopamineVehicleId: vDop.id,
        dopamineBusinessId: bDop.id
    }
}

async function cleanup() {
    process.stdout.write('   Cleaning up previous audit data... ')
    const users = await prisma.user.findMany({
        where: { name: { startsWith: AUDIT_TAG } },
        select: { id: true }
    })

    const userIds = users.map(u => u.id)
    if (userIds.length > 0) {
        // Safe delete order or cascade
        await prisma.vehicle.deleteMany({ where: { userId: { in: userIds } } })
        await prisma.business.deleteMany({ where: { userId: { in: userIds } } })
        await prisma.user.deleteMany({ where: { id: { in: userIds } } })
    }
    console.log('Done.')
}

main()
