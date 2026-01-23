"use client"

import { useEffect } from 'react'

/**
 * 🔧 Fix para el problema de viewport en móviles
 * 
 * Este componente fuerza la actualización del viewport inmediatamente
 * cuando se monta en el lado del cliente, evitando que primero se muestre
 * la versión de escritorio.
 */
export function ResponsiveViewportFix() {
    useEffect(() => {
        const updateViewport = () => {
            let meta = document.querySelector('meta[name="viewport"]');
            const content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover, interactive-widget=resizes-content";

            if (!meta) {
                meta = document.createElement("meta");
                (meta as HTMLMetaElement).name = "viewport";
                document.getElementsByTagName("head")[0].appendChild(meta);
            }

            if (meta.getAttribute("content") !== content) {
                meta.setAttribute("content", content);
            }
        };

        // Initial check and immediate reinforcement
        updateViewport();

        // Prevent zooming on iOS double tap/pinch
        const preventZoom = (e: TouchEvent) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        };

        // Additional reinforcement for Safari
        const handleGestureStart = (e: Event) => e.preventDefault();

        document.addEventListener('gesturestart', handleGestureStart);
        document.addEventListener('touchstart', preventZoom as any, { passive: false });

        // Hydration check and periodic reinforcement
        const timer = setTimeout(updateViewport, 500);
        const interval = setInterval(updateViewport, 2000);

        // Safari iOS 100vh Fix
        const handleResize = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
            document.removeEventListener('gesturestart', handleGestureStart);
            document.removeEventListener('touchstart', preventZoom as any);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    return null;
}
