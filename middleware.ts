import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const userAgent = req.headers.get('user-agent') || '';
    const isBot = /bot|crawler|spider|googlebot|bingbot|yandexbot|duckduckbot|slurp|baiduspider|facebookexternalhit|twitterbot/i.test(userAgent);

    // 🔧 FIX: Redirect www to non-www (Google Search Console redirect error)
    // Skip for bots to avoid redirect loops or issues with crawlers
    if (req.nextUrl.hostname === 'www.carmatchapp.net' && !isBot) {
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
    // Skip for bots to allow them to crawl protected content if they somehow reach it
    if (protectedRoutes.some(route => pathname.startsWith(route)) && !isLoggedIn && !isBot) {
        const callbackUrl = encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)

        // Si es soft logout, lo mandamos a la landing (/) para que vea el "fake logout"
        // Si es guest puro, a /auth
        const dest = isSoftLogout ? '/' : `/auth?callbackUrl=${callbackUrl}`
        return Response.redirect(new URL(dest, req.url))
    }

    // 2. Si está logueado y trata de acceder a login/register O LA RAÍZ (/)
    // Skip for bots to allow them to crawl the root or auth pages
    if ((authRoutes.some(route => pathname.startsWith(route)) || pathname === "/") && isLoggedIn && !isBot) {
        // PERO si es soft logout, permitimos que se quede en / o vaya a /auth
        if (isSoftLogout) return

        // Si no es soft logout, aplicamos redirección normal a la app
        const callbackUrl = req.nextUrl.searchParams.get('callbackUrl')
        if (callbackUrl) {
            return Response.redirect(new URL(decodeURIComponent(callbackUrl), req.url))
        }

        // Random redirect for logged-in users, with /market as the base destination
        let destination = "/market"; // Base destination
        const random = Math.random();
        if (random < 0.2) { // 20% chance for /swipe
            destination = "/swipe";
        } else if (random < 0.3) { // 10% chance for /map (from 0.2 to 0.3)
            destination = "/map";
        }
        // Else (0.3 to 1.0, 70% chance) it remains "/market"
        return Response.redirect(new URL(destination, req.url))
    }
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
