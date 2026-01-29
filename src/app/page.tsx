import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getWeightedHomePath } from "@/lib/navigation"
import LandingPageContent from "@/components/landing/LandingPageContent"
import { cookies } from "next/headers"

export default async function LandingPage() {
    const session = await auth()
    const cookieStore = await cookies()
    const isSoftLogout = cookieStore.get('soft_logout')?.value === 'true'

    // 🔥 Redirección inmediata en el Servidor si ya está logueado y NO es soft logout
    if (session && !isSoftLogout) {
        redirect(getWeightedHomePath())
    }

    // ✅ Restauramos la Landing Page para invitados y bots.
    // Esto es fundamental para que Google pueda indexar el contenido de la raíz.
    // Los botones dentro de la landing permiten navegar a /market o /auth según el usuario prefiera.
    return <LandingPageContent />
}
