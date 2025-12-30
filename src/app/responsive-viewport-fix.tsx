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
        // Forzar re-render del viewport
        const viewport = document.querySelector('meta[name="viewport"]')
        if (viewport) {
            const content = viewport.getAttribute('content')
            viewport.setAttribute('content', content + ', interactive-widget=resizes-content')
        }

        // Prevenir zoom no deseado
        document.addEventListener('gesturestart', function (e) {
            e.preventDefault()
        })

        // Fix para Safari iOS
        const handleResize = () => {
            const vh = window.innerHeight * 0.01
            document.documentElement.style.setProperty('--vh', `${vh}px`)
        }

        handleResize()
        window.addEventListener('resize', handleResize)
        window.addEventListener('orientationchange', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('orientationchange', handleResize)
        }
    }, [])

    return null
}
