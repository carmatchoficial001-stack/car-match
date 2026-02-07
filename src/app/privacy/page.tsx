import Header from '@/components/Header'

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background pb-32">
            <div className="container mx-auto px-4 pt-8 pb-8 max-w-4xl text-text-primary">
                <h1 className="text-3xl font-bold mb-6">Política de Privacidad</h1>

                <div className="prose prose-invert max-w-none space-y-6">
                    <p className="opacity-80">Última actualización: {new Date().toLocaleDateString()}</p>

                    <section>
                        <h2 className="text-xl font-bold text-primary-500 mb-2">1. Compromiso de Privacidad</h2>
                        <p>
                            En CarMatch, valoramos su confianza y nos comprometemos a proteger su información personal.
                            Esta política describe cómo recopilamos, usamos y protegemos sus datos.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-primary-500 mb-2">2. Uso de la Información</h2>
                        <p>
                            Utilizamos la información recopilada exclusivamente para:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Proporcionar y mejorar nuestros servicios de mapas y marketplace.</li>
                            <li>Facilitar la comunicación entre compradores y vendedores.</li>
                            <li>Personalizar su experiencia en la plataforma.</li>
                            <li>Garantizar la seguridad y prevenir fraudes.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-primary-500 mb-2">3. Protección de Datos</h2>
                        <p>
                            Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos contra acceso no autorizado.
                            <br /><br />
                            <strong>No vendemos ni alquilamos su información personal a terceros.</strong> Sus datos son suyos y se utilizan únicamente para mejorar su experiencia dentro de CarMatch.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-primary-500 mb-2">4. Ubicación</h2>
                        <p>
                            Utilizamos su ubicación para mostrarle vehículos y negocios cercanos relevantes. Puede desactivar el acceso a la ubicación en cualquier momento desde la configuración de su dispositivo.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-primary-500 mb-2">5. Contacto</h2>
                        <p>
                            Si tiene preguntas sobre esta política, contáctenos a través de nuestro soporte en la aplicación.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}
