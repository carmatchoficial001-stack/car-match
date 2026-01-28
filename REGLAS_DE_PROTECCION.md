# 🔒 REGLAS DE PROTECCIÓN SISTÉMICA - CARMATCH

**IMPORTANTE PARA TODAS LAS IAs Y PROGRAMADORES:** Este proyecto ya está en **PRODUCCIÓN**. La estabilidad es la prioridad número uno. Rubén ha experimentado cambios no deseados en la lógica interna que han afectado el funcionamiento del sistema.

## 🛑 REGLAS DE ORO (INVIOLABLES)

1. **NO EDITAR PROMPTS DE IA:** Los archivos en `src/lib/` que contengan lógica de prompts (especialmente `map-ai.ts` y `chatbot-data.ts`) tienen prohibido cualquier cambio en el texto de las instrucciones de la IA sin aprobación explícita de Rubén.
2. **NO MODIFICAR EL BACKEND SIN RAMA DE PRUEBAS:** Cualquier cambio en la lógica de modelos, API o base de datos debe hacerse en una rama separada y ser validado antes de tocar la rama principal.
3. **RESPETAR LOS COMENTARIOS DE BLOQUEO:** Si un archivo tiene el encabezado `// 🔒 FEATURE LOCKED` o similar, NO se debe editar.
4. **PRIORIZAR LA ESTABILIDAD SOBRE LA "OPTIMIZACIÓN":** No intentes "refactorizar" o "mejorar" código que ya funciona si no se te ha pedido específicamente. El código que está en producción es sagrado.

## 📁 ARCHIVOS BAJO PROTECCIÓN TOTAL

- `src/lib/map-ai.ts`: Instrucciones del Maestro Mecánico.
- `src/lib/chatbot-data.ts`: Conocimiento base del Asesor CarMatch.
- `prisma/schema.prisma`: Estructura vital de la base de datos.
- `src/lib/auth.ts`: Seguridad y acceso de usuarios.
- `src/app/layout.tsx`: Metadatos, SEO y configuración visual base.
- `public/manifest.json`: Configuración de la App (PWA) e iconos.

---
**Cualquier incumplimiento de estas normas pone en riesgo la operación de la aplicación en vivo.**
