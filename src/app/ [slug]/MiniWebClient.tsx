// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
    MapPin,
    Phone,
    MessageCircle,
    Globe,
    Facebook,
    Instagram,
    Clock,
    Navigation,
    Share2,
    Star,
    ShieldCheck,
    CheckCircle2,
    Zap,
    ExternalLink,
    ChevronRight,
    ArrowLeft
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatPrice } from '@/lib/vehicleTaxonomy'

interface MiniWebProps {
    business: {
        id: string
        name: string
        category: string
        description: string | null
        address: string
        city: string
        phone: string | null
        whatsapp: string | null
        facebook: string | null
        instagram: string | null
        tiktok: string | null
        website: string | null
        telegram: string | null
        images: string[]
        services: string[]
        is24Hours: boolean
        hasEmergencyService: boolean
        hasHomeService: boolean
        hours: string | null
    }
}

export default function MiniWebClient({ business }: MiniWebProps) {
    const mainImage = business.images[0] || null
    const gallery = business.images.slice(1)

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: business.name,
                    text: `¡Mira el sitio oficial de ${business.name} en CarMatch!`,
                    url: window.location.href,
                })
            } catch (err) {
                console.log('Error sharing:', err)
            }
        }
    }

    return (
        <div className="min-h-screen bg-[#050810] text-white selection:bg-primary-500/30">
            {/* Header / Navbar Premium */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050810]/80 backdrop-blur-xl border-b border-white/5">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center font-black text-white italic">C</div>
                        <span className="font-black text-lg tracking-tighter uppercase italic">CarMatch</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleShare}
                            className="p-2 hover:bg-white/5 rounded-full transition"
                        >
                            <Share2 size={20} className="text-primary-400" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-16 h-[70vh] md:h-[85vh] overflow-hidden">
                {mainImage ? (
                    <Image
                        src={mainImage}
                        alt={business.name}
                        fill
                        className="object-cover"
                        priority
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#0c0f1a] to-[#050810] flex items-center justify-center">
                        <MapPin size={80} className="text-white/10" />
                    </div>
                )}

                {/* Glass Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050810] via-[#050810]/40 to-transparent" />

                <div className="absolute inset-0 flex flex-col justify-end">
                    <div className="container mx-auto px-4 pb-12 md:pb-24">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="max-w-3xl"
                        >
                            <div className="flex flex-wrap items-center gap-3 mb-6">
                                <span className="px-4 py-1.5 bg-primary-600 text-white text-xs font-black uppercase tracking-widest rounded-full shadow-lg shadow-primary-900/40">
                                    {business.category}
                                </span>
                                {business.is24Hours && (
                                    <span className="px-4 py-1.5 bg-green-500/10 text-green-400 border border-green-500/30 text-xs font-bold uppercase tracking-widest rounded-full backdrop-blur-md">
                                        Abierto 24 Horas
                                    </span>
                                )}
                            </div>

                            <h1 className="text-5xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter mb-6 uppercase italic">
                                {business.name}
                            </h1>

                            <p className="text-lg md:text-2xl text-gray-300 font-medium mb-8 flex items-center gap-3">
                                <MapPin className="text-primary-500" />
                                {business.city}, {business.address}
                            </p>

                            <div className="flex flex-wrap gap-4">
                                {business.whatsapp && (
                                    <a
                                        href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`}
                                        target="_blank"
                                        className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-black uppercase tracking-widest rounded-2xl flex items-center gap-3 transition-all hover:scale-105 shadow-xl shadow-green-900/20"
                                    >
                                        <MessageCircle size={24} />
                                        Contactar WhatsApp
                                    </a>
                                )}
                                <a
                                    href="#detalles"
                                    className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest rounded-2xl flex items-center gap-3 backdrop-blur-xl transition-all border border-white/10"
                                >
                                    Ver Detalles
                                    <ChevronRight size={20} />
                                </a>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main id="detalles" className="container mx-auto px-4 py-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">

                    {/* Left: Description & Services */}
                    <div className="lg:col-span-2 space-y-16">
                        <section>
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary-500 mb-6 italic">Sobre Nosotros</h2>
                            <p className="text-xl md:text-2xl text-gray-400 leading-relaxed font-light">
                                {business.description || "Bienvenidos a nuestro negocio oficial en CarMatch. Estamos comprometidos con la excelencia y la satisfacción de nuestros clientes en cada servicio que ofrecemos."}
                            </p>
                        </section>

                        {business.services.length > 0 && (
                            <section>
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary-500 mb-8 italic">Nuestros Servicios</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {business.services.map((service, i) => (
                                        <div key={i} className="flex items-center gap-4 p-5 bg-white/5 border border-white/5 rounded-2xl group hover:border-primary-500/30 transition-all">
                                            <div className="w-10 h-10 bg-primary-600/20 rounded-xl flex items-center justify-center text-primary-400 group-hover:scale-110 transition-transform">
                                                <CheckCircle2 size={24} />
                                            </div>
                                            <span className="text-lg font-bold text-gray-200">{service}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Professional Gallery Area */}
                        {gallery.length > 0 && (
                            <section>
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary-500 mb-8 italic">Galería de Trabajos</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {gallery.map((img, i) => (
                                        <motion.div
                                            key={i}
                                            whileHover={{ scale: 1.02 }}
                                            className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl"
                                        >
                                            <Image src={img} alt={`Trabajo ${i + 1}`} fill className="object-cover" />
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right: Info & Contact Card */}
                    <div className="space-y-8">
                        <div className="sticky top-24 p-8 bg-[#0c0f1a] border border-white/5 rounded-[40px] shadow-2xl">
                            <h3 className="text-2xl font-black mb-8 italic uppercase tracking-tighter">Información</h3>

                            <div className="space-y-8">
                                <div className="flex gap-5">
                                    <div className="w-12 h-12 bg-primary-600/10 rounded-2xl flex items-center justify-center text-primary-400 shrink-0">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase text-gray-500 mb-1 tracking-widest">Ubicación</p>
                                        <p className="text-lg font-medium text-gray-200">{business.address}</p>
                                        <p className="text-lg text-primary-400">{business.city}</p>
                                    </div>
                                </div>

                                {business.hours && (
                                    <div className="flex gap-5">
                                        <div className="w-12 h-12 bg-primary-600/10 rounded-2xl flex items-center justify-center text-primary-400 shrink-0">
                                            <Clock size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase text-gray-500 mb-1 tracking-widest">Horarios</p>
                                            <p className="text-lg font-medium text-gray-200">{business.hours}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-5">
                                    <div className="w-12 h-12 bg-primary-600/10 rounded-2xl flex items-center justify-center text-primary-400 shrink-0">
                                        <Phone size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase text-gray-500 mb-1 tracking-widest">Teléfono</p>
                                        <p className="text-2xl font-black text-white tracking-widest">{business.phone || "Consultar"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="mt-12 space-y-4">
                                <button
                                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${business.address}`, '_blank')}
                                    className="w-full py-5 bg-white text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-transform hover:scale-[1.02]"
                                >
                                    <Navigation size={22} />
                                    Cómo Llegar
                                </button>

                                {/* Social Connect Tags */}
                                <div className="flex flex-wrap justify-center gap-4 pt-4">
                                    {business.facebook && (
                                        <a href={business.facebook} target="_blank" className="p-3 bg-white/5 hover:bg-blue-600/20 rounded-xl transition text-blue-400">
                                            <Facebook size={24} />
                                        </a>
                                    )}
                                    {business.instagram && (
                                        <a href={business.instagram} target="_blank" className="p-3 bg-white/5 hover:bg-pink-600/20 rounded-xl transition text-pink-400">
                                            <Instagram size={24} />
                                        </a>
                                    )}
                                    {business.website && (
                                        <a href={business.website} target="_blank" className="p-3 bg-white/5 hover:bg-primary-600/20 rounded-xl transition text-primary-400">
                                            <Globe size={24} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            {/* Premium Footer */}
            <footer className="bg-[#050810] border-t border-white/5 py-20">
                <div className="container mx-auto px-4 text-center">
                    <div className="inline-flex items-center gap-3 px-6 py-2 bg-primary-600/10 rounded-full border border-primary-500/20 text-primary-400 text-xs font-black uppercase tracking-[0.2em] mb-8">
                        <ShieldCheck size={16} />
                        Negocio Verificado Pro
                    </div>
                    <p className="text-gray-500 text-sm mb-4 italic">Sitio web oficial impulsado por CarMatch Technology</p>
                    <div className="flex justify-center items-center gap-4 text-gray-600">
                        <Link href="/terms" className="text-xs hover:text-white transition">Términos</Link>
                        <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                        <Link href="/privacy" className="text-xs hover:text-white transition">Privacidad</Link>
                    </div>
                </div>
            </footer>

            {/* Mobile Sticky Contact Bar */}
            <div className="fixed bottom-6 left-6 right-6 z-50 md:hidden">
                <div className="bg-[#0c0f1a]/80 backdrop-blur-2xl p-4 rounded-[32px] border border-white/10 shadow-2xl flex items-center gap-4">
                    <a
                        href={`tel:${business.phone}`}
                        className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white"
                    >
                        <Phone size={24} />
                    </a>
                    {business.whatsapp && (
                        <a
                            href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            className="flex-1 h-14 bg-green-500 text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2"
                        >
                            <MessageCircle size={22} />
                            WhatsApp
                        </a>
                    )}
                </div>
            </div>
        </div>
    )
}
