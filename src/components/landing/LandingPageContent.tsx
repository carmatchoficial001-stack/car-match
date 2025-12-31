"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import LanguageSelectorPublic from '@/components/LanguageSelectorPublic'
import { useLanguage } from '@/contexts/LanguageContext'
import PWAInstallModal from '@/components/PWAInstallModal'
import { usePWAInstall } from '@/hooks/usePWAInstall'

export default function LandingPageContent() {
    const { t } = useLanguage()
    const { triggerInstall } = usePWAInstall()
    const [showInstallModal, setShowInstallModal] = useState(false)
    const [selectedPlatform, setSelectedPlatform] = useState<'ios' | 'android' | 'auto'>('auto')

    const handleIOSClick = () => {
        setSelectedPlatform('ios')
        setShowInstallModal(true)
    }

    const handleAndroidClick = async () => {
        const installed = await triggerInstall()
        if (!installed) {
            setSelectedPlatform('android')
            setShowInstallModal(true)
        }
    }

    return (
        <div className="min-h-screen bg-background text-white overflow-x-hidden relative">
            {/* Minimal Background Effect */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-30%] right-[-15%] w-[1000px] h-[1000px] bg-primary-700/10 rounded-full blur-[150px]"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-accent-500/5 rounded-full blur-[120px]"></div>
            </div>

            {/* Navbar */}
            <nav className="absolute top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto left-0 right-0">
                <Logo showText={false} />
                <div className="flex items-center gap-4">
                    <LanguageSelectorPublic />
                    <Link href="/auth" className="px-6 py-2 bg-white/5 border border-white/10 rounded-full font-semibold hover:bg-white/10 transition text-sm">
                        {t('common.login')}
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative z-10 container mx-auto px-4 min-h-screen flex flex-col justify-center items-center pt-20 pb-10">
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

                <h1 className="text-6xl md:text-9xl font-black text-center mb-6 tracking-tighter leading-none max-w-6xl mx-auto">
                    <span className="text-text-primary">{t('landing.hero_title_1')}</span>
                    <br />
                    <span className="text-primary-700">{t('landing.hero_title_2')}</span>
                </h1>

                <p className="text-xl md:text-2xl text-gray-400 text-center mb-12 max-w-2xl mx-auto leading-relaxed">
                    {t('landing.hero_subtitle')}
                </p>

                <div className="mb-24">
                    <Link
                        href="/auth"
                        className="group inline-flex items-center justify-center px-12 py-5 text-lg font-bold text-text-primary bg-primary-700 rounded-full hover:bg-primary-600 transition-all hover:scale-105 shadow-[0_0_50px_-10px_rgba(3,105,161,0.4)]"
                    >
                        {t('landing.cta_enter')}
                        <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                    </Link>
                </div>

                {/* Advantages Section */}
                <div className="w-full max-w-7xl mx-auto mb-24 py-16 px-8 bg-white/5 border border-white/10 rounded-[40px] backdrop-blur-md text-center">
                    <h2 className="text-4xl md:text-6xl font-black mb-16 tracking-tight">
                        LA VENTAJA <span className="text-primary-500 text-glow">CARMATCH</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {/* Simple items for readability */}
                        <AdvantageItem
                            title="Trato P2P Directo"
                            desc="Sin intermediarios ni comisiones abusivas. Habla directo con el dueño."
                            icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                        />
                        <AdvantageItem
                            title="Visibilidad 360°"
                            desc="Publica una vez y aparece en todos lados: Swipe, Marketplace y Mapa."
                            icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                        />
                        <AdvantageItem
                            title="Seguridad Humana"
                            desc="Cada publicación es revisada por nuestro equipo de seguridad."
                            icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04clanM12 21.48c-3.12 0-5.912-1.428-7.85-3.693l-.004-.005A11.954 11.954 0 0112 2.944a11.954 11.954 0 017.854 14.838l-.004.005A11.954 11.954 0 0112 21.48z" /></svg>}
                        />
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-7xl">
                    <FeatureCard
                        title={t('landing.carmatch_title')}
                        subtitle={t('landing.carmatch_subtitle')}
                        description={t('landing.carmatch_desc')}
                        icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>}
                    />
                    <FeatureCard
                        title={t('landing.marketcar_title')}
                        subtitle={t('landing.marketcar_subtitle')}
                        description={t('landing.marketcar_desc')}
                        icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                    />
                    <FeatureCard
                        title={t('landing.mapstore_title')}
                        subtitle={t('landing.mapstore_subtitle')}
                        description={t('landing.mapstore_desc')}
                        icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    />
                </div>
            </div>

            <PWAInstallModal
                isOpen={showInstallModal}
                onClose={() => setShowInstallModal(false)}
                platform={selectedPlatform}
            />
        </div>
    )
}

function AdvantageItem({ title, desc, icon }: { title: string, desc: string, icon: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center text-center">
            <div className="mb-6 w-16 h-16 bg-primary-700/20 rounded-full flex items-center justify-center text-primary-500">
                {icon}
            </div>
            <h3 className="text-2xl font-bold mb-4">{title}</h3>
            <p className="text-gray-400">{desc}</p>
        </div>
    )
}

function FeatureCard({ title, subtitle, description, icon }: { title: string, subtitle: string, description: string, icon: React.ReactNode }) {
    return (
        <div className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:scale-[1.02]">
            <div className="mb-6 w-16 h-16 bg-primary-700/20 rounded-2xl flex items-center justify-center group-hover:bg-primary-700/30 transition">
                {icon}
            </div>
            <div className="mb-3">
                <h3 className="text-2xl font-black text-text-primary mb-1">{title}</h3>
                <p className="text-sm text-primary-400 font-medium uppercase tracking-wider">{subtitle}</p>
            </div>
            <p className="text-gray-400 leading-relaxed">{description}</p>
        </div>
    )
}
