import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getWeightedHomePath } from "@/lib/navigation"
import AuthPageContent from "@/components/auth/AuthPageContent"

export default async function AuthPage() {
    const session = await auth()

    // 🔥 Redirección inmediata y RESTAURACIÓN si ya está logueado
    if (session) {
        // Intentar limpiar el rastro de soft_logout si existe
        try {
            const { cookies: getCookies } = await import("next/headers")
            const cookieStore = await getCookies()
            cookieStore.delete('soft_logout')
        } catch (e) {
            // Silencioso si falla en entornos específicos
            console.error("Error clearing soft_logout cookie on server:", e);
        }
        redirect(getWeightedHomePath())
    }


    return <AuthPageContent />
}
