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
        // Enforce mobile viewport settings
        const metaViewport = document.querySelector('meta[name="viewport"]') || document.createElement('meta');
        metaViewport.setAttribute('name', 'viewport');

        // Ensure critical mobile viewport properties are present
        // We overwrite to ensure no cached 'desktop' settings remain
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover, interactive-widget=resizes-content');

        if (!metaViewport.parentElement) {
            document.head.appendChild(metaViewport);
        }

        // Prevent unwanted zoom on iOS
        const preventZoom = (e: Event) => {
            e.preventDefault();
        };

        document.addEventListener('gesturestart', preventZoom);

        // Safari iOS 100vh Fix
        const handleResize = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        return () => {
            document.removeEventListener('gesturestart', preventZoom);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    return null;
}
