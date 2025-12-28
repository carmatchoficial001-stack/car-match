import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import MobileNav from "@/components/MobileNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "CarMatch - Compra, Vende y Descubre Vehículos",
    description: "Red social para compra, venta y descubrimiento de vehículos y negocios automotrices en tiempo real",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "CarMatch",
    },
    icons: {
        icon: [
            { url: "/icon-192-v5.png", sizes: "192x192", type: "image/png" },
            { url: "/icon-512-v5.png", sizes: "512x512", type: "image/png" }
        ],
        apple: [
            { url: "/icon-192-v5.png" }
        ]
    }
};

// Viewport export (Next.js 15+)
export const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover", // For iPhone notch
    themeColor: "#0f172a"
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className="dark">
            <body className={`${inter.className} min-h-screen-safe overflow-x-hidden`}>
                <Providers>
                    <main className="pb-20 md:pb-0">
                        {children}
                    </main>
                    <MobileNav />
                </Providers>
            </body>
        </html>
    );
}
