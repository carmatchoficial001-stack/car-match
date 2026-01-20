import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
    try {
        const { deviceHash } = await request.json()

        if (!deviceHash) {
            return NextResponse.json({ error: "deviceHash is required" }, { status: 400 })
        }

        // Buscar si este dispositivo ya tiene un dueño
        const fingerprint = await prisma.digitalFingerprint.findUnique({
            where: { deviceHash },
            include: { user: { select: { email: true } } }
        })

        if (fingerprint) {
            return NextResponse.json({
                isLinked: true,
                email: fingerprint.user.email
            })
        }

        return NextResponse.json({ isLinked: false })
    } catch (error) {
        console.error("Error checking fingerprint:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
