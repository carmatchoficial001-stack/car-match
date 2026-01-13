import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getWeightedHomePath } from "@/lib/navigation"
import AuthPageContent from "@/components/auth/AuthPageContent"

export default async function AuthPage() {
    return <AuthPageContent />
}
