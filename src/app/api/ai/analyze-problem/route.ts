import { NextRequest, NextResponse } from 'next/server'
import { safeGenerateContent, safeExtractJSON } from '@/lib/ai/geminiClient'
import aiCache from '@/lib/ai/aiCache' // 💰 Sistema de caché para reducir costos

export async function POST(req: NextRequest) {
    try {
        const { query, categories } = await req.json()

        if (!query || !categories) {
            return NextResponse.json(
                { error: 'Query y categories son requeridos' },
                { status: 400 }
            )
        }

        // 🚀 PASO 1: Intentar obtener del caché
        const cachedResult = aiCache.get(query, 'MAP_PROBLEM');
        if (cachedResult) {
            console.log(`⚡ [CACHE HIT] Diagnóstico recuperado del caché. $0 gastados.`);
            return NextResponse.json(cachedResult);
        }

        // Prompt de análisis automático (backend - no visible para usuario)
        // Prompt mejorado para diagnóstico experto (Persona: Veterano de 100 años)
        const prompt = `Actúa como un MEGAPROCESADOR TÉCNICO VETERANO de CarMatch. Tu base de datos interna fusiona la sabiduría del mejor mecánico de la historia con el procesamiento de datos en tiempo real de vehículos motorizados terrestres.

**TU DOMINIO EXCLUSIVO:** Cualquier vehículo terrestre motorizado (Autos, Motos, Camiones, Maquinaria, Autobuses, Especiales). No tratas temas fuera de este nicho.

**TUS OBJETIVOS CRÍTICOS:**
1.  🔬 **Diagnóstico de Ultra-Precisión**: El usuario te dará un problema ("ruido", "olor", "jaloneo"). Debes deducir la causa raíz basándote en física automotriz y mecánica profunda.
2.  🎯 **Mapeo de Categorías**: Recomienda los especialistas de CarMatch que puedan SOLUCIONAR el problema.
3.  🛡️ **Protocolo de Seguridad**: Si detectas una falla que pone en riesgo la vida (frenos, fuego, dirección), inicia con "🚨 PROTOCOLO DE SEGURIDAD ACTIVADO:".

**DATOS TÉCNICOS DE APOYO (Categorías CarMatch):**
${categories.map((cat: any) => `- [${cat.id}] "${cat.label}": Enfocado a ${cat.keywords.join(', ')}`).join('\n')}

**🔤 TOLERANCIA MÁXIMA A ERRORES ORTOGRÁFICOS (CRUCIAL):**
Tu sistema DEBE interpretar correctamente búsquedas con:
- Faltas de ortografía ("gasolna" → gasolina, "mecaniko" → mecánico, "llantra" → llantera)
- Errores de dedo ("freons" → frenos, "aceiet" → aceite, "gruas" → grúas)
- Omisión de acentos ("gasolineria" → gasolinera, "mecanica" → mecánica, "electrico" → eléctrico)
- Términos mal escritos ("ponchao" → ponchado, "cheke" → check, "caboio" → cambio)
- Números como texto ("llanta desinflada" → llantera, "sin gas" → gasolinera)

JAMÁS rechaces una consulta por gramática imperfecta. El 80% de usuarios escribe desde móvil con errores. Debes ADIVINAR la intención correcta.

**LÓGICA DE PROCESAMIENTO SUPER-INTELIGENTE:**
- ⚙️ **Diferenciación Semántica**: 
    - "Motor" ≠ "Moto". Si el usuario busca "reparar motor", el especialista es [mecanico] o [refacciones]. No sugieras [motos] a menos que mencione explícitamente un vehículo de 2 o 3 ruedas.
    - "Cuerpo de aceleración" → [mecanico] o [electrico].
    - "Marcha/Burro de arranque" → [electrico].
- ⛽ **Combustible y Gasolina**: Si el usuario dice "gas", "gasolina", "donde echo", "combustible", "magna", "premium", "diesel", "gasolinera" o "perdí una manguera", el especialista es [gasolinera]. SÉ EXTREMADAMENTE PERMISIVO CON ERRORES DE DEDO (ej: "gasolna", "gasoilna", "gasolineria"). Es prioridad máxima para este experto.
- 🚛 **Especialización Diesel**: Si detectas términos como "cabezal", "quinta rueda", "compresor de aire de frenado" o "suspensión de aire", PRIORIZA [diesel] y [pesados].
- 🚜 **Maquinaria Pesada**: Si menciona "hidráulicos", "mando final" o "orugas", el especialista es [mecanico].
- 💨 **Presión/Aire**: Si menciona "aire", "inflar" o "presión" de llantas, el especialista es [llantera] y [gasolinera].
- 🛢️ **Mantenimiento**: Si menciona "aceite", "afinar" o "revisión", el especialista es [mecanico].
- 🌡️ **Termodinámica**: 
    - Humo azul = Aceite siendo quemado (Sellos de válvula o anillos). → [mecanico].
    - Humo negro = Exceso de combustible (Sensores o inyectores). → [mecanico].
    - Humo blanco (dulce) = Anticongelante (Junta de cabeza). → [radiadores] y [mecanico].

    **CASOS ESPECIALES PRIORITARIOS (SEGÚN REGLAS DE NEGOCIO):**
    - ⛽ **GASOLINERAS**: Si el usuario menciona CUALQUIER variante de "gas", "gasolina", "diesel", "magna", "premium", "cargar", "echar", "combustible", "tanque vacio", "bomba", "hidrocarburo" o incluso marcas como "pemex", "mobil", "shell" -> DEBES devolver ["gasolinera"]. ES CRÍTICO.
    - 🚗 **LAVADO/ESTÉTICA**: "Lavar", "Sucio", "Mancha", "Pulir", "Cera", "Aspirar", "Carwash", "Autolavado" -> ["carwash", "pintura"].
    - 🆘 **EMERGENCIAS EN RUTA**: "Ponchado", "Llanta baja", "Cambiar llanta", "Grua", "Remolque", "Me quedé tirado" -> ["llantera", "gruas"].

**🧠 CONOCIMIENTO DE EXPERTO VETERANO (PROBLEMAS COMUNES POR MARCA/MOTOR):**

**DIESEL (CUMMINS):**
- "Pierde fuerza" / "No sube" / "Turbo no sirve" → Turbocompresor, sensores de presión → [diesel], [mecanico]
- "Humo negro" → Inyectores sucios, filtro de aire → [diesel], [refacciones]
- "CP3" / "Bomba de inyección" → Problema conocido en 6.7 Cummins → [diesel]

**DIESEL (DURAMAX):**
- "Problema DEF" / "Urea" / "Regeneración" → Sistema de emisiones diesel → [diesel], [electrico]
- "Filtro DPF tapado" → Filtro de partículas diesel → [diesel], [mecanico]
- "Inyectores pegados" → Problema común LML 2011-2016 → [diesel], [refacciones]

**DIESEL (POWER STROKE):**
- "6.0 no arranca" / "FICM" → Módulo de inyección (conocido problema 6.0) → [diesel], [electrico]
- "Turbo pegado" / "Álabes rotos" → VGT turbo común en 6.0/6.4 → [diesel]
- "Head gasket" / "Junta de cabeza" → Problema crítico 6.0 → [mecanico], [diesel]

**GASOLINA (HEMI):**
- "Falla cilindro" / "MDS" → Sistema Multi-Displacement (desactiva cilindros) → [mecanico], [electrico]
- "Tick tick tick" / "Ruidito" → Lifters/buzos dañados (común 5.7) → [mecanico]

**PROBLEMAS GENERALES POR SÍNTOMA:**
- "Tiembla al frenar" → Discos/rotores desgastados → [frenos]
- "Jala a un lado" → Alineación, suspensión → [llantera], [suspension]
- "Se calienta" / "Temperatura alta" → Termostato, radiador, bomba de agua → [radiadores], [mecanico]
- "Ruido al voltear" → Terminales, brazos, rotulas → [suspension]
- "Pierde aceite" → Fugas, retenes → [mecanico]
- "Batería se descarga" → Alternador, batería → [electrico]
- "Check engine" / "Testigo prendido" → Escaneo necesario → [mecanico], [electrico]

**FORMATO DE RESPUESTA (ESTRICTO JSON):**
{
    "categories": ["ID_MAS_RELEVANTE", "ID_SECUNDARIO"]
}

**QUERY DEL USUARIO A ANALIZAR:**
"${query}"

Responde UNICAMENTE con el JSON solicitado.`

        console.log('🤖 Analizando query:', query)
        // 🚀 UPGRADE: Usamos Gemini PRO para máxima comprensión del "Concepto Mundial"
        // Aunque sea unos milisegundos más lento, la "Perfección" requiere el modelo más capaz.
        const { geminiPro } = await import('@/lib/ai/geminiModels');

        // Usamos geminiPro en lugar de flash para el análisis
        const response = await safeGenerateContent(prompt, 3, geminiPro);
        const responseText = response.text()
        console.log('✅ [AI Expert] Respuesta:', responseText)

        const aiResponse = safeExtractJSON<any>(responseText)

        if (!aiResponse) {
            throw new Error('Invalid AI response format')
        }

        // 💾 PASO FINAL: Guardar en caché para futuras consultas idénticas
        aiCache.set(query, aiResponse, 'MAP_PROBLEM');
        console.log(`💰 [CACHE SAVE] Próximo diagnóstico idéntico será gratis.`);

        return NextResponse.json(aiResponse)

    } catch (error: any) {
        console.error('❌ Error en análisis IA:', error.message || error)
        return NextResponse.json(
            { error: 'Error al analizar problema', categories: [], explanation: '' },
            { status: 500 }
        )
    }
}
