"use client"

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { useLanguage } from '@/contexts/LanguageContext'

interface CreditsClientProps {
    user: any
    transactions: any[]
}

interface PricingData {
    countryCode: string
    pricePerCredit: number
    currency: string
    region: 'developed' | 'developing'
    localCurrency?: string
    localPriceEstimate?: number
    exchangeRate?: number
}

export default function CreditsClient({ user, transactions }: CreditsClientProps) {
    const { t } = useLanguage()
    const [activeTab, setActiveTab] = useState<'balance' | 'history'>('history')
    const [pricing, setPricing] = useState<PricingData | null>(null)
    const [quantity, setQuantity] = useState(1)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPricing()

        // Verificar si regresamos de un pago exitoso
        const urlParams = new URLSearchParams(window.location.search)
        const sessionId = urlParams.get('session_id')

        if (urlParams.get('success') === 'true' && sessionId) {
            const confirmPayment = async () => {
                setLoading(true)
                try {
                    const res = await fetch('/api/credits/confirm', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId })
                    })
                    const data = await res.json()
                    if (res.ok && data.success) {
                        alert(`¡Pago verificado! Se han sumado ${data.creditsAdded} créditos a tu cuenta.`)
                        // Limpiar la URL y refrescar datos
                        window.history.replaceState({}, document.title, window.location.pathname)
                        window.location.reload()
                    } else {
                        console.error('Error confirmando pago:', data.error)
                        // Si falla por pendiente, avisar al usuario
                        if (data.error?.includes('confirmado')) {
                            alert(data.error)
                        } else {
                            alert('Hubo un problema al verificar tus créditos. Por favor, contacta a soporte si tu pago ya fue realizado.')
                        }
                        setLoading(false)
                        // No limpiamos la URL para que el usuario pueda intentar F5 de nuevo
                    }
                } catch (error) {
                    console.error('Error de red al confirmar:', error)
                    setLoading(false)
                }
            }
            confirmPayment()
        } else if (urlParams.get('canceled') === 'true') {
            alert('El pago fue cancelado.')
            window.history.replaceState({}, document.title, window.location.pathname)
        }
    }, [])

    const fetchPricing = async () => {
        try {
            const res = await fetch('/api/pricing')
            if (res.ok) {
                const data = await res.json()
                setPricing(data)
            }
        } catch (error) {
            console.error('Error fetching pricing:', error)
        } finally {
            setLoading(false)
        }
    }

    const [showBridgeModal, setShowBridgeModal] = useState(false)

    const handlePurchase = async () => {
        if (!pricing) return

        setLoading(true)
        try {
            const res = await fetch('/api/credits/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quantity,
                    country: pricing.countryCode
                })
            })

            const data = await res.json()

            if (res.ok && data.url) {
                // Abrir en nueva pestaña para que CarMatch se quede abierto de fondo
                // Esto soluciona que Stripe Checkout sea un "callejón sin salida"
                setShowBridgeModal(true)
                window.open(data.url, '_blank')
                setLoading(false)
            } else {
                console.error('Error al iniciar pago:', data.error)
                alert(`No se pudo iniciar el proceso de pago: ${data.error || 'Error desconocido'}`)
                setLoading(false)
            }
        } catch (error: any) {
            console.error('Error de conexión:', error)
            alert(`Error de conexión: ${error.message || 'Verifica tu internet'}`)
            setLoading(false)
        }
    }

    const total = pricing ? pricing.pricePerCredit * quantity : 0

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header />

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <h1 className="text-3xl font-bold text-text-primary mb-2">Banco de Créditos 🏦</h1>
                <p className="text-text-secondary mb-8">Administra el saldo para tus publicaciones.</p>

                {/* Tarjeta de Saldo Principal */}
                <div className="bg-gradient-to-r from-primary-800 to-primary-600 rounded-2xl p-8 mb-8 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <p className="text-white/80 font-medium mb-1">Saldo Disponible</p>
                            <div className="text-5xl font-bold flex items-baseline gap-2">
                                {user.credits}
                                <span className="text-lg font-normal opacity-80">créditos</span>
                            </div>
                            {pricing && (
                                <p className="text-xs text-white/60 mt-2">
                                    📍 {pricing.countryCode} • ${pricing.pricePerCredit} {pricing.currency}/crédito
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setActiveTab('history')}
                                className="px-6 py-3 bg-white text-primary-800 font-bold rounded-xl hover:bg-gray-100 transition shadow-lg"
                            >
                                + Recargar
                            </button>
                        </div>
                    </div>

                    {/* Decoración de fondo */}
                    <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-surface-highlight mb-6">
                    <button
                        onClick={() => setActiveTab('balance')}
                        className={`px-6 py-3 font-medium text-sm transition border-b-2 ${activeTab === 'balance'
                            ? 'border-primary-500 text-primary-500'
                            : 'border-transparent text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        Movimientos
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-3 font-medium text-sm transition border-b-2 ${activeTab === 'history'
                            ? 'border-primary-500 text-primary-500'
                            : 'border-transparent text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        Comprar Créditos
                    </button>
                </div>

                {activeTab === 'balance' && (
                    <div className="bg-surface rounded-xl border border-surface-highlight overflow-hidden">
                        {transactions.length > 0 ? (
                            <div className="divide-y divide-surface-highlight">
                                {transactions.map((tx) => (
                                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-surface-highlight/5 transition">
                                        <div className="flex items-center gap-4">
                                            <div className={`
                                                w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                                                ${tx.amount > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}
                                            `}>
                                                {tx.amount > 0 ? '↓' : '↑'}
                                            </div>
                                            <div>
                                                <p className="text-text-primary font-medium">{tx.description}</p>
                                                <p className="text-xs text-text-secondary">
                                                    {new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-text-primary'}`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-text-secondary">
                                <p>No hay movimientos recientes.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-6">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full"></div>
                            </div>
                        ) : pricing ? (
                            <>

                                {/* Purchase Card */}
                                <div className="bg-surface rounded-2xl border border-surface-highlight p-8 shadow-lg">
                                    <h2 className="text-2xl font-bold text-text-primary mb-6">Comprar Créditos</h2>

                                    {/* Quantity Selector */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-bold text-text-primary mb-3">
                                            ¿Cuántos créditos necesitas?
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                className="w-12 h-12 bg-surface-highlight hover:bg-primary-100 rounded-xl font-bold text-xl transition"
                                            >
                                                −
                                            </button>
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={quantity}
                                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="flex-1 text-center text-3xl font-bold bg-background border-2 border-surface-highlight rounded-xl py-4 focus:outline-none focus:border-primary-500"
                                            />
                                            <button
                                                onClick={() => setQuantity(Math.min(100, quantity + 1))}
                                                className="w-12 h-12 bg-surface-highlight hover:bg-primary-100 rounded-xl font-bold text-xl transition"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    {/* Quick Options */}
                                    <div className="flex gap-2 mb-6 flex-wrap">
                                        {[1, 5, 10, 20].map((qty) => (
                                            <button
                                                key={qty}
                                                onClick={() => setQuantity(qty)}
                                                className={`px-4 py-2 rounded-lg font-bold text-sm transition ${quantity === qty
                                                    ? 'bg-primary-600 text-white'
                                                    : 'bg-surface-highlight text-text-secondary hover:bg-primary-100'
                                                    }`}
                                            >
                                                {qty} {qty === 1 ? 'crédito' : 'créditos'}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Total & Purchase */}
                                    <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white mb-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm opacity-80 mb-1">Total a Pagar</p>
                                                <p className="text-4xl font-bold">
                                                    ${total.toFixed(2)} <span className="text-lg">{pricing.currency}</span>
                                                </p>
                                                {pricing.localPriceEstimate && pricing.localCurrency !== 'MXN' && (
                                                    <p className="text-sm opacity-90 mt-1 font-medium bg-black/20 px-2 py-1 rounded inline-block">
                                                        ≈ ${(pricing.localPriceEstimate * quantity).toFixed(2)} {pricing.localCurrency}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm opacity-80">Recibirás</p>
                                                <p className="text-3xl font-bold">{quantity}</p>
                                                <p className="text-xs opacity-80">crédito{quantity !== 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handlePurchase}
                                        className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-lg transition shadow-lg"
                                    >
                                        💳 Pagar
                                    </button>

                                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                        <p className="text-xs text-blue-400 leading-relaxed font-medium">
                                            ⚡ **Tarjeta / Apple Pay / Google Pay:** Acreditación instantánea.<br />
                                            ⏳ **Transferencia / OXXO:** Puede tardar desde unos minutos hasta 72 horas hábiles en reflejarse.
                                        </p>
                                    </div>

                                    <p className="text-xs text-text-secondary text-center mt-4">
                                        Pago seguro procesado por Stripe.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12 text-text-secondary">
                                Error al cargar precios. Por favor recarga la página.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bridge Modal */}
            {showBridgeModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-surface border border-surface-highlight rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
                        <div className="w-20 h-20 bg-primary-500/10 text-primary-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                            💳
                        </div>
                        <h3 className="text-2xl font-bold text-text-primary mb-4">Procesando Pago</h3>
                        <p className="text-text-secondary mb-8 leading-relaxed">
                            Hemos abierto Stripe en una nueva pestaña para tu seguridad.
                            <br /><br />
                            1. Completa tu pago u obtén tu ficha.<br />
                            2. **Si pagas por transferencia/OXXO**, recuerda que puede tardar hasta 72 horas en acreditarse.<br />
                            3. Al terminar, vuelve a esta pestaña.
                        </p>
                        <button
                            onClick={() => setShowBridgeModal(false)}
                            className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl transition shadow-lg"
                        >
                            Lo entiendo, volveré aquí
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
