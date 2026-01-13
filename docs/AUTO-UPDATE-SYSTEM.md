# 🤖 Sistema de Auto-Actualización de Vehículos con IA

Sistema 100% automatizado que usa Gemini AI para descubrir y agregar nuevas marcas, modelos y tipos de vehículos mensualmente sin intervención humana.

---

## 📦 ¿Qué se instaló?

### 1. **Nuevos Modelos de Base de Datos** (`prisma/schema.prisma`)
- `Brand` - Marcas de vehículos (dinámico)
- `Model` - Modelos por marca (dinámico)
- `VehicleType` - Tipos/categorías de vehículos
- `AutoUpdateLog` - Registro de actualizaciones automáticas

### 2. **APIs RESTful** (`src/app/api/vehicles/`)
- `GET /api/vehicles/brands?category=Automóvil` - Obtener marcas
- `GET /api/vehicles/models?brandName=Toyota` - Obtener modelos

### 3. **Cron Job Inteligente** (`src/app/api/cron/update-vehicles/`)
- Ejecuta el día 1 de cada mes a las 00:00 UTC
- Descubre nuevas marcas con confianza > 85%
- Descubre nuevos modelos para las top 30 marcas
- Logging completo en base de datos

### 4. **Script de Migración** (`scripts/migrate-to-dynamic-data.ts`)
- Transfiere datos estáticos → PostgreSQL
- Preserva todas las marcas y modelos existentes

### 5. **React Hooks** (`src/hooks/useVehicleData.ts`)
- `useBrands(category)` - Obtener marcas por categoría
- `useModels(brandName)` - Obtener modelos por marca
- `useBrandNames()` - Lista simple de nombres
- `useModelNames()` - Lista simple de modelos

---

## 🚀 Instalación y Configuración

### Paso 1: Migrar Base de Datos

```bash
# 1. Crear la migración
npx prisma migrate dev --name add-auto-update-system

# 2. Generar cliente de Prisma
npx prisma generate
```

### Paso 2: Migrar Datos Existentes

```bash
# Instalar tsx si no lo tienes
npm install -D tsx

# Ejecutar script de migración
npx tsx scripts/migrate-to-dynamic-data.ts
```

**Resultado esperado:**
```
🚀 Iniciando migración de datos estáticos a PostgreSQL...

  📁 Categoría: Automóvil
    ✅ Acura: 7 modelos
    ✅ Chevrolet: 24 modelos
    ✅ Toyota: 18 modelos
    ...

============================================================
✨ MIGRACIÓN COMPLETADA CON ÉXITO

  📊 Total de marcas migradas:  150+
  📊 Total de modelos migrados: 500+
  📊 Total de tipos migrados:   45
============================================================
```

### Paso 3: Configurar Variables de Entorno

Agregar a `.env.local`:

```env
# IA Gemini (ya debes tenerlo)
GEMINI_API_KEY=your_gemini_api_key_here

# Nuevo: Token de seguridad para Cron Jobs
CRON_SECRET=genera_un_token_aleatorio_aqui_abc123xyz
```

**Generar CRON_SECRET:**
```bash
# En Node.js console o terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Paso 4: Configurar Vercel (Cuando subas a producción)

1. **Variables de Entorno en Vercel Dashboard:**
   - `DATABASE_URL` (ya configurado)
   - `GEMINI_API_KEY` (ya configurado)
   - `CRON_SECRET` (nuevo - mismo valor que en .env.local)

2. **Verificar Cron Configuration:**
   - El archivo `vercel.json` ya está configurado
   - Vercel detectará automáticamente el cron job en deploy
   - Se ejecutará automáticamente cada mes

---

## 🧪 Probar el Sistema

### Probar Migración de Datos
```bash
# Ver datos en base de datos
npx prisma studio

# Navegar a "Brand" y "Model" para ver los datos migrados
```

### Probar APIs
```bash
# Obtener todas las marcas de Automóviles
curl http://localhost:3000/api/vehicles/brands?category=Automóvil

# Obtener modelos de Toyota
curl "http://localhost:3000/api/vehicles/models?brandName=Toyota"
```

### Probar Cron Job Manualmente (Local)
```bash
# Desde tu terminal (reemplaza CRON_SECRET con tu token)
curl http://localhost:3000/api/cron/update-vehicles \
  -H "Authorization: Bearer tu_cron_secret_aqui"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "stats": {
    "brandsAdded": 2,
    "modelsAdded": 15,
    "typesAdded": 1,
    "executionTime": 12500
  },
  "timestamp": "2025-12-16T..."
}
```

### Probar Frontend
1. Inicia el servidor: `npm run dev`
2. Ve a `/publish`
3. Selecciona una categoría (Automóvil)
4. Selecciona una marca (ej: Toyota)
5. **Verifica que el dropdown de Modelo se llene dinámicamente** con modelos de Toyota

---

## 📊 Monitoreo y Mantenimiento

### Ver Logs de Actualizaciones
```sql
-- En Prisma Studio o tu cliente SQL
SELECT * FROM "AutoUpdateLog" ORDER BY "createdAt" DESC LIMIT 10;
```

### Ver Marcas Descubiertas por IA
```sql
SELECT name, category, confidence, createdAt 
FROM "Brand" 
WHERE source = 'ai_discovered'
ORDER BY createdAt DESC;
```

### Ver Marcas con Más Modelos
```sql
SELECT 
  b.name, 
  COUNT(m.id) as model_count 
FROM "Brand" b
LEFT JOIN "Model" m ON m."brandId" = b.id
GROUP BY b.name
ORDER BY model_count DESC
LIMIT 20;
```

---

## 🔧 Troubleshooting

### Error: "POPULAR_MODELS is not defined"
**Causa:** El frontend aún usa datos estáticos  
**Solución:** Ya está corregido - `PublishClient.tsx` usa `useModelNames()`

### Error: "Cron unauthorized"
**Causa:** `CRON_SECRET` incorrecto o no configurado  
**Solución:** 
1. Verifica que `CRON_SECRET` esté en `.env.local`
2. Usa el mismo valor en el header `Authorization: Bearer <secret>`

### El Cron no ejecuta en Vercel
**Causas posibles:**
1. No está en plan Pro de Vercel (Hobby tiene límites)
2. Variable `CRON_SECRET` no configurada en Vercel Dashboard
3. El path del cron en `vercel.json` es incorrecto

### Rate Limit de Gemini API
**Síntoma:** El cron falla con error de rate limit  
**Solución:** El script ya tiene delays (2 segundos entre lotes). Si persiste:
- Reducir el número de marcas procesadas por ejecución
- Cambiar `take: 30` a `take: 10` en línea del código

---

## 📈 Futuras Mejoras Opcionales

### 1. Panel de Administración
Crear `/admin/vehicle-data` para:
- Ver marcas/modelos pendientes de verificación
- Aprobar/rechazar descubrimientos de la IA
- Editar manualmente marcas/modelos

### 2. Notificaciones
- Email cuando se descubren nuevas marcas
- Slack webhook para monitoreo
- Dashboard de métricas

### 3. Más Fuentes de Datos
- Scraping de sitios oficiales de fabricantes
-APIs de terceros (Edmunds, CarGurus)
- CarMatch automotive data authority

### 4. Machine Learning
- Entrenar modelo para predecir popularidad de modelos
- Auto-priorizar marcas emergentes

---

## 💰 Costos Estimados

- **PostgreSQL (Vercel):** $0 (Free tier hasta 256 MB)
- **Vercel Cron:** $0 (Incluido en Hobby plan)
- **Gemini API:** ~$0.30-0.80/mes
  - ~6 request/mes (top brands)
  - 0.0001 USD/request aprox

**Total: < $1 USD/mes** 💸

---

## ✅ Checklist Final

Antes de deploy a producción:

- [ ] Ejecutar `npx prisma migrate deploy` en producción
- [ ] Ejecutar script de migración en producción
- [ ] Configurar `CRON_SECRET` en Vercel
- [ ] Verificar que `GEMINI_API_KEY` tenga créditos
- [ ] Probar manualmente el endpoint de cron una vez
- [ ] Verificar logs después del primer cron automático

---

## 🎉 ¡Listo!

Tu sistema de CarMatch ahora es **100% auto-actualizable**. 

Cada mes, la IA buscará nuevas marcas y modelos sin que tengas que hacer nada. Los users siempre verán las opciones más actualizadas en los dropdowns.

**¿Preguntas?** Revisa los logs o ejecuta los comandos de testing arriba.
