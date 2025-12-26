'use server'

import { prisma } from '@/lib/db'
import { currentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function registerBusiness(formData: FormData) {
    const user = await currentUser()
    if (!user) throw new Error('Unauthorized')

    const name = formData.get('name') as string
    const category = formData.get('category') as string
    const description = formData.get('description') as string
    const phone = formData.get('phone') as string
    const address = formData.get('address') as string
    const lat = parseFloat(formData.get('latitude') as string)
    const lng = parseFloat(formData.get('longitude') as string)

    if (!name || !category || !lat || !lng) {
        throw new Error('Missing required fields')
    }

    const deviceFingerprintRaw = formData.get('deviceFingerprint') as string
    let deviceFingerprint: any = null
    try {
        deviceFingerprint = deviceFingerprintRaw ? JSON.parse(deviceFingerprintRaw) : null
    } catch (e) { console.error('Error parsing FP', e) }

    try {
        // 1. Check if user has existing businesses
        const existingCount = await prisma.business.count({
            where: { userId: user.id }
        })

        let expiresAt = new Date()
        let isFree = false

        // 🛡️ ANTI-FRAUDE: Verificar también por Huella Digital si está disponible (suponiendo campo en DB)
        let isFirstBusiness = existingCount === 0

        if (isFirstBusiness && deviceFingerprint) {
            try {
                // Buscamos si esta huella ya registró un negocio gratis antes
                const existingWithFingerprint = await (prisma.business as any).count({
                    where: {
                        fingerprint: deviceFingerprint, // Requiere col 'fingerprint'
                        isFreePublication: true
                    }
                })

                if (existingWithFingerprint > 0) {
                    console.log(`🛡️ Fraude negocio: Fingerprint ya usó prueba gratis.`)
                    isFirstBusiness = false
                }
            } catch (e) {
                console.warn('⚠️ No se pudo verificar fingerprint negocio en DB', e)
            }
        }

        if (isFirstBusiness) {
            // First business: Free for 1 MONTH (User Request)
            expiresAt.setMonth(expiresAt.getMonth() + 1)
            isFree = true
        } else {
            // Subsequent businesses: Cost 1 Credit for 1 Month

            // Check credits
            const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
            if (!dbUser || dbUser.credits < 1) {
                throw new Error('Insufficient credits. Additional businesses cost 1 credit/month.')
            }

            // Deduct credit
            await prisma.user.update({
                where: { id: user.id },
                data: { credits: { decrement: 1 } }
            })

            // Set expiry to 1 month
            expiresAt.setMonth(expiresAt.getMonth() + 1)
            isFree = false
        }

        await prisma.business.create({
            data: {
                userId: user.id,
                name,
                category,
                description,
                phone,
                address,
                latitude: lat,
                longitude: lng,
                isActive: true,
                isFreePublication: isFree,
                expiresAt: expiresAt,
                // Guardar fingerprint si es posible (cast para evitar error TS si falta en tipos)
                ...(deviceFingerprint ? { fingerprint: deviceFingerprint } : {}) as any
            }
        })

        revalidatePath('/map')
    } catch (error: any) {
        console.error('Error creating business:', error)
        throw new Error(error.message || 'Failed to create business')
    }

    redirect('/map')
}
