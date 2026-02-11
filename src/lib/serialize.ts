// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { Decimal } from "@prisma/client/runtime/library"

/**
 * Convierte recursivamente cualquier objeto Decimal de Prisma en un número simple.
 * Esto es necesario porque Next.js no puede pasar objetos Decimal a Componentes de Cliente.
 */
export function serializeDecimal<T>(data: T): T {
    if (data === null || data === undefined) return data

    // Si es un objeto de tipo Decimal (por instancia o por estructura)
    if (data instanceof Decimal || (
        typeof data === 'object' &&
        data !== null &&
        'd' in data && 's' in data && 'e' in data &&
        typeof (data as any).toNumber === 'function'
    )) {
        return (data as any).toNumber()
    }

    if (Array.isArray(data)) {
        return data.map(item => serializeDecimal(item)) as any
    }

    if (typeof data === 'object' && data !== null && !(data instanceof Date)) {
        const obj = {} as any
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                obj[key] = serializeDecimal((data as any)[key])
            }
        }
        return obj as T
    }

    return data
}
