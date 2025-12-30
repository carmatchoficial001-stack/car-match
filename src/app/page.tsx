import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getWeightedHomePath } from "@/lib/navigation"
import LandingPageContent from "@/components/landing/LandingPageContent"

export default async function LandingPage() {
    const session = await auth()

    // 🔥 Redirección inmediata en el Servidor si ya está logueado
    if (session) {
        redirect(getWeightedHomePath())
    }

    return <LandingPageContent />
}
