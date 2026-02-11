// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { discoverNewBrands, discoverNewModels, discoverNewVehicleTypes } from '@/lib/ai/vehicleDiscovery'


export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const logs = await prisma.autoUpdateLog.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(logs)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }


        const startTime = Date.now()
        console.log('🤖 [ADMIN-UPDATE] Iniciando escaneo manual de IA...')

        let brandsAdded = 0
        let modelsAdded = 0
        let typesAdded = 0

        // Ejecutar pasos
        brandsAdded = await discoverNewBrands()
        modelsAdded = await discoverNewModels()
        typesAdded = await discoverNewVehicleTypes()

        const executionTime = Math.round((Date.now() - startTime) / 1000)

        const log = await prisma.autoUpdateLog.create({
            data: {
                status: 'COMPLETED',
                brandsAdded,
                modelsAdded,
                typesAdded,
                executionTime,
                metadata: { trigger: 'MANUAL_ADMIN' }
            }
        })

        return NextResponse.json({
            success: true,
            added: { brandsAdded, modelsAdded, typesAdded },
            log
        })
    } catch (error: any) {
        console.error('❌ Error en actualización manual:', error)

        await prisma.autoUpdateLog.create({
            data: {
                status: 'FAILED',
                errors: error.message || 'Unknown error during manual update'
            }
        })

        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
