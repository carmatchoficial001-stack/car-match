import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import { comparePassword } from "@/lib/password"
import { authConfig } from "./auth.config"
import { cookies } from "next/headers"

// 🚀 Instancia completa con DB para uso en Servidor (API, Server Actions)
export const {
    handlers,
    auth,
    signIn,
    signOut
} = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    callbacks: {
        ...authConfig.callbacks,
        async signIn({ user }) {
            // 🛡️ REGLA DE ORO CARMATCH: Bloqueo preventivo en el Servidor
            try {
                const cookieStore = await cookies()
                const deviceHash = cookieStore.get('device-fingerprint')?.value

                if (deviceHash) {
                    const linkedFP = await prisma.digitalFingerprint.findUnique({
                        where: { deviceHash },
                        include: { user: true }
                    })

                    if (linkedFP && linkedFP.user.email !== user.email) {
                        console.log(`🛡️ SEGURIDAD: Bloqueando entrada de ${user.email} en dispositivo de ${linkedFP.user.email}`)
                        return false // ⛔ No permite el login ni la creación de cuenta
                    }
                }
            } catch (error) {
                console.error("Error validando huella en signIn:", error)
            }
            return true
        }
    },
    debug: true, // 🔍 Debug habilitado para ver errores en Vercel logs
    events: {
        async createUser({ user }) {
            if (user.email === process.env.ADMIN_EMAIL) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { isAdmin: true }
                })
                console.log(`👑 Admin Maestro creado en DB: ${user.email}`)
            }
        },
        async signIn({ user }) {
            // Asegurar que si ya existía pero no era admin, se actualice al entrar
            if (user.email === process.env.ADMIN_EMAIL) {
                // Verificar si ya es admin para evitar updates innecesarios
                const currentUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: { isAdmin: true }
                })

                if (!currentUser?.isAdmin) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { isAdmin: true }
                    })
                }
            }
        }
    },
    providers: [
        ...authConfig.providers,
        Credentials({
            id: "credentials",
            name: "Email y Contraseña",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                })

                if (!user || !user.password) return null

                const isValidPassword = await comparePassword(
                    credentials.password as string,
                    user.password
                )

                if (!isValidPassword) return null

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                }
            },
        }),
    ]
})

export const currentUser = async () => {
    const session = await auth()
    return session?.user
}
