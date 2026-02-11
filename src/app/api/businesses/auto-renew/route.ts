// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { businessId } = body

        if (!businessId) {
            return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
        }

        // Buscar usuario y negocio
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                businesses: {
                    where: { id: businessId }
                }
            }
        })

        if (!user || user.businesses.length === 0) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 })
        }

        const business = user.businesses[0]

        // Verificar créditos
        if (user.credits < 1) {
            return NextResponse.json({
                error: 'Sin créditos',
                needCredits: true,
                redirectTo: '/profile?tab=credits'
            }, { status: 402 })
        }

        const now = new Date()
        const newExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

        // Cobrar crédito y renovar en transacción
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { credits: { decrement: 1 } }
            }),
            prisma.business.update({
                where: { id: businessId },
                data: {
                    isActive: true,
                    expiresAt: newExpiresAt
                }
            })
        ])

        return NextResponse.json({
            success: true,
            message: '✅ Negocio renovado por 30 días más',
            creditsRemaining: user.credits - 1,
            expiresAt: newExpiresAt
        })

    } catch (error) {
        console.error('Error auto-renewing:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
