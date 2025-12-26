import type { Config } from "tailwindcss";

export default {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // 🎨 PALETA CARMATCH v2 - Suave para los Ojos
                background: '#0f172a', // Slate 900 - Base oscura
                surface: {
                    DEFAULT: '#1e293b', // Slate 800 
                    highlight: '#334155', // Slate 700 
                },
                text: {
                    primary: '#e2e8f0', // Slate 200 - Gris casi blanco (NO blanco puro)
                    secondary: '#94a3b8', // Slate 400
                    tertiary: '#64748b', // Slate 500
                },
                // Azul Oscuro Desaturado - Suave, No Brillante (Color Principal)
                primary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1', // AZUL PRINCIPAL CARMATCH (más oscuro, no brillante)
                    800: '#075985',
                    900: '#0c4a6e', // Alternativa aún más oscura
                    950: '#082f49',
                },
                // Naranja Suave - Acento cálido pero NO agresivo
                accent: {
                    50: '#fff7ed',
                    100: '#ffedd5',
                    200: '#fed7aa',
                    300: '#fdba74',
                    400: '#fb923c',
                    500: '#f97316', // NARANJA ACENTO
                    600: '#ea580c',
                    700: '#c2410c',
                    800: '#9a3412',
                    900: '#7c2d12',
                    950: '#431407',
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
            },
        },
    },
    plugins: [],
} satisfies Config;
