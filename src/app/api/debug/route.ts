import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import Stripe from 'stripe'

export async function GET() {
    const diagnostics: any = {
        timestamp: new Date().toISOString(),
        env: {
            STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'CONFIGURED' : 'MISSING',
            STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? 'CONFIGURED' : 'MISSING',
            DATABASE_URL: process.env.DATABASE_URL ? 'CONFIGURED' : 'MISSING',
            NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
        },
        database: 'PENDING',
        stripe: 'PENDING'
    }

    try {
        await prisma.$queryRaw`SELECT 1`
        diagnostics.database = 'OK'
    } catch (e: any) {
        diagnostics.database = `ERROR: ${e.message}`
    }

    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' })
        const balance = await stripe.balance.retrieve()
        diagnostics.stripe = 'OK (Live connection successful)'
    } catch (e: any) {
        diagnostics.stripe = `ERROR: ${e.message}`
    }

    return NextResponse.json(diagnostics)
}
