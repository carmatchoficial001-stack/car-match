import { Business } from '@prisma/client'

/**
 * Calcula la fecha de expiración para un nuevo negocio
 * Primer negocio: 3 MESES GRATIS
 * Siguientes: null (requiere crédito para activar)
 */
export function calculateBusinessExpiration(isFirstBusiness: boolean): Date | null {
    if (isFirstBusiness) {
        // Primer negocio: 3 MESES GRATIS
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 3)
        return expiresAt
    }

    // Siguientes negocios: requieren crédito inmediatamente
    // Se establece expiración de 1 mes cuando se consume el crédito
    return null
}

/**
 * Verifica si un negocio está activo y visible
 */
export function isBusinessActive(business: Business): boolean {
    // Si está marcado como inactivo, no mostrar
    if (!business.isActive) return false

    // Si no tiene fecha de expiración, necesita crédito activo
    // (esto se manejará en el cron job y panel de control)
    if (!business.expiresAt) return false

    // Si tiene fecha de expiración, verificar que no haya pasado
    const now = new Date()
    const expires = new Date(business.expiresAt)

    return now < expires
}

/**
 * Calcula días restantes hasta expiración
 */
export function getDaysUntilExpiration(business: Business): number | null {
    if (!business.expiresAt) return null

    const now = new Date()
    const expires = new Date(business.expiresAt)
    const diffTime = expires.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
}

/**
 * Renueva un negocio por 1 mes más (cuando se consume un crédito)
 */
export function renewBusinessForOneMonth(currentExpiresAt: Date | null): Date {
    const baseDate = currentExpiresAt && new Date(currentExpiresAt) > new Date()
        ? new Date(currentExpiresAt) // Si aún no expiró, extender desde fecha actual
        : new Date() // Si ya expiró, empezar desde ahora

    baseDate.setMonth(baseDate.getMonth() + 1)
    return baseDate
}

/**
 * Determina el estado del negocio para mostrar en UI
 */
export function getBusinessStatus(business: Business): {
    status: 'active' | 'expiring_soon' | 'expired' | 'needs_credit'
    message: string
    daysRemaining: number | null
} {
    const daysRemaining = getDaysUntilExpiration(business)

    if (!business.isActive) {
        return {
            status: 'expired',
            message: 'Inactivo',
            daysRemaining
        }
    }

    if (!business.expiresAt) {
        return {
            status: 'needs_credit',
            message: 'Requiere crédito para activar',
            daysRemaining: null
        }
    }

    if (daysRemaining === null || daysRemaining < 0) {
        return {
            status: 'expired',
            message: 'Expirado',
            daysRemaining: 0
        }
    }

    if (daysRemaining <= 7) {
        return {
            status: 'expiring_soon',
            message: `Expira en ${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'}`,
            daysRemaining
        }
    }

    return {
        status: 'active',
        message: `Activo (${daysRemaining} días restantes)`,
        daysRemaining
    }
}
