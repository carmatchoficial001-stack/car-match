// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')

        const brands = await prisma.brand.findMany({
            where: {
                category: category || undefined,
                isActive: true
            },
            select: {
                id: true,
                name: true,
                category: true,
                logoUrl: true
            },
            orderBy: { name: 'asc' }
        })

        return NextResponse.json(brands)
    } catch (error) {
        console.error('Error fetching brands:', error)
        return NextResponse.json(
            { error: 'Failed to fetch brands' },
            { status: 500 }
        )
    }
}
