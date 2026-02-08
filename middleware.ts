import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    // 🔧 FIX: Redirect www to non-www (Google Search Console redirect error)
    if (req.nextUrl.hostname === 'www.carmatchapp.net') {
        const newUrl = req.nextUrl.clone()
        newUrl.hostname = 'carmatchapp.net'
        return Response.redirect(newUrl, 308)
    }

    const isLoggedIn = !!req.auth
    const { pathname } = req.nextUrl
    const isSoftLogout = req.cookies.get('soft_logout')?.value === 'true'

    // Rutas protegidas que requieren autenticación (RED SOCIAL)
    const protectedRoutes = [
        '/profile',
        '/publish',
        '/my-businesses',
        '/messages',
        '/credits',
        '/admin',
        '/settings',
        '/favorites'
    ]
    // Rutas de autenticación (no permitidas si ya está logueado y NO es soft_logout)
    const authRoutes = ["/auth", "/auth/login", "/auth/register"]

    // 🚀 REDIRECCIÓN PARA RUTAS PROTEGIDAS (Solo si no está logueado)
    if (protectedRoutes.some(route => pathname.startsWith(route)) && !isLoggedIn) {
        const callbackUrl = encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)

        // Si es soft logout, lo mandamos a la landing (/) para que vea el "fake logout"
        // Si es guest puro, a /auth
        const dest = isSoftLogout ? '/' : `/auth?callbackUrl=${callbackUrl}`
        return Response.redirect(new URL(dest, req.url))
    }

    // 2. Si está logueado y trata de acceder a login/register O LA RAÍZ (/)
    if ((authRoutes.some(route => pathname.startsWith(route)) || pathname === "/") && isLoggedIn) {
        // PERO si es soft logout, permitimos que se quede en / o vaya a /auth
        if (isSoftLogout) return

        // Si no es soft logout, aplicamos redirección normal a la app
        const callbackUrl = req.nextUrl.searchParams.get('callbackUrl')
        if (callbackUrl) {
            return Response.redirect(new URL(decodeURIComponent(callbackUrl), req.url))
        }

        const random = Math.random();
        let destination = "/swipe";
        if (random >= 0.5 && random < 0.9) {
            destination = "/market";
        } else if (random >= 0.9) {
            destination = "/map";
        }
        return Response.redirect(new URL(destination, req.url))
    }
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
