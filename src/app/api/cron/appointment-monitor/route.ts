import { NextResponse } from 'next/server'
import { processAppointmentSafety } from '@/lib/cron/monitor'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get('secret')

    if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const result = await processAppointmentSafety()
        return NextResponse.json({ ...result })
    } catch (error) {
        console.error('Error in appointment monitor:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
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
