// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

'use client'

import { useRouter } from 'next/navigation'
import { Shield, Mail, MapPin, FileText, Clock, Lock, Eye, Database, Share2, AlertCircle } from 'lucide-react'

export default function PrivacyPage() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-background pb-32">
            <div className="container mx-auto px-4 pt-8 pb-8 max-w-4xl text-text-primary">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="inline-block p-4 bg-primary-500/10 rounded-full border border-primary-500/20 mb-4">
                        <Shield className="text-primary-500" size={48} />
                    </div>
                    <h1 className="text-4xl font-bold mb-2">Aviso de Privacidad</h1>
                    <p className="text-text-secondary text-sm">
                        Última actualización: 6 de febrero de 2026
                    </p>
                </div>

                <div className="prose prose-invert max-w-none space-y-8">
                    {/* 1. Responsable */}
                    <section className="bg-surface border border-surface-highlight p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary-500/10 rounded-lg">
                                <FileText className="text-primary-500" size={20} />
                            </div>
                            <h2 className="text-2xl font-bold text-primary-500 m-0">1. Responsable del Tratamiento</h2>
                        </div>
                        <div className="space-y-2 text-text-secondary">
                            <p><strong className="text-text-primary">Denominación:</strong> CarMatch Social</p>
                            <p><strong className="text-text-primary">RFC:</strong> Persona física en proceso de alta ante SAT</p>
                            <p><strong className="text-text-primary">Domicilio:</strong> México (se especificará al obtener RFC)</p>
                            <p><strong className="text-text-primary">Sitio web:</strong> https://carmatchapp.net</p>
                            <p className="text-xs mt-4 italic">
                                CarMatch Social es responsable del uso y protección de sus datos personales conforme a la
                                Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
                            </p>
                        </div>
                    </section>

                    {/* 2. Datos que recopilamos */}
                    <section className="bg-surface border border-surface-highlight p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Database className="text-blue-500" size={20} />
                            </div>
                            <h2 className="text-2xl font-bold text-blue-500 m-0">2. Datos Personales que Recopilamos</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-bold text-text-primary mb-2">📝 Datos de Identificación:</h3>
                                <ul className="list-disc pl-6 space-y-1 text-text-secondary">
                                    <li>Nombre completo</li>
                                    <li>Correo electrónico</li>
                                    <li>Número de teléfono (opcional)</li>
                                    <li>Fotografía de perfil (opcional)</li>
                                    <li>Cuenta de Google (si usas login con Google)</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-text-primary mb-2">📍 Datos de Ubicación:</h3>
                                <ul className="list-disc pl-6 space-y-1 text-text-secondary">
                                    <li>Ubicación GPS precisa (con tu consentimiento)</li>
                                    <li>Ciudad actual</li>
                                    <li>Historial de ubicaciones (solo para función SOS)</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-text-primary mb-2">🚗 Datos de Publicaciones:</h3>
                                <ul className="list-disc pl-6 space-y-1 text-text-secondary">
                                    <li>Fotos de vehículos o negocios</li>
                                    <li>Descripción de vehículos</li>
                                    <li>Precios y características</li>
                                    <li>Información de contacto en publicaciones</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-text-primary mb-2">💬 Datos de Interacción:</h3>
                                <ul className="list-disc pl-6 space-y-1 text-text-secondary">
                                    <li>Mensajes entre usuarios</li>
                                    <li>Favoritos y likes</li>
                                    <li>Historial de búsquedas</li>
                                    <li>Reportes y denuncias</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-text-primary mb-2">📊 Datos Técnicos:</h3>
                                <ul className="list-disc pl-6 space-y-1 text-text-secondary">
                                    <li>Dirección IP</li>
                                    <li>Tipo de dispositivo y navegador</li>
                                    <li>Cookies y tecnologías de rastreo</li>
                                    <li>Datos de Google Analytics (anónimos)</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* 3. Finalidades */}
                    <section className="bg-surface border border-surface-highlight p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <Eye className="text-green-500" size={20} />
                            </div>
                            <h2 className="text-2xl font-bold text-green-500 m-0">3. Finalidades del Tratamiento</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-bold text-text-primary mb-2">🎯 Finalidades Primarias (Necesarias):</h3>
                                <ul className="list-disc pl-6 space-y-1 text-text-secondary">
                                    <li>Crear y gestionar tu cuenta de usuario</li>
                                    <li>Publicar y mostrar vehículos o negocios</li>
                                    <li>Facilitar comunicación entre compradores y vendedores</li>
                                    <li>Mostrar vehículos y negocios cercanos según tu ubicación</li>
                                    <li>Activar funciones de seguridad (Misión Segura, SOS)</li>
                                    <li>Dar soporte técnico</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-text-primary mb-2">✨ Finalidades Secundarias (Opcionales):</h3>
                                <ul className="list-disc pl-6 space-y-1 text-text-secondary">
                                    <li>Enviar notificaciones de nuevas publicaciones</li>
                                    <li>Personalizar tu experiencia en la plataforma</li>
                                    <li>Análisis estadístico y mejora de servicios</li>
                                    <li>Marketing y promociones (solo si aceptas)</li>
                                </ul>
                                <p className="text-xs mt-2 italic text-amber-400">
                                    Puedes negarte a las finalidades secundarias sin afectar tu acceso a la plataforma.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 4. Transferencias */}
                    <section className="bg-surface border border-surface-highlight p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <Share2 className="text-amber-500" size={20} />
                            </div>
                            <h2 className="text-2xl font-bold text-amber-500 m-0">4. Transferencias a Terceros</h2>
                        </div>

                        <p className="text-text-secondary mb-4">
                            CarMatch Social puede compartir tus datos con los siguientes terceros:
                        </p>

                        <ul className="list-disc pl-6 space-y-2 text-text-secondary">
                            <li><strong className="text-text-primary">Google LLC:</strong> Para autenticación (Google Login) y análisis (Google Analytics)</li>
                            <li><strong className="text-text-primary">Cloudinary:</strong> Para almacenamiento y optimización de imágenes</li>
                            <li><strong className="text-text-primary">Vercel Inc.:</strong> Para hosting y entrega de contenido</li>
                            <li><strong className="text-text-primary">Autoridades competentes:</strong> Solo en caso de activación de SOS o solicitud legal</li>
                        </ul>

                        <div className="mt-4 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                            <p className="text-sm text-text-secondary">
                                <strong className="text-red-400">IMPORTANTE:</strong> NO vendemos ni rentamos tus datos personales a terceros con fines comerciales.
                            </p>
                        </div>
                    </section>

                    {/* 5. Derechos ARCO */}
                    <section className="bg-surface border border-surface-highlight p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Lock className="text-purple-500" size={20} />
                            </div>
                            <h2 className="text-2xl font-bold text-purple-500 m-0">5. Derechos ARCO</h2>
                        </div>

                        <p className="text-text-secondary mb-4">
                            Tienes derecho a <strong className="text-text-primary">Acceder, Rectificar, Cancelar y Oponerte</strong> al tratamiento de tus datos personales:
                        </p>

                        <ul className="list-disc pl-6 space-y-2 text-text-secondary">
                            <li><strong className="text-text-primary">Acceso:</strong> Conocer qué datos tenemos sobre ti</li>
                            <li><strong className="text-text-primary">Rectificación:</strong> Corregir datos incorrectos</li>
                            <li><strong className="text-text-primary">Cancelación:</strong> Eliminar tu cuenta y datos</li>
                            <li><strong className="text-text-primary">Oposición:</strong> Negarte a ciertos usos de tus datos</li>
                        </ul>

                        <div className="mt-4 p-4 bg-primary-500/5 border border-primary-500/20 rounded-lg">
                            <p className="text-sm text-text-secondary">
                                <strong className="text-primary-400">¿Cómo ejercer tus derechos?</strong><br />
                                1. Ve a Configuración → Privacidad en la app<br />
                                2. O contáctanos vía soporte en la aplicación<br />
                                3. Responderemos en máximo 20 días hábiles
                            </p>
                        </div>
                    </section>

                    {/* 6. Retención */}
                    <section className="bg-surface border border-surface-highlight p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-cyan-500/10 rounded-lg">
                                <Clock className="text-cyan-500" size={20} />
                            </div>
                            <h2 className="text-2xl font-bold text-cyan-500 m-0">6. Tiempo de Conservación</h2>
                        </div>

                        <ul className="list-disc pl-6 space-y-2 text-text-secondary">
                            <li><strong className="text-text-primary">Cuenta activa:</strong> Mientras uses la plataforma</li>
                            <li><strong className="text-text-primary">Cuenta desactivada:</strong> 90 días (por si cambias de opinión)</li>
                            <li><strong className="text-text-primary">Historial de transacciones:</strong> 5 años (obligación fiscal)</li>
                            <li><strong className="text-text-primary">Datos de SOS:</strong> 1 año (seguridad y posibles investigaciones)</li>
                        </ul>
                    </section>

                    {/* 7. Seguridad */}
                    <section className="bg-surface border border-surface-highlight p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-500/10 rounded-lg">
                                <AlertCircle className="text-red-500" size={20} />
                            </div>
                            <h2 className="text-2xl font-bold text-red-500 m-0">7. Medidas de Seguridad</h2>
                        </div>

                        <p className="text-text-secondary mb-4">
                            Implementamos medidas de seguridad físicas, técnicas y administrativas:
                        </p>

                        <ul className="list-disc pl-6 space-y-1 text-text-secondary">
                            <li>Encriptación SSL/TLS en toda la comunicación</li>
                            <li>Autenticación segura con Google OAuth</li>
                            <li>Servidores protegidos en infraestructura de Vercel</li>
                            <li>Backups automáticos y cifrados</li>
                            <li>Control de acceso estricto a bases de datos</li>
                        </ul>
                    </section>

                    {/* 8. Cookies */}
                    <section className="bg-surface border border-surface-highlight p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-orange-500/10 rounded-lg">
                                <Eye className="text-orange-500" size={20} />
                            </div>
                            <h2 className="text-2xl font-bold text-orange-500 m-0">8. Cookies y Tecnologías de Rastreo</h2>
                        </div>

                        <p className="text-text-secondary mb-4">
                            Usamos cookies para mejorar tu experiencia. Para más detalles, consulta nuestra{' '}
                            <a href="/cookies" className="text-primary-400 hover:text-primary-300 underline">
                                Política de Cookies
                            </a>.
                        </p>
                    </section>

                    {/* 9. Cambios */}
                    <section className="bg-surface border border-surface-highlight p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gray-500/10 rounded-lg">
                                <FileText className="text-gray-400" size={20} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-400 m-0">9. Modificaciones al Aviso</h2>
                        </div>

                        <p className="text-text-secondary">
                            CarMatch Social se reserva el derecho de modificar este aviso de privacidad.
                            Los cambios serán notificados en la aplicación y publicados en esta página con la nueva fecha de actualización.
                        </p>
                    </section>

                    {/* 10. Contacto */}
                    <section className="bg-surface border border-surface-highlight p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary-500/10 rounded-lg">
                                <Mail className="text-primary-500" size={20} />
                            </div>
                            <h2 className="text-2xl font-bold text-primary-500 m-0">10. Contacto</h2>
                        </div>

                        <p className="text-text-secondary">
                            Para cualquier duda sobre este aviso de privacidad o para ejercer tus derechos ARCO:<br /><br />
                            <strong className="text-text-primary">Soporte:</strong> A través de la aplicación<br />
                            <strong className="text-text-primary">Sitio web:</strong> https://carmatchapp.net
                        </p>
                    </section>

                    {/* Footer */}
                    <div className="text-center pt-8 border-t border-surface-highlight">
                        <p className="text-xs text-text-secondary opacity-50">
                            CarMatch Social - Aviso de Privacidad conforme LFPDPPP
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
