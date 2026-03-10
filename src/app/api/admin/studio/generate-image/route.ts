import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { performFalGeneration } from '@/app/admin/actions/studio-generate-logic'

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const body = await req.json()
        const { messageId, idx, format, prompt } = body

        if (!messageId || idx === undefined || !format || !prompt) {
            return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 })
        }

        const result = await performFalGeneration({ messageId, idx, format, prompt });
        return NextResponse.json(result);

    } catch (e: any) {
        console.error("[STUDIO-API-ROUTE] Error:", e)
        return NextResponse.json({ success: false, error: e.message }, { status: 500 })
    }
}
