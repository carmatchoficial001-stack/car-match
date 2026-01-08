import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { discoverNewBrands, discoverNewModels, discoverNewVehicleTypes } from '@/lib/ai/vehicleDiscovery'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max

export async function GET(request: NextRequest) {
    const startTime = Date.now()

    // Verificar token de seguridad de Vercel Cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🤖 [AUTO-UPDATE] Iniciando actualización automática de vehículos...')

    let brandsAdded = 0
    let modelsAdded = 0
    let typesAdded = 0
    const errors: string[] = []

    try {
        // El modelo se maneja automáticamente a través de safeGenerateContent

        // PASO 1: Descubrir nuevas marcas
        console.log('📡 Paso 1/3: Buscando nuevas marcas...')
        try {
            brandsAdded = await discoverNewBrands()
        } catch (error: any) {
            console.error('❌ Error descubriendo marcas:', error)
            errors.push(`Brands: ${error.message}`)
        }

        // PASO 2: Descubrir nuevos modelos
        console.log('📡 Paso 2/3: Buscando nuevos modelos...')
        try {
            modelsAdded = await discoverNewModels()
        } catch (error: any) {
            console.error('❌ Error descubriendo modelos:', error)
            errors.push(`Models: ${error.message}`)
        }

        // PASO 3: Descubrir nuevos tipos
        console.log('📡 Paso 3/3: Buscando nuevos tipos de vehículos...')
        try {
            typesAdded = await discoverNewVehicleTypes()
        } catch (error: any) {
            console.error('❌ Error descubriendo tipos:', error)
            errors.push(`Types: ${error.message}`)
        }

        const executionTime = Date.now() - startTime
        const status = errors.length > 0 ? 'partial' : 'success'

        // Guardar log
        await prisma.autoUpdateLog.create({
            data: {
                status,
                brandsAdded,
                modelsAdded,
                typesAdded,
                errors: errors.length > 0 ? errors.join('; ') : null,
                executionTime,
                metadata: {
                    timestamp: new Date().toISOString(),
                    model: 'gemini-flash-latest'
                }
            }
        })

        console.log('✨ [AUTO-UPDATE] Completado!')
        console.log(`  📊 Nuevas marcas: ${brandsAdded}`)
        console.log(`  📊 Nuevos modelos: ${modelsAdded}`)
        console.log(`  📊 Nuevos tipos: ${typesAdded}`)
        console.log(`  ⏱️ Tiempo: ${executionTime}ms`)

        return NextResponse.json({
            success: true,
            stats: {
                brandsAdded,
                modelsAdded,
                typesAdded,
                executionTime
            },
            errors: errors.length > 0 ? errors : undefined,
            timestamp: new Date().toISOString()
        })

    } catch (error: any) {
        console.error('💥 [AUTO-UPDATE] Error crítico:', error)

        await prisma.autoUpdateLog.create({
            data: {
                status: 'failed',
                brandsAdded: 0,
                modelsAdded: 0,
                typesAdded: 0,
                errors: error.message,
                executionTime: Date.now() - startTime
            }
        })

        return NextResponse.json(
            {
                success: false,
                error: error.message
            },
            { status: 500 }
        )
    }
}
