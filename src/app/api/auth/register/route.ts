import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { hashPassword } from "@/lib/auth"

export async function POST(request: Request) {
    try {
        const { email, password, name } = await request.json()

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email y contraseña son requeridos" },
                { status: 400 }
            )
        }

        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json(
                { error: "Este email ya está registrado" },
                { status: 400 }
            )
        }

        // Hashear contraseña
        const hashedPassword = await hashPassword(password)

        // Crear usuario
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || email.split("@")[0],
            },
        })

        return NextResponse.json(
            {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
            },
            { status: 201 }
        )
    } catch (error) {
        console.error("Error registering user:", error)
        return NextResponse.json(
            { error: "Error al crear la cuenta" },
            { status: 500 }
        )
    }
}
