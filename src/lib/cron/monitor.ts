// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { prisma } from '@/lib/db'
import { sendPushToUser } from '@/lib/pushService'

export async function processAppointmentSafety() {
    const now = new Date()

    // Buscar todas las citas aceptadas que no han terminado
    const appointments = await prisma.appointment.findMany({
        where: {
            status: 'ACCEPTED'
        },
        include: {
            chat: {
                select: {
                    buyerId: true,
                    sellerId: true,
                    vehicle: { select: { title: true } }
                }
            }
        }
    })

    const processed = []

    // Convert to for...of loop to handle async operations sequentially/safely
    for (const app of appointments) {
        const appDate = new Date(app.date)
        const diffMs = appDate.getTime() - now.getTime()
        const diffMins = Math.floor(diffMs / (1000 * 60))
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        let milestoneToNotify: string | null = null

        // 1. Lógica de Recordatorios Escalonados
        if (diffDays === 2 && !app.notifiedMilestones.includes('2_DAYS')) {
            milestoneToNotify = '2_DAYS'
        } else if (diffDays === 1 && !app.notifiedMilestones.includes('1_DAY')) {
            milestoneToNotify = '1_DAY'
        } else if (diffHours <= 12 && diffHours > 4 && !app.notifiedMilestones.includes('12_HOURS')) {
            milestoneToNotify = '12_HOURS'
        } else if (diffHours <= 4 && diffHours > 1 && !app.notifiedMilestones.includes('4_HOURS')) {
            milestoneToNotify = '4_HOURS'
        } else if (diffHours <= 1 && diffMins > 15 && !app.notifiedMilestones.includes('1_HOUR')) {
            milestoneToNotify = '1_HOUR'
        } else if (diffMins <= 15 && diffMins > 0 && !app.notifiedMilestones.includes('15_MINS')) {
            milestoneToNotify = '15_MINS'
        }

        if (milestoneToNotify) {
            const labels: Record<string, string> = {
                '2_DAYS': 'Faltan 2 días para tu cita',
                '1_DAY': 'Mañana es tu cita',
                '12_HOURS': 'Faltan 12 horas para tu encuentro',
                '4_HOURS': 'En 4 horas será tu encuentro',
                '1_HOUR': 'Tu cita es en 1 hora',
                '15_MINS': '¡Tu cita comienza en 15 minutos!'
            }

            const payload = {
                title: '📅 Recordatorio de Cita',
                body: `${labels[milestoneToNotify]} para ver: ${app.chat.vehicle.title} en ${app.location}.`,
                url: `/messages/${app.chatId}`
            }

            await sendPushToUser(app.chat.buyerId, payload)
            await sendPushToUser(app.chat.sellerId, payload)

            await prisma.appointment.update({
                where: { id: app.id },
                data: {
                    notifiedMilestones: { push: milestoneToNotify }
                }
            })

            processed.push({ id: app.id, action: 'REMINDER', milestone: milestoneToNotify })
        }

        // 2. Monitoreo Activo (Durante la Cita)
        // Se activa cuando la hora actual es >= hora de la cita
        if (now >= appDate) {
            // Activar monitoreo si no está activo
            if (!app.monitoringActive) {
                await prisma.appointment.update({
                    where: { id: app.id },
                    data: { monitoringActive: true, lastSafetyCheck: now }
                })
                // Primera alerta de seguridad inmediata al empezar
                await sendSafetyCheck(app)
                processed.push({ id: app.id, action: 'MONITOR_START' })
            }
            // Si ya estaba activo, verificar si pasaron 20 minutos desde el último check
            else if (app.lastSafetyCheck) {
                const lastCheck = new Date(app.lastSafetyCheck)
                const timeSinceLastCheck = now.getTime() - lastCheck.getTime()
                const minsSinceLastCheck = timeSinceLastCheck / (1000 * 60)

                if (minsSinceLastCheck >= 20) {
                    // Verificar si ya ignoró demasiadas veces (Auto-finalización)
                    if (app.missedResponseCount >= 2) {
                        await finalizeAppointment(app.id)
                        processed.push({ id: app.id, action: 'AUTO_FINISH' })
                    } else {
                        // Enviar nueva alerta de seguridad
                        await sendSafetyCheck(app)
                        processed.push({ id: app.id, action: 'SAFETY_CHECK' })
                    }
                }
            }
        }
    }

    return { success: true, processedCount: appointments.length, details: processed }
}

async function sendSafetyCheck(app: any) {
    const payload = {
        title: '🔒 Control de Seguridad CarMatch',
        body: `Tu encuentro por "${app.chat.vehicle.title}" está en curso. ¿Todo va bien?`,
        url: `/messages/${app.chatId}?safety_check=${app.id}`,
        tag: `safety-check-${app.id}`
    }

    // El frontend/SW manejará los botones: SOS, Sigo en Negociación, Terminado
    // Para web push, los botones se definen en el SW, aquí solo enviamos el trigger
    await sendPushToUser(app.chat.buyerId, payload)
    await sendPushToUser(app.chat.sellerId, payload)

    await prisma.appointment.update({
        where: { id: app.id },
        data: {
            lastSafetyCheck: new Date(),
            missedResponseCount: { increment: 1 }
        }
    })
}

async function finalizeAppointment(id: string) {
    await prisma.appointment.update({
        where: { id },
        data: {
            status: 'FINISHED',
            monitoringActive: false
        }
    })
    console.log(`Cita ${id} finalizada automáticamente por inactividad.`)
}
