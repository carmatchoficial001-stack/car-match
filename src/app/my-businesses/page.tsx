import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import MyBusinessesClient from "./MyBusinessesClient"

export default async function MyBusinessesPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/auth")
    }

    return <MyBusinessesClient />
}
