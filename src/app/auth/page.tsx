import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getWeightedHomePath } from "@/lib/navigation"
import AuthPageContent from "@/components/auth/AuthPageContent"

export default async function AuthPage() {
    const session = await auth()

    // 🔥 Redirección inmediata en el Servidor si ya está logueado
    // Esto evita el "flash" de la página de login y arregla el problema del botón "atrás"
    if (session) {
        redirect(getWeightedHomePath())
    }

    return <AuthPageContent />
}
