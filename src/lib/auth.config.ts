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
                    prompt: "select_account",
                    access_type: "offline",
                    response_type: "code"
                }
            },
            allowDangerousEmailAccountLinking: true,
        }),
        Facebook({
            clientId: process.env.FACEBOOK_CLIENT_ID || process.env.AUTH_FACEBOOK_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET || process.env.AUTH_FACEBOOK_SECRET,
            allowDangerousEmailAccountLinking: true,
        }),
        Twitter({
            clientId: process.env.TWITTER_CLIENT_ID || process.env.AUTH_TWITTER_ID,
            clientSecret: process.env.TWITTER_CLIENT_SECRET || process.env.AUTH_TWITTER_SECRET,
            allowDangerousEmailAccountLinking: true,
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
    },
    trustHost: true,
}
