import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Debes iniciar sesión para registrar tu negocio' }, { status: 401 })
        }

        const body = await request.json()
        const {
            name,
            category,
            address,
            street,
            streetNumber,
            colony,
            city,
            state,
            phone,
            description,
            latitude,
            longitude
        } = body

        if (!name || !category || !address || !city) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
        }

        // ═══ REGLAS DE PUBLICACIÓN - NEGOCIOS ═══
        // ⚠️ CRITICAL: DO NOT MODIFY THESE RULES WITHOUT EXPLICIT APPROVAL
        // ⚠️ PRODUCTION CONFIGURATION - MUST REMAIN STABLE
        // Rule 1: First business is FREE for 3 months
        // Rule 2: Subsequent businesses require credit immediately
        // 1er negocio: 3 MESES GRATIS → luego 1 crédito/mes
        // 2do+ negocio: 1 crédito/mes desde el inicio (si no hay créditos, se crea INACTIVO)

        // Verificar cuántos negocios tiene el usuario
        const totalBusinessesCount = await prisma.business.count({
            where: { userId: session.user.id }
        })

        // Verificar si el usuario es administrador
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, credits: true, isAdmin: true, email: true }
        })

        const isAdmin = user?.isAdmin || user?.email === process.env.ADMIN_EMAIL

        const isFirstBusiness = totalBusinessesCount === 0

        // Calcular fecha de expiración y estado
        const now = new Date()
        let expirationDate = new Date()
        let isActive = false

        if (isAdmin) {
            // 👑 Admin: 10 AÑOS GRATIS y SIEMPRE ACTIVO
            expirationDate.setFullYear(now.getFullYear() + 10)
            isActive = true
        } else if (isFirstBusiness) {
            // 🎁 Primer negocio: 3 MESES GRATIS y ACTIVO
            expirationDate.setMonth(now.getMonth() + 3)
            isActive = true
        } else {
            // 🪙 Segundo en adelante: Requiere crédito
            if (user && user.credits > 0) {
                // ✅ Tiene créditos: Descontar 1 y activar por 30 días
                await prisma.user.update({
                    where: { id: session.user.id },
                    data: { credits: { decrement: 1 } }
                })
                expirationDate.setDate(now.getDate() + 30)
                isActive = true
            } else {
                // ❌ No tiene créditos: Se crea INACTIVO y vencido
                expirationDate = now // Vence hoy mismo
                isActive = false
            }
        }

        const business = await prisma.business.create({
            data: {
                userId: session.user.id,
                name,
                category,
                address,
                street: street || null,
                streetNumber: streetNumber || null,
                colony: colony || null,
                city: city, // Mandatory now
                state: state || null,
                phone,
                description,
                latitude: latitude || 0, // Idealmente geocodificado
                longitude: longitude || 0,
                isActive: isActive,
                isFreePublication: isFirstBusiness,
                expiresAt: expirationDate
            }
        })

        return NextResponse.json({
            success: true,
            businessId: business.id,
            message: 'Negocio registrado con éxito. ¡Tienes 3 meses gratis!'
        })

    } catch (error) {
        console.error('Error registering business:', error)
        return NextResponse.json({ error: 'Error interno al registrar negocio' }, { status: 500 })
    }
}
