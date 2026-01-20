import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getWeightedHomePath } from "@/lib/navigation"
import LandingPageContent from "@/components/landing/LandingPageContent"
import { cookies } from "next/headers"

export default async function LandingPage() {
    const session = await auth()
    const cookieStore = await cookies()
    const isSoftLogout = cookieStore.get('soft_logout')?.value === 'true'

    // 🔥 Redirección inmediata en el Servidor si ya está logueado
    // PERO si es un "soft logout", permitimos ver la landing de nuevo
    if (session && !isSoftLogout) {
        redirect(getWeightedHomePath())
    }

    return <LandingPageContent />
}
