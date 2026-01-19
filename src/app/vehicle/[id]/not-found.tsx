"use client"

import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

export default function VehicleNotFound() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[80vh] text-center">
                {/* Icono de vehículo vendido */}
                <div className="mb-8 relative">
                    <div className="w-32 h-32 bg-green-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="absolute -top-2 -right-2 bg-primary-700 text-white rounded-full p-2">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                {/* Mensaje principal */}
                <h1 className="text-4xl md:text-5xl font-black text-green-500 mb-4">
                    ¡Mejor! Ya vendido 🎉
                </h1>

                <p className="text-xl text-text-secondary mb-8 max-w-2xl">
                    Este vehículo ya no está disponible. ¡Buenas noticias! Esto significa que otro usuario encontró su auto ideal.
                </p>

                <div className="bg-surface border border-surface-highlight rounded-2xl p-6 mb-8 max-w-md">
                    <p className="text-text-primary font-medium mb-2">
                        Pero no te preocupes...
                    </p>
                    <p className="text-text-secondary">
                        Tenemos cientos de vehículos esperándote. Explora nuestra colección y encuentra el tuyo.
                    </p>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                    <button
                        onClick={() => router.push('/market')}
                        className="flex-1 px-8 py-4 bg-primary-700 text-text-primary rounded-xl font-bold hover:bg-primary-600 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Explorar MarketCar
                    </button>

                    <button
                        onClick={() => router.push('/swipe')}
                        className="flex-1 px-8 py-4 bg-surface border-2 border-primary-700 text-primary-400 rounded-xl font-bold hover:bg-primary-700/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Descubre en CarMatch
                    </button>
                </div>

                {/* Estadísticas motivacionales */}
                <div className="mt-12 grid grid-cols-2 gap-6 max-w-md w-full">
                    <div className="bg-surface-highlight/20 rounded-xl p-4">
                        <p className="text-3xl font-black text-primary-400">500+</p>
                        <p className="text-sm text-text-secondary">Vehículos activos</p>
                    </div>
                    <div className="bg-surface-highlight/20 rounded-xl p-4">
                        <p className="text-3xl font-black text-green-500">1,250+</p>
                        <p className="text-sm text-text-secondary">Vendidos este mes</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
