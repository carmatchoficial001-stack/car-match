// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role?: string
            isAdmin?: boolean
        } & DefaultSession["user"]
    }

    interface User extends DefaultUser {
        role?: string
        isAdmin?: boolean
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role?: string
        isAdmin?: boolean
    }
}
