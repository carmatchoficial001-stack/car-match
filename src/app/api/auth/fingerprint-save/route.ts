import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { deviceHash, ipAddress, userAgent } = await request.json()

        if (!deviceHash) {
            return NextResponse.json({ error: "deviceHash is required" }, { status: 400 })
        }

        // 🛡️ REGLA: Verificar si el dispositivo ya tiene otro dueño antes de guardar
        const existingFingerprint = await prisma.digitalFingerprint.findUnique({
            where: { deviceHash }
        })

        if (existingFingerprint && existingFingerprint.userId !== session.user.id) {
            return NextResponse.json({
                error: "Este dispositivo ya está vinculado a otra cuenta.",
                code: "DEVICE_ALREADY_LINKED"
            }, { status: 403 })
        }

        // Guardar o actualizar la huella del usuario para este dispositivo
        await prisma.digitalFingerprint.upsert({
            where: { deviceHash },
            update: {
                userId: session.user.id,
                ipAddress: ipAddress || '',
                userAgent: userAgent || ''
            },
            create: {
                userId: session.user.id,
                deviceHash,
                ipAddress: ipAddress || '',
                userAgent: userAgent || ''
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error saving fingerprint:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
