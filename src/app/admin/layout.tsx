// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Admin Panel - CarMatch",
};

export const maxDuration = 60; // Extended timeout for all admin actions (AI generation)

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
