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
    if (session && !isSoftLogout) {
        redirect(getWeightedHomePath())
    }

    // 🎲 REDIRECCIÓN PROBABILÍSTICA PARA INVITADOS (90% MarketCar / 10% MapStore)
    // Esto elimina la barrera de la landing estática
    const random = Math.random()
    if (random < 0.9) {
        redirect('/market') // 90% MarketCar
    } else {
        redirect('/map') // 10% MapStore
    }
}
