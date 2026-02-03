import { prisma } from '@/lib/db'
import MapClient from './MapClient'

// 💰 OPTIMIZACIÓN: Dynamic import para Mapbox
export const dynamic = 'force-dynamic'

export default async function MapPage() {
    const session = await auth()

    const user = session?.user?.email
        ? await prisma.user.findUnique({ where: { email: session.user.email } })
        : null

    // Fetch active businesses OR businesses owned by the current user (if logged in)
    let whereCondition: any = {
        isActive: true
    }

    if (user?.id) {
        whereCondition = {
            OR: [
                { isActive: true },
                { userId: user.id }
            ]
        }
    }

    const businesses = await prisma.business.findMany({
        where: whereCondition,
        take: 500, // optimization: don't load 5000 at once on mobile
        select: {
            id: true,
            name: true,
            category: true,
            latitude: true,
            longitude: true,
            city: true,
            state: true,
            address: true,
            street: true,
            streetNumber: true,
            colony: true,
            images: true,
            description: true,
            services: true,
            phone: true,
            whatsapp: true,
            telegram: true,
            website: true,
            facebook: true,
            instagram: true,
            tiktok: true,
            hours: true,
            additionalPhones: true,
            is24Hours: true,
            hasEmergencyService: true,
            hasHomeService: true,
            isSafeMeetingPoint: true,
            hasMiniWeb: true,
            userId: true,
            user: {
                select: {
                    name: true,
                    image: true
                }
            }
        }
    })

    return (
        <div className="h-full w-full bg-background">
            <MapClient
                businesses={serializeDecimal(businesses) as any}
                user={serializeDecimal(user) as any}
            />
        </div>
    )
}
