// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

﻿"use client"

import { useState } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { useLanguage } from '@/contexts/LanguageContext'

export default function CheckoutForm({ amount, currency, onSuccess }: { amount: number, currency: string, onSuccess: () => void }) {
    const { t } = useLanguage()
    const stripe = useStripe()
    const elements = useElements()

    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()

        if (!stripe || !elements) {
            return
        }

        setLoading(true)
        setErrorMessage(null)

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.origin + '/credits',
            },
            redirect: 'if_required'
        })

        if (error) {
            // Si es un error de cancelación o validación
            if (error.type === 'card_error' || error.type === 'validation_error') {
                setErrorMessage(error.message || t('common.errors.payment_generic'))
            } else {
                setErrorMessage(t('common.errors.unexpected'))
            }
            setLoading(false)
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            // Pago exitoso inmediato (Tarjeta)
            onSuccess()
            setLoading(false)
        } else if (paymentIntent && paymentIntent.status === 'processing') {
            // Pago pendiente (OXXO, Transferencia, etc.)
            setErrorMessage(null)
            setLoading(false)
            // Mostrar mensaje y botón de retorno
            const confirmReturn = confirm('¡Ficha generada! Tu pago está en proceso. ¿Quieres volver a la página de créditos? Los créditos se reflejarán automáticamente cuando realices el depósito.')
            if (confirmReturn) {
                window.location.href = '/credits'
            }
        } else {
            setErrorMessage('El estado del pago no es definitivo.')
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-surface p-6 rounded-xl border border-surface-highlight">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-text-primary mb-2">Detalles del Pago</h3>
                <p className="text-text-secondary">
                    Total a pagar: <span className="font-bold text-primary-700">{currency === 'USD' ? '$' : '$'}{amount.toFixed(2)} {currency}</span>
                </p>
            </div>

            <PaymentElement />

            {errorMessage && (
                <div className="mt-4 p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">
                    {errorMessage}
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || loading}
                className="w-full mt-6 py-3 bg-primary-700 text-white rounded-xl font-bold hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    `Pagar ${currency === 'USD' ? '$' : '$'}${amount.toFixed(2)}`
                )}
            </button>
        </form>
    )
}

