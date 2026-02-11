// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { useEffect, useState } from 'react'

export function useWebViewDetection() {
    const [isWebView, setIsWebView] = useState(false)
    const [webViewType, setWebViewType] = useState<'whatsapp' | 'facebook' | 'telegram' | 'instagram' | 'other' | null>(null)

    useEffect(() => {
        const userAgent = navigator.userAgent.toLowerCase()

        // Detectar si estamos en un WebView (navegador in-app)
        const isInWebView =
            // WhatsApp
            userAgent.includes('whatsapp') ||
            // Facebook/Messenger
            userAgent.includes('fban') || userAgent.includes('fbav') || userAgent.includes('messenger') ||
            // Instagram
            userAgent.includes('instagram') ||
            // Telegram
            userAgent.includes('telegram') ||
            // Detección genérica de WebView en Android
            (userAgent.includes('android') && userAgent.includes('wv')) ||
            // Detección de Line, Twitter, etc
            userAgent.includes('line') || userAgent.includes('twitter')

        setIsWebView(isInWebView)

        // Identificar el tipo específico
        if (userAgent.includes('whatsapp')) {
            setWebViewType('whatsapp')
        } else if (userAgent.includes('fban') || userAgent.includes('fbav') || userAgent.includes('messenger')) {
            setWebViewType('facebook')
        } else if (userAgent.includes('telegram')) {
            setWebViewType('telegram')
        } else if (userAgent.includes('instagram')) {
            setWebViewType('instagram')
        } else if (isInWebView) {
            setWebViewType('other')
        }
    }, [])

    return { isWebView, webViewType }
}
