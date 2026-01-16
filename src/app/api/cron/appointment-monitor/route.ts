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

