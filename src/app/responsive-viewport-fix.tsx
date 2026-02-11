// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

"use client"

import { useEffect } from 'react'

/**
 * 🔧 Fix para el problema de viewport en móviles
 * 
 * Este componente fuerza la actualización del viewport inmediatamente
 * cuando se monta en el lado del cliente, evitando que primero se muestre
 * la versión de escritorio.
 */
export function ResponsiveViewportFix() {
    useEffect(() => {
        const updateViewport = () => {
            let meta = document.querySelector('meta[name="viewport"]');
            // Remove interactive-widget=resizes-content to avoid layout jumps during keyboard/address bar shifts
            const content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover";

            if (!meta) {
                meta = document.createElement("meta");
                (meta as HTMLMetaElement).name = "viewport";
                document.getElementsByTagName("head")[0].appendChild(meta);
            }

            if (meta.getAttribute("content") !== content) {
                meta.setAttribute("content", content);
            }
        };

        updateViewport();

        // Prevent zooming on touch gestures
        const preventZoom = (e: TouchEvent) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        };

        document.addEventListener('touchstart', preventZoom as any, { passive: false });

        return () => {
            document.removeEventListener('touchstart', preventZoom as any);
        };
    }, []);

    return null;
}
