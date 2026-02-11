// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

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
        }),
        Facebook({
            clientId: process.env.FACEBOOK_CLIENT_ID || process.env.AUTH_FACEBOOK_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET || process.env.AUTH_FACEBOOK_SECRET,
        }),
        Twitter({
            clientId: process.env.TWITTER_CLIENT_ID || process.env.AUTH_TWITTER_ID,
            clientSecret: process.env.TWITTER_CLIENT_SECRET || process.env.AUTH_TWITTER_SECRET,
        }),
    ],
    pages: {
        signIn: "/auth",
        error: "/auth",
    },
    session: {
        strategy: "jwt",
        maxAge: 10 * 365 * 24 * 60 * 60, // 10 years (Session locking)
    },

    callbacks: {
        async authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth
            const pathname = nextUrl.pathname

            // 🔓 RUTAS PÚBLICAS (Wikipedia Mode): Accesibles para Google y Guests
            const publicPaths = [
                '/',
                '/market',
                '/swipe',
                '/map',
                '/map-store',
                '/autos/',
                '/autos-en/',
                '/autos/cluster/',
                '/comprar/',
                '/comparar/',
                '/negocio/',
                '/vehicle/',
                '/negocios/',
                '/business/',
                '/auth',
                '/privacy',
                '/terms'
            ]

            const isPublicPath = publicPaths.some(path =>
                pathname === path || pathname.startsWith(path)
            )

            // Si es ruta pública, permitimos siempre (para SEO)
            if (isPublicPath) return true

            // Si no es pública, requerimos login
            return isLoggedIn
        },
        async signIn() {
            return true
        },
        async session({ session, token }) {
            if (session.user && token) {
                // @ts-ignore
                session.user.id = (token.id as string) || (token.sub as string)
                session.user.image = (token.picture as string) || session.user.image
                session.user.name = (token.name as string) || session.user.name

                if (session.user.email === process.env.ADMIN_EMAIL) {
                    session.user.isAdmin = true
                }
            }
            return session
        },
        async jwt({ token, user, trigger, session }) {
            if (user && user.id) token.id = user.id
            if (trigger === "update") {
                if (session?.image) token.picture = session.image
                if (session?.name) token.name = session.name
            }
            return token
        },
        async redirect({ url, baseUrl }) {
            // Allows relative callback URLs
            if (url.startsWith("/")) return `${baseUrl}${url}`

            // If already on a feed, don't redirect away
            if (url.includes('/swipe') || url.includes('/market') || url.includes('/map')) {
                return url
            }

            // Always redirect to a deterministic path if possible, 
            // or let the middleware handle the weight from the root.
            const urlObj = new URL(url, baseUrl)
            if (urlObj.origin === baseUrl) return url

            return baseUrl
        },
    },
    trustHost: true,
}
