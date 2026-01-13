import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const { pathname } = req.nextUrl

    // Rutas protegidas que requieren autenticación (RED SOCIAL)
    const protectedRoutes = [
        "/profile",
        "/publish",
        "/credits",
        "/favorites",
        "/market",      // Feed MarketCar - solo autenticados
        "/swipe",       // Feed CarMatch - solo autenticados
        "/map",         // Map Store - solo autenticados
        "/my-businesses",
        "/messages",
        "/vehicle",     // Detalle Vehículo - Forzar registro (Viral loop)
        "/business"     // Detalle Negocio - Forzar registro (Viral loop)
    ]

    // Rutas de autenticación (no permitidas si ya está logueado)
    const authRoutes = ["/auth", "/auth/login", "/auth/register"]

    // Si está intentando acceder a una ruta protegida sin estar logueado
    if (protectedRoutes.some(route => pathname.startsWith(route)) && !isLoggedIn) {
        // SMART REDIRECT: Guardamos a dónde quería ir para regresarlo ahí después de registrarse
        // Esto es CLAVE para la viralidad: Click Link -> Registro -> Ver Contenido
        const callbackUrl = encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)
        return Response.redirect(new URL(`/auth?callbackUrl=${callbackUrl}`, req.url))
    }

    // Si está logueado y trata de acceder a LA RAÍZ (/), redirigir a la app
    // Nota: Las 'authRoutes' NO se redirigen aquí para dejar que el cliente 
    // maneje el escape de historial (evitar bucle de Google).
    if (pathname === "/" && isLoggedIn) {
        // Si hay un callbackUrl pendiente, lo mandamos ahí
        const callbackUrl = req.nextUrl.searchParams.get('callbackUrl')
        if (callbackUrl) {
            return Response.redirect(new URL(decodeURIComponent(callbackUrl), req.url))
        }
        // Redirigir usando distribución ponderada
        const random = Math.random();
        let destination = "/swipe";     // 50% - Feed CarMatch
        if (random >= 0.5 && random < 0.9) {
            destination = "/market";    // 40% - Feed MarketCar
        } else if (random >= 0.9) {
            destination = "/map";       // 10% - MapStore
        }
        return Response.redirect(new URL(destination, req.url))
    }
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
