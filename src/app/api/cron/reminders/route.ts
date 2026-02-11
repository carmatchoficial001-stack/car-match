// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { NextRequest, NextResponse } from 'next/server'
import { processAppointmentReminders } from '@/lib/cron/reminders'

// CRON: /api/cron/reminders
// Debería ejecutarse cada hora
export async function GET(request: NextRequest) {
    try {
        // Verificar autenticación del CRON (opcional, por header secreto)
        const authHeader = request.headers.get('authorization')
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const result = await processAppointmentReminders()

        return NextResponse.json({
            success: true,
            ...result
        })

    } catch (error) {
        console.error('Error en CRON Reminders:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
