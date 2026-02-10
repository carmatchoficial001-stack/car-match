import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import MobileNav from "@/components/MobileNav";
import OpenInBrowserBanner from "@/components/OpenInBrowserBanner";
import { ResponsiveViewportFix } from "./responsive-viewport-fix";
import Header from "@/components/Header";
import RestoringSessionOverlay from "@/components/RestoringSessionOverlay";
import RestoreSessionModal from "@/components/RestoreSessionModal";
import InstallInvasiveBanner from "@/components/InstallInvasiveBanner";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import CookieConsentBanner from "@/components/CookieConsentBanner";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    metadataBase: new URL("https://carmatchapp.net"),
    title: "CarMatch | Vende Tu Carro GRATIS y Gana Dinero Extra | App #1 México - Red Social Automotriz",
    description: "💰 Vende tu carro SIN comisiones en CarMatch | 🚗 Publica GRATIS y recibe ofertas al instante | 💸 Compra autos usados directo del dueño | 🔍 Miles de vehículos nuevos cada día | Red social automotriz más grande de México. ¡Únete ahora!",
    alternates: {
        canonical: "https://carmatchapp.net",
        languages: {
            'es': 'https://carmatchapp.net',
            'en': 'https://carmatchapp.net/en',
            'ar': 'https://carmatchapp.net/ar',
            'de': 'https://carmatchapp.net/de',
            'fr': 'https://carmatchapp.net/fr',
            'hi': 'https://carmatchapp.net/hi',
            'it': 'https://carmatchapp.net/it',
            'ja': 'https://carmatchapp.net/ja',
            'ko': 'https://carmatchapp.net/ko',
            'pt': 'https://carmatchapp.net/pt',
            'ru': 'https://carmatchapp.net/ru',
            'zh': 'https://carmatchapp.net/zh',
            'x-default': 'https://carmatchapp.net',
        },
    },
    verification: {
        google: "u4BWC_7mrWziSal62PD0Jv6grcjI6Pl2zHOnc0Jcdxg",
    },
    keywords: [
        // HIGH-INTENT COMMERCIAL (Priority #1 for SEO)
        "vender carro gratis", "compra venta autos", "comprar autos usados", "marketplace autos mexico",
        "autos seminuevos", "carros usados baratos", "venta de autos", "compra de carros",

        // LONG-TAIL HIGH-CONVERSION
        "donde vender mi carro rapido", "comprar auto usado seguro", "vender carro sin intermediarios",
        "marketplace autos confiable", "comprar carro particular", "autos usados certificados",

        // CORE BRAND (After commercial for better ranking)
        "CarMatch", "CarMatch App", "CarMatch México", "car match", "app autos mexico",
        "aplicacion vender carro", "descargar CarMatch", "instalar CarMatch",

        // TIPOS DE VEHÍCULOS
        "autos usados", "carros", "vehiculos", "camionetas usadas", "pickups seminuevos",
        "SUV usadas mexico", "sedanes economicos", "autos compactos", "carros automaticos",
        "motos usadas", "autos hibridos usados", "carros electricos", "carros deportivos",

        // MAP STORE Y SERVICIOS (High Local Intent)
        "mecanico cerca de mi", "taller mecanico confiable", "talleres mecanicos 24 horas",
        "desponchadora abierta", "servicios automotrices mexico", "auxilio vial",
        "grua 24 horas", "mecanico a domicilio", "refacciones cerca de mi",
        "carwash cerca", "llantera abierta ahora", "mapa de negocios", "directorio automotriz",

        // REGIONAL Y CIUDADES
        "compra venta autos cdmx", "autos usados juarez", "refacciones juarez",
        "carros usados monterrey", "autos guadalajara", "vender auto tijuana",
        "marketplace autos mexico", "carros en venta mexico",

        // SAFETY Y TRUST
        "compra segura autos", "cita segura vender auto", "verificar auto usado",
        "como comprar auto usado seguro", "evitar fraude compra auto",

        // ENGAGEMENT (Lower priority but included)
        "tinder de carros", "swipe autos", "app comprar carros", "app vender auto",
        "marketplace autos movil", "PWA autos", "match de carros", "encontrar auto ideal",

        // LEGAL/SOCIAL COVERAGE (Last for compliance, not SEO priority)
        "CarMatch Social", "CarMatch Official", "CarMatch Oficial", "red social de autos",
        "red social automotriz", "social network cars", "comunidad automotriz",
        "foro autos mexico", "red social autos"
    ],
    manifest: "/app-v1.webmanifest",
    authors: [{ name: "CarMatch" }],
    creator: "CarMatch",
    publisher: "CarMatch",
    openGraph: {
        type: "website",
        locale: "es_MX",
        url: "https://carmatchapp.net",
        siteName: "CarMatch - Red Social Automotriz",
        title: "CarMatch | Compra y Vende Autos GRATIS | App #1 México",
        description: "💰 Vende tu carro SIN comisiones | 🚗 Compra autos usados directo del dueño | 🔍 Encuentra talleres mecánicos 24/7 | La red social automotriz más grande de México. ¡Miles de vehículos nuevos cada día!",
        images: [
            {
                url: "/icon-512-v20.png?v=22", // ✨ Logo v20 maximizado
                width: 512,
                height: 512,
                alt: "CarMatch | Marketplace Oficial",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "CarMatch | Compra y Vende Autos GRATIS - Marketplace #1 México",
        description: "💸 Publica GRATIS y recibe ofertas al instante | 🚗 Miles de autos usados | 🔧 Encuentra talleres 24/7 | La app definitiva que revoluciona el sector automotriz en México.",
        images: ["/icon-512-v20.png?v=22"], // ✨ Logo v20 maximizado
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "CarMatch",
    },
    icons: {
        icon: [
            { url: "/icon-192-v20.png?v=22", sizes: "192x192" },
            { url: "/favicon-v20.png?v=22", sizes: "32x32" },
        ],
        shortcut: "/icon-192-v20.png?v=22",
        apple: "/icon-192-v20.png?v=22",
        other: [
            {
                rel: 'maskable-icon',
                url: '/maskable-192-v20.png?v=22',
            },
        ],
    }
};

export const viewport: Viewport = {
    themeColor: "#0f172a",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
    colorScheme: "dark",
};

import PushNotificationRequest from "@/components/PushNotificationRequest";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className="dark" style={{ colorScheme: 'dark' }}>
            <body className={`${inter.className} min-h-screen-safe overflow-x-hidden bg-[#0f172a]`}>

                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify([
                            {
                                "@context": "https://schema.org",
                                "@type": "Organization",
                                "name": "CarMatch Social",
                                "alternateName": "CarMatch",
                                "url": "https://carmatchapp.net",
                                "logo": "https://carmatchapp.net/icon-512-v20.png?v=22", // ✨ Logo v20 maximizado
                                "sameAs": [
                                    "https://www.facebook.com/share/1AVsMtGGrG/",
                                    "https://www.instagram.com/car.matchoficial?igsh=MWR2cjN5bGVmZzdoeQ=="
                                ],
                                "description": "CarMatch Social es la plataforma líder en México para la compra y venta de piezas y vehículos, conectando usuarios con servicios automotrices 24/7."
                            },
                            {
                                "@context": "https://schema.org",
                                "@type": "WebSite",
                                "url": "https://carmatchapp.net",
                                "potentialAction": [
                                    {
                                        "@type": "SearchAction",
                                        "target": {
                                            "@type": "EntryPoint",
                                            "urlTemplate": "https://carmatchapp.net/market?search={search_term_string}"
                                        },
                                        "query-input": "required name=search_term_string"
                                    },
                                    {
                                        "@type": "SearchAction",
                                        "target": {
                                            "@type": "EntryPoint",
                                            "urlTemplate": "https://carmatchapp.net/map-store?search={search_term_string}"
                                        },
                                        "query-input": "required name=search_term_string"
                                    }
                                ]
                            },
                            {
                                "@context": "https://schema.org",
                                "@type": "SoftwareApplication",
                                "name": "CarMatch Social",
                                "alternateName": "CarMatch Social App",
                                "url": "https://carmatchapp.net",
                                "applicationCategory": "ShoppingApplication, SocialNetworkingApplication",
                                "operatingSystem": "iOS, Android, Windows, macOS",
                                "description": "La aplicación líder para comprar, vender y descubrir vehículos. CarMatch Social incluye Buscadores Expertos para vehículos y detección de fallas mecánicas.",
                                "softwareVersion": "1.0.0",
                                "screenshot": "https://carmatchapp.net/icon-512-v20.png?v=22",
                                "offers": {
                                    "@type": "Offer",
                                    "price": "0",
                                    "priceCurrency": "USD"
                                },
                                "aggregateRating": {
                                    "@type": "AggregateRating",
                                    "ratingValue": "4.9",
                                    "ratingCount": "1250"
                                }
                            },
                            // 🎯 NEW: FAQPage Schema para Rich Snippets
                            {
                                "@context": "https://schema.org",
                                "@type": "FAQPage",
                                "mainEntity": [
                                    {
                                        "@type": "Question",
                                        "name": "¿Cómo vendo mi carro gratis en CarMatch?",
                                        "acceptedAnswer": {
                                            "@type": "Answer",
                                            "text": "Tu primer vehículo se publica GRATIS por 6 meses completos. Solo regístrate, sube fotos de calidad y describe tu auto. Aparecerá en MarketCar y en el feed CarMatch para máxima visibilidad."
                                        }
                                    },
                                    {
                                        "@type": "Question",
                                        "name": "¿Qué es el feed CarMatch estilo Tinder?",
                                        "acceptedAnswer": {
                                            "@type": "Answer",
                                            "text": "Es una forma rápida y divertida de descubrir vehículos. Desliza a la derecha (Like) para guardar en favoritos o a la izquierda (Dislike) para ocultar. Perfecto para explorar mientras esperas el transporte."
                                        }
                                    },
                                    {
                                        "@type": "Question",
                                        "name": "¿Cómo encuentro un taller mecánico 24 horas cerca de mí?",
                                        "acceptedAnswer": {
                                            "@type": "Answer",
                                            "text": "Usa nuestro Map Store con búsqueda inteligente por IA. Solo describe tu problema (ej: 'mi carro hace ruido al frenar') y te mostramos talleres especializados cercanos con servicio 24/7 o a domicilio."
                                        }
                                    },
                                    {
                                        "@type": "Question",
                                        "name": "¿Es seguro comprar autos en CarMatch?",
                                        "acceptedAnswer": {
                                            "@type": "Answer",
                                            "text": "Sí. CarMatch cuenta con sistema de Cita Segura, recordatorios automáticos, alertas SOS con geolocalización y un Asesor IA que te da consejos de verificación antes de comprar. Nunca vayas solo a una cita."
                                        }
                                    },
                                    {
                                        "@type": "Question",
                                        "name": "¿CarMatch cobra comisión por ventas?",
                                        "acceptedAnswer": {
                                            "@type": "Answer",
                                            "text": "NO. CarMatch NUNCA cobra comisión por ventas. Solo cobras créditos si publicas más de un vehículo o después del periodo gratuito. La negociación y pago es 100% directo entre comprador y vendedor."
                                        }
                                    }
                                ]
                            },
                            // 🏢 NEW: LocalBusiness Schema para Map Store
                            {
                                "@context": "https://schema.org",
                                "@type": "LocalBusiness",
                                "name": "CarMatch Map Store",
                                "description": "Directorio en tiempo real de talleres mecánicos, desponchadoras, refaccionarias y servicios automotrices con filtros de servicio 24/7 y a domicilio",
                                "url": "https://carmatchapp.net/map-store",
                                "logo": "https://carmatchapp.net/icon-512-v20.png?v=22",
                                "geo": {
                                    "@type": "GeoCoordinates",
                                    "latitude": "31.6904",
                                    "longitude": "-106.4245"
                                },
                                "address": {
                                    "@type": "PostalAddress",
                                    "addressCountry": "MX",
                                    "addressRegion": "Chihuahua"
                                },
                                "areaServed": [
                                    {
                                        "@type": "Country",
                                        "name": "México"
                                    },
                                    {
                                        "@type": "City",
                                        "name": "Ciudad Juárez"
                                    },
                                    {
                                        "@type": "City",
                                        "name": "Ciudad de México"
                                    },
                                    {
                                        "@type": "City",
                                        "name": "Monterrey"
                                    },
                                    {
                                        "@type": "City",
                                        "name": "Guadalajara"
                                    }
                                ],
                                "priceRange": "Gratis",
                                "openingHours": "Mo-Su 00:00-23:59"
                            },
                            // 📋 NEW: ItemList Schema para los tres feeds
                            {
                                "@context": "https://schema.org",
                                "@type": "ItemList",
                                "name": "Funcionalidades Principales de CarMatch",
                                "description": "Triple experiencia única para el mercado automotriz",
                                "itemListElement": [
                                    {
                                        "@type": "ListItem",
                                        "position": 1,
                                        "name": "MarketCar - Marketplace Tradicional",
                                        "description": "Busca y compara autos usados con filtros avanzados por marca, modelo, precio, ciudad y características específicas",
                                        "url": "https://carmatchapp.net/market"
                                    },
                                    {
                                        "@type": "ListItem",
                                        "position": 2,
                                        "name": "CarMatch Swipe - Feed Tipo Tinder",
                                        "description": "Descubre vehículos de forma rápida y divertida con sistema de deslizamiento. Like para guardar, Dislike para ocultar",
                                        "url": "https://carmatchapp.net/swipe"
                                    },
                                    {
                                        "@type": "ListItem",
                                        "position": 3,
                                        "name": "Map Store - Mapa de Negocios 24/7",
                                        "description": "Encuentra talleres, desponchadoras, refaccionarias y servicios automotrices cerca de ti con búsqueda inteligente por IA",
                                        "url": "https://carmatchapp.net/map-store"
                                    }
                                ]
                            }
                        ])
                    }}
                />
                <GoogleAnalytics />
                <Providers>
                    <InstallInvasiveBanner />
                    <PushNotificationRequest />
                    <OpenInBrowserBanner />
                    <ResponsiveViewportFix />
                    <RestoringSessionOverlay />
                    <RestoreSessionModal />
                    <CookieConsentBanner />

                    {/* App Shell Architecture: Fixed Viewport + Internal Scroll */}
                    <div className="flex flex-col h-[100dvh] w-full overflow-hidden relative">
                        <Header />

                        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-[80px] md:pb-0 scroll-smooth overscroll-behavior-y-contain">
                            {children}
                        </main>

                        <MobileNav />
                    </div>
                </Providers>
            </body>
        </html>
    );
}
