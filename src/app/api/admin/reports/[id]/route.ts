import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Admin check
        const isAdminMaster = session.user.email === process.env.ADMIN_EMAIL
        if (!isAdminMaster) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { isAdmin: true }
            })
            if (!user?.isAdmin) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
        }

        const body = await request.json()
        const { action } = body // 'DISMISS' | 'RESOLVE'

        const status = action === 'DISMISS' ? 'DISMISSED' : 'ACTION_TAKEN'

        const updatedReport = await prisma.report.update({
            where: { id },
            data: { status }
        })

        return NextResponse.json(updatedReport)
    } catch (error) {
        console.error('Error updating report:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
