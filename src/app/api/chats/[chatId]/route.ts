
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { chatId } = await params

        const chat = await prisma.chat.findUnique({
            where: { id: chatId },
            include: {
                buyer: { select: { id: true, name: true, image: true, email: true } },
                seller: { select: { id: true, name: true, image: true, email: true } },
                vehicle: {
                    select: {
                        id: true,
                        title: true,
                        images: true,
                        price: true,
                        status: true,
                        user: {
                            select: { id: true, name: true, image: true }
                        }
                    }
                }
            }
        })

        if (!chat) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
        }

        if (chat.buyerId !== session.user.id && chat.sellerId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        return NextResponse.json(chat)
    } catch (error) {
        console.error('Error fetching chat:', error)
        return NextResponse.json({ error: 'Internal User Error' }, { status: 500 })
    }
}
