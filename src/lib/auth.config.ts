import Google from "next-auth/providers/google"
import Facebook from "next-auth/providers/facebook"
import Twitter from "next-auth/providers/twitter"
import type { NextAuthConfig } from "next-auth"

// ⚙️ Configuración base compatible con Edge (Middleware)
export const authConfig: NextAuthConfig = {
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET,
            authorization: {
                params: {
                    access_type: "offline",
                    response_type: "code"
                }
            },
            // allowDangerousEmailAccountLinking: true, // 🔥 COMENTADO PARA FIX CRÍTICO
        }),
        Facebook({
            clientId: process.env.FACEBOOK_CLIENT_ID || process.env.AUTH_FACEBOOK_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET || process.env.AUTH_FACEBOOK_SECRET,
            // allowDangerousEmailAccountLinking: true, // 🔥 COMENTADO PARA FIX CRÍTICO
        }),
        Twitter({
            clientId: process.env.TWITTER_CLIENT_ID || process.env.AUTH_TWITTER_ID,
            clientSecret: process.env.TWITTER_CLIENT_SECRET || process.env.AUTH_TWITTER_SECRET,
            // allowDangerousEmailAccountLinking: true, // 🔥 COMENTADO PARA FIX CRÍTICO
        }),
    ],
    pages: {
        signIn: "/auth",
        error: "/auth",
    },
    session: {
        strategy: "jwt",
        maxAge: 365 * 24 * 60 * 60,
    },
    callbacks: {
        async authorized({ auth }) {
            return !!auth
        },
        async signIn({ user, account }) {
            // ✅ Login exitoso, redirigir automáticamente
            return true
        },
        async session({ session, token }) {
            if (session.user && token) {
                // @ts-ignore
                session.user.id = (token.id as string) || (token.sub as string)

                // 🔑 Admin Maestro via Environment Variable
                if (session.user.email === process.env.ADMIN_EMAIL) {
                    // @ts-ignore
                    session.user.isAdmin = true
                }
            }
            return session
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        },
        async redirect({ url, baseUrl }) {
            // Si viene de login, redirigir al feed con distribución 70/30
            if (url.includes('/api/auth/callback')) {
                const randomValue = Math.random()
                return randomValue < 0.7 ? `${baseUrl}/swipe` : `${baseUrl}/market`
            }
            // Si es relativa, usar baseUrl
            if (url.startsWith('/')) return `${baseUrl}${url}`
            // Si es del mismo dominio, permitir
            if (new URL(url).origin === baseUrl) return url
            // Por defecto, ir a home
            return baseUrl
        },
    },
    trustHost: true,
}
