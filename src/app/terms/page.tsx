'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ShieldCheck, Scale, AlertOctagon, Lock, Eye, CreditCard } from 'lucide-react'

export default function TermsPage() {
    const router = useRouter()

    const sections = [
        {
            title: "1. Aceptación de los Términos",
            icon: <ShieldCheck className="text-primary-500" size={24} />,
            content: "Al acceder, descargar o utilizar la plataforma CarMatch (en adelante, 'la Aplicación' o 'el Sitio'), usted (en adelante, 'el Usuario') acepta quedar legalmente vinculado por los presentes Términos y Condiciones. El uso continuado de la plataforma tras cualquier modificación de los mismos constituye su aceptación tácita. Si no está de acuerdo con el presente clausulado, deberá eliminar su cuenta y desinstalar la Aplicación de inmediato."
        },
        {
            title: "2. Limitación de Responsabilidad e Indemnidad",
            icon: <Scale className="text-amber-500" size={24} />,
            content: "CarMatch funciona EXCLUSIVAMENTE como un punto de encuentro tecnológico de intermediación pasiva. CarMatch NO interviene en las negociaciones, NO es parte en el contrato de compraventa y NO garantiza la legalidad, seguridad, calidad o veracidad de los bienes anunciados. Bajo ninguna circunstancia CarMatch, sus fundadores, desarrolladores o afiliados serán responsables por pérdidas financieras, daños físicos, fraudes, vicios ocultos de las unidades o incumplimientos contractuales entre los usuarios."
        },
        {
            title: "3. Descargo de Responsabilidad en Funciones de Seguridad",
            icon: <AlertOctagon className="text-red-500" size={24} />,
            content: "Las funcionalidades de 'Misión Segura', el 'Botón SOS' y los 'Puntos de Encuentro' se ofrecen como un valor añadido 'tal cual' (as is). El Usuario reconoce que estas herramientas dependen de servicios externos de terceros (como GPS y redes de datos) y NO garantizan la integridad física ni la respuesta inmediata de las autoridades. El Usuario asume todo el riesgo al concretar citas presenciales con desconocidos."
        },
        {
            title: "4. Política de Monetización y Abuso del Sistema",
            icon: <CreditCard className="text-green-500" size={24} />,
            content: "La oferta de 'primer vehículo gratis' está limitada estrictamente a una unidad por habitante/dispositivo/entidad. CarMatch emplea herramientas forenses de identificación digital para evitar el fraude. Cualquier intento de eludir estas restricciones (uso de proxy, VPN, múltiples correos para una misma persona física) conllevará la suspensión inmediata de todas las publicaciones asociadas y el veto permanente del usuario."
        },
        {
            title: "5. Propiedad Intelectual y Conducta del Usuario",
            icon: <Lock className="text-gray-500" size={24} />,
            content: "Todo el contenido, marcas y algoritmos de CarMatch son propiedad exclusiva de la empresa. El Usuario otorga a CarMatch una licencia perpetua e irrevocable para mostrar y distribuir las imágenes y descripciones subidas a la plataforma. Queda prohibido el uso de 'scrapers' o cualquier método de extracción masiva de datos de nuestra base de datos."
        },
        {
            title: "6. Consentimiento de Geolocalización",
            icon: <Eye className="text-blue-500" size={24} />,
            content: "El Usuario otorga su consentimiento expreso para que la Aplicación recopile datos de ubicación precisa. Estos datos son fundamentales para el funcionamiento del Mapa en Tiempo Real y los protocolos de seguridad. CarMatch no vende datos de ubicación a terceros, pero sí los compartirá con las autoridades competentes en caso de activación de protocolos de emergencia SOS."
        },
        {
            title: "7. Jurisdicción y Ley Aplicable",
            icon: <ShieldCheck className="text-primary-500" size={24} />,
            content: "Cualquier controversia derivada del uso de la Aplicación se someterá a las leyes y tribunales competentes de la Ciudad de México, renunciando expresamente a cualquier otro fuero que pudiera corresponder por razón de domicilio presente o futuro."
        }
    ]

    return (
        <div className="min-h-screen bg-background pb-12">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-surface-highlight px-4 py-4">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-surface-highlight rounded-full transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-lg font-black uppercase tracking-widest text-text-primary">Legal</h1>
                    <div className="w-10"></div>
                </div>
            </div>

            <main className="max-w-3xl mx-auto p-6 space-y-10">
                <div className="space-y-4 text-center py-8">
                    <div className="inline-block p-4 bg-primary-500/10 rounded-full border border-primary-500/20 mb-4 animate-pulse">
                        <ShieldCheck className="text-primary-500" size={48} />
                    </div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tight text-text-primary leading-tight">
                        Términos y Condiciones <br /> de Uso Profesional
                    </h2>
                    <p className="text-text-secondary text-sm font-medium">Última revisión: 27 de Enero, 2026</p>
                </div>

                <div className="space-y-6">
                    {sections.map((section, idx) => (
                        <div key={idx} className="group bg-surface border border-surface-highlight p-6 rounded-[2rem] space-y-4 hover:border-primary-500/40 hover:bg-surface-highlight/10 transition-all duration-500">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-surface-highlight rounded-2xl group-hover:scale-110 transition-transform duration-500">
                                    {section.icon}
                                </div>
                                <h3 className="text-lg font-black uppercase tracking-tight text-text-primary">{section.title}</h3>
                            </div>
                            <p className="text-text-secondary leading-relaxed text-sm">
                                {section.content}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="pt-12 border-t border-surface-highlight text-center space-y-6">
                    <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-3xl">
                        <p className="text-xs text-text-secondary leading-relaxed italic max-w-xl mx-auto">
                            "IMPORTANTE: CarMatch no garantiza la veracidad de los anuncios ni se involucra en los procesos de compraventa o pagos. El uso de la plataforma es bajo su propio riesgo y responsabilidad."
                        </p>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary opacity-30">
                        CarMatch Legal Department
                    </div>
                </div>
            </main>
        </div>
    )
}
