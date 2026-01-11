"use client"

import { useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Copy, Download, Check, Send } from 'lucide-react'

interface QRCodeModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function QRCodeModal({ isOpen, onClose }: QRCodeModalProps) {
    const [copied, setCopied] = useState(false)
    const [phoneNumber, setPhoneNumber] = useState('')
    const [sendingWhatsApp, setSendingWhatsApp] = useState(false)
    const qrRef = useRef<HTMLDivElement>(null)

    // URL de la aplicación (usa variable de entorno o fallback)
    const appUrl = typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(appUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error('Error al copiar:', error)
        }
    }

    const handleDownloadQR = () => {
        if (!qrRef.current) return

        const svg = qrRef.current.querySelector('svg')
        if (!svg) return

        // Convertir SVG a canvas y luego a imagen
        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        // Tamaño del QR (más grande para mejor calidad al imprimir)
        const size = 1000
        canvas.width = size
        canvas.height = size

        img.onload = () => {
            if (ctx) {
                // Fondo blanco
                ctx.fillStyle = 'white'
                ctx.fillRect(0, 0, size, size)
                // Dibujar QR
                ctx.drawImage(img, 0, 0, size, size)

                // Descargar
                canvas.toBlob((blob) => {
                    if (blob) {
                        const url = URL.createObjectURL(blob)
                        const link = document.createElement('a')
                        link.href = url
                        link.download = 'carmatch-qr-code.png'
                        link.click()
                        URL.revokeObjectURL(url)
                    }
                })
            }
        }

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    }

    const handleSendWhatsApp = () => {
        if (!phoneNumber.trim()) {
            alert('Por favor escribe un número de teléfono')
            return
        }

        setSendingWhatsApp(true)

        // Limpiar el número (quitar espacios, guiones, paréntesis, etc.)
        const cleanNumber = phoneNumber.replace(/\D/g, '')

        // Si no tiene código de país, asumir México (+52)
        const fullNumber = cleanNumber.startsWith('52') ? cleanNumber : `52${cleanNumber}`

        // Mensaje personalizado
        const message = `¡Hola! 👋 Te comparto CarMatch, la mejor app para comprar y vender vehículos:\n\n${appUrl}\n\n¡Descarga la app y encuentra tu carro ideal! 🚗`

        // URL de WhatsApp con el mensaje pre-cargado
        const whatsappUrl = `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`

        // Abrir WhatsApp
        window.open(whatsappUrl, '_blank')

        // Reset después de un momento
        setTimeout(() => {
            setSendingWhatsApp(false)
            setPhoneNumber('')
        }, 1000)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
    }

    if (!isOpen) return null

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] animate-in fade-in duration-200"
                onClick={onClose}
                onKeyDown={(e: any) => handleKeyDown(e)}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200 pointer-events-none">
                <div className="bg-surface border border-surface-highlight rounded-3xl shadow-2xl overflow-hidden w-full max-w-md pointer-events-auto">
                    {/* Header */}
                    <div className="relative bg-gradient-to-r from-primary-900/30 to-transparent p-6 border-b border-surface-highlight">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl transition text-text-secondary hover:text-text-primary"
                            aria-label="Cerrar"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-2xl font-black tracking-tight text-text-primary">
                            Compartir CarMatch
                        </h2>
                        <p className="text-sm text-text-secondary mt-1">
                            Escanea este código QR para abrir la app
                        </p>
                    </div>

                    {/* QR Code */}
                    <div className="p-8 flex flex-col items-center">
                        <div
                            ref={qrRef}
                            className="bg-white p-6 rounded-2xl shadow-xl"
                        >
                            <QRCodeSVG
                                value={appUrl}
                                size={220}
                                level="H"
                                includeMargin={false}
                                fgColor="#000000"
                                bgColor="#FFFFFF"
                            />
                        </div>

                        {/* URL Display */}
                        <div className="mt-6 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center">
                            <p className="text-xs text-text-secondary mb-1 uppercase tracking-wider font-bold">
                                Enlace directo
                            </p>
                            <p className="text-sm text-primary-400 font-mono truncate">
                                {appUrl}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 w-full flex gap-3">
                            <button
                                onClick={handleCopyLink}
                                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-sm text-text-primary transition flex items-center justify-center gap-2"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4 text-green-500" />
                                        <span>¡Copiado!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        <span>Copiar Link</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleDownloadQR}
                                className="flex-1 px-4 py-3 bg-primary-700 hover:bg-primary-600 rounded-xl font-bold text-sm text-text-primary transition flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                <span>Descargar QR</span>
                            </button>
                        </div>

                        {/* WhatsApp Send Section */}
                        <div className="mt-6 w-full">
                            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                    </svg>
                                    <h3 className="text-sm font-bold text-green-400">Enviar por WhatsApp</h3>
                                </div>

                                <p className="text-xs text-text-secondary mb-3">
                                    Escribe el número y envía el link directamente sin tener que copiarlo
                                </p>

                                <div className="flex gap-2 items-center">
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="Ej: 8123456789"
                                        className="flex-1 px-4 py-3 bg-surface border border-white/10 rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && phoneNumber.trim()) {
                                                handleSendWhatsApp()
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={handleSendWhatsApp}
                                        disabled={!phoneNumber.trim() || sendingWhatsApp}
                                        className="px-5 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-bold text-sm text-white transition flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 disabled:shadow-none"
                                    >
                                        {sendingWhatsApp ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                <span className="hidden sm:inline">Enviar</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Helper Text */}
                        <p className="mt-4 text-xs text-text-secondary text-center leading-relaxed">
                            💡 Descarga el QR para imprimirlo o compartirlo en redes sociales
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}
