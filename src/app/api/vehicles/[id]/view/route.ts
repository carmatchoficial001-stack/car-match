import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { trackRealView } from '@/lib/realNotifications'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth()
        const { id } = await params
        const vehicleId = id

        await trackRealView(session?.user?.id || null, vehicleId, 'vehicle')

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error tracking vehicle view:', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
