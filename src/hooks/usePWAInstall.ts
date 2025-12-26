'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [isInstallable, setIsInstallable] = useState(false)

    useEffect(() => {
        const handler = (e: Event) => {
            // Prevenir que Chrome muestre el prompt automáticamente (opcional, para controlarlo nosotros)
            e.preventDefault()
            // Guardar el evento para dispararlo después
            setDeferredPrompt(e as BeforeInstallPromptEvent)
            setIsInstallable(true)
            console.log("✅ PWA Install Prompt capturado y listo para usar")
        }

        window.addEventListener('beforeinstallprompt', handler)

        // Limpieza
        return () => {
            window.removeEventListener('beforeinstallprompt', handler)
        }
    }, [])

    const triggerInstall = async () => {
        if (!deferredPrompt) {
            console.log("❌ No hay prompt de instalación diferido")
            return false
        }

        // Mostrar el prompt nativo
        deferredPrompt.prompt()

        // Esperar a que el usuario responda
        const { outcome } = await deferredPrompt.userChoice
        console.log(`User response to install prompt: ${outcome}`)

        // Limpiar el prompt ya que solo se puede usar una vez
        setDeferredPrompt(null)
        setIsInstallable(false)
        return true
    }

    return { isInstallable, triggerInstall }
}
