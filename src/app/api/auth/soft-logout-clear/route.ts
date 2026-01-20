import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
    const cookieStore = await cookies()
    cookieStore.set('soft_logout', 'false', {
        path: '/',
        maxAge: 0 // Deletes immediately
    })

    return NextResponse.json({ success: true })
}
