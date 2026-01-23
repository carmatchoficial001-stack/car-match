import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import MobileNav from "@/components/MobileNav";
import OpenInBrowserBanner from "@/components/OpenInBrowserBanner";
import { ResponsiveViewportFix } from "./responsive-viewport-fix";
import RestoringSessionOverlay from "@/components/RestoringSessionOverlay";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    metadataBase: new URL("https://carmatchapp.net"),
    title: {
        default: "CarMatch® | Red Social y MarketCar Oficial • Compra y Venta de Autos",
        template: "%s | CarMatch®"
    },
    description: "CarMatch es la red social líder para comprar, vender y descubrir vehículos en México. MarketCar oficial con Modo CarMatch y MapStore 24/7 de servicios automotrices.",
    alternates: {
        canonical: "/",
    },
    verification: {
        google: "u4BWC_7mrWziSal62PD0Jv6grcjI6Pl2zHOnc0Jcdxg",
    },
    keywords: ["CarMatch", "CarMatch App", "compra venta autos", "marketplace autos mexico", "talleres mecanicos 24 horas", "auxilio vial", "refacciones juarez"],
    manifest: "/manifest.json",
    authors: [{ name: "CarMatch" }],
    creator: "CarMatch",
    publisher: "CarMatch",
    openGraph: {
        type: "website",
        locale: "es_MX",
        url: "https://carmatchapp.net",
        siteName: "CarMatch®",
        title: "CarMatch® | La Revolución Automotriz",
        description: "Desliza, encuentra y conecta. La forma más inteligente y segura de comprar autos y encontrar servicios mecánicos.",
        images: [
            {
                url: "/logo-v19.png",
                width: 1200,
                height: 630,
                alt: "CarMatch Marketplace Oficial",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "CarMatch® | El Marketplace de Autos del Futuro",
        description: "Compra, vende y encuentra servicios mecánicos en tiempo real. La app definitiva para el sector automotriz.",
        images: ["/logo-v19.png"],
    },
    icons: {
        icon: "/maskable-512-v19.png",
        shortcut: "/maskable-512-v19.png",
        apple: "/maskable-512-v19.png",
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
    interactiveWidget: "resizes-content",
};

import PushNotificationRequest from "@/components/PushNotificationRequest";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className="dark" style={{ colorScheme: 'dark' }}>
            <head>
                {/* 🔥 FORCE MOBILE VIEWPORT IMMEDIATELY (Prevents desktop-to-mobile flicker) */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                var viewport = document.querySelector('meta[name="viewport"]');
                                if (viewport) {
                                    viewport.content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover, interactive-widget=resizes-content";
                                } else {
                                    var meta = document.createElement('meta');
                                    meta.name = "viewport";
                                    meta.content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover, interactive-widget=resizes-content";
                                    document.head.appendChild(meta);
                                }
                                document.documentElement.style.colorScheme = 'dark';
                            })();
                        `
                    }}
                />
            </head>
            <body className={`${inter.className} min-h-screen-safe overflow-x-hidden bg-[#0f172a]`}>

                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify([
                            {
                                "@context": "https://schema.org",
                                "@type": "Organization",
                                "name": "CarMatch®",
                                "alternateName": "CarMatch Official",
                                "url": "https://carmatchapp.net",
                                "logo": "https://carmatchapp.net/logo-v19.png",
                                "sameAs": [
                                    "https://www.facebook.com/share/1AVsMtGGrG/",
                                    "https://www.instagram.com/car.matchoficial?igsh=MWR2cjN5bGVmZzdoeQ=="
                                ],
                                "description": "CarMatch es la plataforma líder en México para la compra y venta de piezas y vehículos, conectando usuarios con servicios automotrices 24/7."
                            },
                            {
                                "@context": "https://schema.org",
                                "@type": "SoftwareApplication",
                                "name": "CarMatch",
                                "alternateName": "CarMatch App",
                                "url": "https://carmatchapp.net",
                                "applicationCategory": "ShoppingApplication, SocialNetworkingApplication",
                                "operatingSystem": "iOS, Android, Windows, macOS",
                                "description": "La aplicación líder para comprar, vender y descubrir vehículos. Incluye Modo CarMatch y MapStore de talleres.",
                                "softwareVersion": "1.0.0",
                                "screenshot": "https://carmatchapp.net/logo-v19.png",
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
                            }
                        ])
                    }}
                />
                <Providers>
                    <PushNotificationRequest />
                    <OpenInBrowserBanner />
                    <ResponsiveViewportFix />
                    <RestoringSessionOverlay />
                    <main className="min-h-screen-safe">

                        {children}
                    </main>
                    <MobileNav />
                </Providers>
            </body>
        </html>
    );
}
