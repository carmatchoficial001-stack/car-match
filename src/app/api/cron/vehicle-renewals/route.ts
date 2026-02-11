// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { NextRequest, NextResponse } from 'next/server'
import { processVehicleRenewals } from '@/lib/cron/vehicle-renewals'

export async function GET(request: NextRequest) {
    try {
        // Verificar cron secret
        const authHeader = request.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const result = await processVehicleRenewals()

        return NextResponse.json({
            success: true,
            ...result
        })

    } catch (error) {
        console.error('Error in vehicle renewals cron:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

