# 🚗 CarMatch

**Red Social para Compra, Venta y Descubrimiento de Vehículos y Negocios Automotrices en Tiempo Real**

## 🌟 Características Principales

### Tres Feeds Únicos

1. **MarketCar** - Feed marketplace tradicional con anuncios detallados, filtros avanzados y búsqueda
2. **CarMatch** - Feed estilo Tinder para descubrir vehículos con swipe (Like/Dislike)
3. **Map Store** - Mapa en tiempo real de negocios automotrices cercanos

## 🛠️ Stack Tecnológico

- **Frontend/Backend**: Next.js 15+ con App Router y TypeScript
- **Base de Datos**: Neon (PostgreSQL serverless con PostGIS)
- **ORM**: Prisma
- **Autenticación**: NextAuth.js v5
- **Almacenamiento**: Cloudinary
- **Mapas**: Leaflet + React-Leaflet
- **Pagos**: Stripe / MercadoPago
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar migraciones de Prisma
npx prisma generate
npx prisma db push

# Iniciar servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🗂️ Estructura del Proyecto

```
carmatch/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── auth/            # Autenticación
│   │   ├── market/          # Feed MarketCar
│   │   ├── swipe/           # Feed CarMatch
│   │   ├── map/             # Map Store
│   │   ├── profile/         # Perfiles
│   │   ├── credits/         # Compra de créditos
│   │   └── api/             # API Routes
│   ├── components/          # Componentes React
│   │   ├── ui/              # Componentes UI
│   │   ├── feeds/           # Componentes de feeds
│   │   ├── maps/            # Componentes de mapas
│   │   └── forms/           # Formularios
│   └── lib/                 # Utilidades
├── prisma/                  # Schema de base de datos
└── public/                  # Archivos estáticos
```

## 💰 Sistema de Monetización

- **Vehículos**: 1er vehículo gratis por 6 meses, vehículos adicionales 7 días gratis luego 1 crédito/mes
- **Negocios**: **Primer negocio 3 MESES GRATIS**, siguientes negocios 1 crédito/mes
- **Paquetes de Créditos**: Disponibles con descuentos progresivos

## 🚀 Roadmap

- [x] Sprint 1: Configuración inicial y base de datos
- [ ] Sprint 2: Sistema de autenticación
- [ ] Sprint 3: Feed MarketCar
- [ ] Sprint 4: Feed CarMatch (Swipe)
- [ ] Sprint 5: Map Store
- [ ] Sprint 6: Gestión y monetización
- [ ] Sprint 7: Polish y deployment

## 📝 Licencia

Proyecto privado - Todos los derechos reservados
