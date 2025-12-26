"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Logo } from '@/components/Logo'
import LanguageSelectorPublic from '@/components/LanguageSelectorPublic'
import { useLanguage } from '@/contexts/LanguageContext'
import PWAInstallModal from '@/components/PWAInstallModal'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { getWeightedHomePath } from '@/lib/navigation'

export default function LandingPage() {
    const { t } = useLanguage()
    const { triggerInstall, isInstallable } = usePWAInstall()
    const [showInstallModal, setShowInstallModal] = useState(false)
    const [selectedPlatform, setSelectedPlatform] = useState<'ios' | 'android' | 'auto'>('auto')

    // Auth redirect logic
    const { status } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (status === 'authenticated') {
            router.replace(getWeightedHomePath())
        }
    }, [status, router])

    const handleIOSClick = () => {
        setSelectedPlatform('ios')
        setShowInstallModal(true)
    }

    const handleAndroidClick = async () => {
        // Intentar instalación nativa "Magic Install"
        const installed = await triggerInstall()

        // Si no se pudo (o es iOS/Desktop sin soporte), mostrar manual
        if (!installed) {
            setSelectedPlatform('android')
            setShowInstallModal(true)
        }
    }

    return (
        <div className="min-h-screen bg-background text-white overflow-x-hidden relative">

            {/* Minimal Background Effect - Azul + Naranja */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-30%] right-[-15%] w-[1000px] h-[1000px] bg-primary-700/10 rounded-full blur-[150px]"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-accent-500/5 rounded-full blur-[120px]"></div>
            </div>

            {/* Navbar */}
            <nav className="absolute top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto left-0 right-0">
                <Logo showText={true} />
                <div className="flex items-center gap-4">
                    <LanguageSelectorPublic />
                    <Link href="/auth" className="px-6 py-2 bg-white/5 border border-white/10 rounded-full font-semibold hover:bg-white/10 transition text-sm">
                        {t('common.login')}
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative z-10 container mx-auto px-4 min-h-screen flex flex-col justify-center items-center pt-20 pb-10">

                {/* Mobile App Buttons */}
                <div className="flex flex-wrap justify-center gap-4 mb-12">
                    <button onClick={handleIOSClick} className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl hover:bg-white/10 hover:border-white/20 transition group">
                        <svg className="w-8 h-8 text-text-primary group-hover:scale-110 transition" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81. 03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg>
                        <div className="text-left">
                            <div className="text-[10px] uppercase tracking-wider text-gray-500">{t('landing.download_on')}</div>
                            <div className="text-sm font-bold leading-none">{t('landing.app_store')}</div>
                        </div>
                    </button>
                    <button onClick={handleAndroidClick} className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl hover:bg-white/10 hover:border-white/20 transition group">
                        <svg className="w-8 h-8 text-text-primary group-hover:scale-110 transition" viewBox="0 0 24 24" fill="currentColor"><path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" /></svg>
                        <div className="text-left">
                            <div className="text-[10px] uppercase tracking-wider text-gray-500">{t('landing.get_it_on')}</div>
                            <div className="text-sm font-bold leading-none">{t('landing.google_play')}</div>
                        </div>
                    </button>
                </div>

                {/* Main Headline */}
                <h1 className="text-6xl md:text-9xl font-black text-center mb-6 tracking-tighter leading-none max-w-6xl mx-auto">
                    <span className="text-text-primary">
                        {t('landing.hero_title_1')}
                    </span>
                    <br />
                    <span className="text-primary-700">
                        {t('landing.hero_title_2')}
                    </span>
                </h1>

                <p className="text-xl md:text-2xl text-gray-400 text-center mb-12 max-w-2xl mx-auto leading-relaxed">
                    {t('landing.hero_subtitle')}
                </p>

                {/* Primary CTA */}
                <div className="mb-24">
                    <Link
                        href="/auth"
                        className="group inline-flex items-center justify-center px-12 py-5 text-lg font-bold text-text-primary bg-primary-700 rounded-full hover:bg-primary-600 transition-all hover:scale-105 shadow-[0_0_50px_-10px_rgba(3,105,161,0.4)]"
                    >
                        {t('landing.cta_enter')}
                        <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                    </Link>
                </div>

                {/* Advantages Section - La Ventaja CarMatch */}
                <div className="w-full max-w-7xl mx-auto mb-24 py-16 px-8 bg-white/5 border border-white/10 rounded-[40px] backdrop-blur-md">
                    <h2 className="text-4xl md:text-6xl font-black text-center mb-16 tracking-tight">
                        LA VENTAJA <span className="text-primary-500 text-glow">CARMATCH</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {/* P2P Directo */}
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-6 w-16 h-16 bg-primary-700/20 rounded-full flex items-center justify-center text-primary-500">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Trato P2P Directo</h3>
                            <p className="text-gray-400">Sin intermediarios ni comisiones abusivas. Habla directo con el dueño y cierra el trato a tu manera.</p>
                        </div>

                        {/* Visibilidad 360 */}
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-6 w-16 h-16 bg-primary-700/20 rounded-full flex items-center justify-center text-primary-500">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Visibilidad 360°</h3>
                            <p className="text-gray-400">Publica una vez y aparece en todos lados: Swipe Feed, Marketplace y Mapa de Negocios simultáneamente.</p>
                        </div>

                        {/* Seguridad Humana */}
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-6 w-16 h-16 bg-primary-700/20 rounded-full flex items-center justify-center text-primary-500">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04clanM12 21.48c-3.12 0-5.912-1.428-7.85-3.693l-.004-.005A11.954 11.954 0 0112 2.944a11.954 11.954 0 017.854 14.838l-.004.005A11.954 11.954 0 0112 21.48z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Asesores de Seguridad</h3>
                            <p className="text-gray-400">Cada publicación es revisada por nuestro equipo de seguridad para garantizar que solo veas ofertas reales y seguras.</p>
                        </div>

                        {/* Wikipedia Motor */}
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-6 w-16 h-16 bg-primary-700/20 rounded-full flex items-center justify-center text-primary-500">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold mb-4">La Wikipedia del Motor</h3>
                            <p className="text-gray-400">Datos técnicos precisos: CC, Litros, Capacidad de Carga y Horas de Uso. La información que los expertos exigen.</p>
                        </div>

                        {/* Cero Spam */}
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-6 w-16 h-16 bg-primary-700/20 rounded-full flex items-center justify-center text-primary-500">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Cero Publicidad Basura</h3>
                            <p className="text-gray-400">Aquí no hay memes ni política. Solo motores, negocios y tratos reales para personas enfocadas en comprar o vender.</p>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-7xl">

                    <FeatureCard
                        title={t('landing.carmatch_title')}
                        subtitle={t('landing.carmatch_subtitle')}
                        description={t('landing.carmatch_desc')}
                        icon={
                            <svg className="w-8 h-8 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                        }
                    />

                    <FeatureCard
                        title={t('landing.marketcar_title')}
                        subtitle={t('landing.marketcar_subtitle')}
                        description={t('landing.marketcar_desc')}
                        icon={
                            <svg className="w-8 h-8 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        }
                    />

                    <FeatureCard
                        title={t('landing.mapstore_title')}
                        subtitle={t('landing.mapstore_subtitle')}
                        description={t('landing.mapstore_desc')}
                        icon={
                            <svg className="w-8 h-8 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        }
                    />
                </div>

                {/* Official Viral Social Media Section */}
                <div className="mt-24 text-center">
                    <p className="text-gray-500 mb-6 font-medium uppercase tracking-widest text-sm">
                        {t('landing.follow_us') || "SÍGUENOS EN NUESTRAS REDES"}
                    </p>
                    <div className="flex flex-wrap justify-center gap-6 md:gap-8">
                        {/* Facebook */}
                        <a href="https://www.facebook.com/share/1BofFV5xKc/" target="_blank" rel="noopener noreferrer" className="group text-gray-400 hover:text-[#1877F2] transition-all transform hover:scale-110">
                            <span className="sr-only">Facebook</span>
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                        </a>

                        {/* Instagram */}
                        <a href="https://instagram.com/carmatchapp" target="_blank" rel="noopener noreferrer" className="group text-gray-400 hover:text-[#E4405F] transition-all transform hover:scale-110">
                            <span className="sr-only">Instagram</span>
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                        </a>

                        {/* TikTok */}
                        <a href="https://tiktok.com/@carmatchapp" target="_blank" rel="noopener noreferrer" className="group text-gray-400 hover:text-white transition-all transform hover:scale-110">
                            <span className="sr-only">TikTok</span>
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                        </a>

                        {/* X (Twitter) */}
                        <a href="https://x.com/carmatchapp" target="_blank" rel="noopener noreferrer" className="group text-gray-400 hover:text-white transition-all transform hover:scale-110">
                            <span className="sr-only">X</span>
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                        </a>

                        {/* YouTube */}
                        <a href="https://youtube.com/@carmatchapp" target="_blank" rel="noopener noreferrer" className="group text-gray-400 hover:text-[#FF0000] transition-all transform hover:scale-110">
                            <span className="sr-only">YouTube</span>
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                        </a>


                    </div>
                </div>
            </div>

            {/* PWA Installation Modal */}
            <PWAInstallModal
                isOpen={showInstallModal}
                onClose={() => setShowInstallModal(false)}
                platform={selectedPlatform}
            />
        </div>
    )
}

// Feature Card Component
interface FeatureCardProps {
    title: string
    subtitle: string
    description: string
    icon: React.ReactNode
}

function FeatureCard({ title, subtitle, description, icon }: FeatureCardProps) {
    return (
        <div className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:scale-[1.02]">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-700/0 to-accent-500/0 group-hover:from-primary-700/10 group-hover:to-accent-500/10 rounded-3xl transition-all duration-500"></div>

            {/* Content */}
            <div className="relative z-10">
                <div className="mb-6 w-16 h-16 bg-primary-700/20 rounded-2xl flex items-center justify-center group-hover:bg-primary-700/30 transition">
                    {icon}
                </div>

                <div className="mb-3">
                    <h3 className="text-2xl font-black text-text-primary mb-1">{title}</h3>
                    <p className="text-sm text-primary-400 font-medium uppercase tracking-wider">{subtitle}</p>
                </div>

                <p className="text-gray-400 leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    )
}
