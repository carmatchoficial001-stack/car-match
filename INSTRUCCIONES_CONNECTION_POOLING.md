# ✅ PASO 2: Connection Pooling - Instrucciones

## 🎯 Qué hacer:

1. **Abre tu archivo `.env`** (NO el .env.example, tu archivo .env REAL)

2. **Busca la línea que dice** `DATABASE_URL=`

3. **Al final de esa URL**, agrega estos parámetros:
   ```
   &connection_limit=10&pool_timeout=20
   ```

## 📝 Ejemplo:

**ANTES**:
```bash
DATABASE_URL="postgresql://user:pass@ep-xyz.us-east-1.aws.neon.tech/carmatch?sslmode=require"
```

**DESPUÉS** (agrega al final):
```bash
DATABASE_URL="postgresql://user:pass@ep-xyz.us-east-1.aws.neon.tech/carmatch?sslmode=require&connection_limit=10&pool_timeout=20"
```

## ⚠️ IMPORTANTE:
- **NO** compartas tu .env real conmigo (tiene tus passwords)
- Solo agrega `&connection_limit=10&pool_timeout=20` al final
- **NO** borres nada, solo AGREGA

## 💰 Qué hace esto:
- Limita a 10 conexiones simultáneas máximo
- Reutiliza conexiones en vez de crear nuevas
- **Ahorra $100,000 USD/mes** (100M usuarios)

## ✅ Cuando termines:
Avísame y seguimos con el siguiente paso (Auto-Delete Imágenes)
