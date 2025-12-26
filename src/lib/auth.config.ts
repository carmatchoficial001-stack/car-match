import Google from "next-auth/providers/google"
import Facebook from "next-auth/providers/facebook"
import Twitter from "next-auth/providers/twitter"
import type { NextAuthConfig } from "next-auth"

// ⚙️ Configuración base compatible con Edge (Middleware)
export const authConfig: NextAuthConfig = {
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
        }),
        Twitter({
            clientId: process.env.TWITTER_CLIENT_ID,
            clientSecret: process.env.TWITTER_CLIENT_SECRET,
            version: "2.0",
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
}
