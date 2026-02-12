"use client"

import { SessionProvider } from "next-auth/react"
import { LanguageProvider } from "@/contexts/LanguageContext"
import { LocationProvider } from "@/contexts/LocationContext"
import dynamic from "next/dynamic"

import QueryProvider from "./QueryProvider"
import HistoryShield from "@/components/HistoryShield";
import GlobalLocationGate from "@/components/GlobalLocationGate";

const AIChatbot = dynamic(() => import("@/components/AIChatbot"), { ssr: false });
const RegisterSW = dynamic(() => import("@/components/RegisterSW"), { ssr: false });
const PushNotificationRequest = dynamic(() => import("@/components/PushNotificationRequest"), { ssr: false });

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <QueryProvider>
            <SessionProvider refetchOnWindowFocus={false}>
                <LanguageProvider>
                    <LocationProvider>
                        <RegisterSW />
                        <PushNotificationRequest />
                        <HistoryShield />
                        {children}
                        <GlobalLocationGate />
                        <AIChatbot />
                    </LocationProvider>
                </LanguageProvider>
            </SessionProvider>
        </QueryProvider>
    )
}
