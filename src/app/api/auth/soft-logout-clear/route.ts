import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
    try {
        const cookieStore = await cookies()
        cookieStore.delete('soft_logout')
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
