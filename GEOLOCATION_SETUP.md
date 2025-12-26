# 🗺️ Configuración de Geolocalización GPS en Tiempo Real

## Paso 1: Obtener Token de MapBox (GRATIS)

1. Crea una cuenta gratuita en MapBox: https://account.mapbox.com/auth/signup/
2. Una vez dentro, ve a: https://account.mapbox.com/access-tokens/
3. Copia tu **Default Public Token** (empieza con `pk.`)

**💰 Límites Gratis:**
- 100,000 requests/mes GRATIS
- Suficiente para 1,000+ usuarios activos al inicio

---

## Paso 2: Configurar Variable de Entorno

Agrega esta línea a tu archivo `.env`:

```bash
NEXT_PUBLIC_MAPBOX_TOKEN="pk.ey...tu-token-aqui"
```

---

## Paso 3: Ejecutar Migración de Base de Datos

La migración ya está corriendo. Si necesitas ejecutarla manualmente:

```bash
npx prisma migrate dev --name add_vehicle_geolocation
npx prisma generate
```

Esto agrega los campos `latitude` y `longitude` a la tabla `Vehicle`.

---

## ¿Cómo Funciona el Sistema?

### ✅ **CarMatch** (Feed Swipe)
- Al entrar, detecta tu ubicación GPS en tiempo real
- Muestra SOLO vehículos dentro de **12 km** a la redonda
- Los ordena por proximidad (más cercanos primero)
- Muestra la distancia a cada vehículo

### ✅ **MarketCar** (Marketplace)
- También usa GPS con radio de **12 km** por defecto
- Permite cambiar manualmente de ciudad si quieres buscar en otro lugar
- Ideal para personas con vehículos en varias ciudades

### 🔄 **Triple Fallback** (Sistema a Prueba de Fallos)

1️⃣ **Primer intento:** Pedir permiso GPS del navegador  
2️⃣ **Si falla:** Usar la ciudad guardada en tu perfil  
3️⃣ **Si falla:** Permitir selección manual de ciudad  

---

## Ventajas para tus Usuarios

✅ **Usuario se mudó**: Automáticamente ve vehículos de su nueva ciudad  
✅ **Usuario de viaje**: Puede explorar vehículos donde está  
✅ **Vendedores**: Sus vehículos aparecen a usuarios cercanos en tiempo real  
✅ **Experiencia moderna**: Como Tinder, OLX, Facebook Marketplace  

---

## Próximos Pasos

Una vez que la migración termine:

1. **Agrega el token de MapBox** a tu `.env`
2. **Reinicia el servidor** de desarrollo
3. **Prueba en el navegador**:
   - Permite permisos de ubicación
   - Verifica que aparecan vehículos cercanos con distancia

**Nota:** Los vehículos existentes tendrán `latitude` y `longitude` en `null`. Cuando publiques nuevos vehículos, tendrás que actualizar el formulario de publicación para capturar las coordenadas GPS.
