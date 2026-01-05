import { prisma } from '@/lib/db'
import MapClient from '../map/MapClient'
import { auth } from '@/lib/auth'
import { serializeDecimal } from '@/lib/serialize'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function MapStorePage({ searchParams }: { searchParams: any }) {
    const session = await auth()

    if (!session?.user) {
        redirect('/auth')
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! }
    })

    if (!user) {
        redirect('/auth')
    }

    // Fetch active businesses OR businesses owned by the current user (even if inactive)
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
        include: {
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
