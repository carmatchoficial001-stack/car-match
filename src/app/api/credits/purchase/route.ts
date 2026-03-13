// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

// 🔴 RUTA DESACTIVADA EN PRODUCCIÓN
// Esta ruta era un simulador de desarrollo que entregaba créditos sin pago real.
// Ha sido bloqueada para evitar que cualquier persona obtenga créditos gratis
// enviando un POST a /api/credits/purchase con un packageId válido.
//
// El flujo real de compra es:
//   1. POST /api/credits/create-checkout → crea sesión Stripe
//   2. Usuario paga en Stripe (tarjeta, OXXO o SPEI)
//   3. Stripe llama al webhook /api/webhooks/stripe → se suman créditos
//
// Si necesitas reactivar el simulador para testing local, hazlo SOLO en .env.local
// con NEXT_PUBLIC_ENV=development y añade un guard aquí.

import { NextResponse } from 'next/server'

export async function POST() {
    return NextResponse.json(
        { error: 'This endpoint is disabled in production. Use /api/credits/create-checkout to purchase credits.' },
        { status: 403 }
    )
}
