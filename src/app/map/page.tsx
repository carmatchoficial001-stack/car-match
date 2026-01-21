import { prisma } from '@/lib/db'
import MapClient from './MapClient'
import { auth } from '@/lib/auth'
import { serializeDecimal } from '@/lib/serialize'
import { redirect } from 'next/navigation'

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
            images: true,
            description: true,
            services: true,
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
        <main className="min-h-screen bg-background">
            <MapClient
                businesses={serializeDecimal(businesses) as any}
                user={serializeDecimal(user) as any}
            />
        </main>
    )
}
