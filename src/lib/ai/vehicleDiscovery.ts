// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { prisma } from '@/lib/db'
import { safeGenerateContent, safeExtractJSON } from '@/lib/ai/geminiClient'

export async function discoverNewBrands(): Promise<number> {
    const existingBrands = await getExistingBrandNames()

    const prompt = `
  Eres un experto en la industria automotriz global. Identifica NUEVAS marcas de vehículos que hayan entrado al mercado en ${new Date().getFullYear()}.
  
  CONTEXTO:
  - Fecha actual: ${new Date().toLocaleDateString('es-MX')}
  - Enfócate en marcas que están expandiéndose internacionalmente
  - Incluye automóviles, motocicletas, camiones, y vehículos especiales
  
  MARCAS YA CONOCIDAS (NO incluir):
  ${existingBrands.slice(0, 200).join(', ')}... (total: ${existingBrands.length})
  
  INSTRUCCIONES:
  1. Investiga lanzamientos recientes de marcas nuevas en el mercado
  2. Verifica que sean marcas REALES en producción (no conceptos)
  3. Clasifica cada marca en la categoría correcta
  4. Solo incluye marcas con presencia comercial confirmada
  
  FORMATO DE RESPUESTA (JSON):
  [
    {
      "name": "Nombre exacto de la marca",
      "category": "Automóvil" | "Motocicleta" | "Camión" | "Autobús" | "Maquinaria" | "Especial",
      "confidence": 0.95,
      "reason": "Razón breve de por qué es relevante"
    }
  ]
  
  IMPORTANTE:
  - Devuelve array vacío [] si no hay nuevas marcas significativas
  - Confidence mínimo: 0.85 (alta certeza)
  - Máximo 10 marcas por ejecución
  
  Responde ÚNICAMENTE con el JSON, sin texto adicional ni markdown.
  `

    // ✅ Usar Pro para descubrimiento (requiere conocimiento profundo del mercado)
    const { geminiPro } = await import('@/lib/ai/geminiClient');
    const response = await safeGenerateContent(prompt, 5, geminiPro);
    const responseText = response.text().trim()

    const brands = safeExtractJSON<any[]>(responseText)

    if (!brands || brands.length === 0) {
        console.log('  ℹ️  No se encontraron nuevas marcas')
        return 0
    }

    let addedCount = 0

    for (const brandData of brands) {
        if (brandData.confidence < 0.85) {
            console.log(`  ⚠️  Marca rechazada por baja confianza: ${brandData.name} (${brandData.confidence})`)
            continue
        }

        try {
            await prisma.brand.create({
                data: {
                    name: brandData.name,
                    category: brandData.category,
                    source: 'ai_discovered',
                    confidence: brandData.confidence,
                    isActive: true
                }
            })
            addedCount++
            console.log(`  ✅ Nueva marca: ${brandData.name} (${brandData.category}) - ${brandData.reason}`)
        } catch (error: any) {
            if (error.code === 'P2002') {
                console.log(`  ⚪ Marca ya existe: ${brandData.name}`)
            } else {
                throw error
            }
        }
    }

    return addedCount
}

export async function discoverNewModels(): Promise<number> {
    // Obtener top 30 marcas más populares para optimizar
    const topBrands = await prisma.brand.findMany({
        where: { isActive: true },
        select: { id: true, name: true, category: true },
        orderBy: { createdAt: 'asc' },
        take: 30
    })

    let totalAdded = 0

    // Procesar en lotes de 5 marcas
    for (let i = 0; i < topBrands.length; i += 5) {
        const batch = topBrands.slice(i, i + 5)

        const prompt = `
    Identifica NUEVOS modelos de vehículos lanzados en ${new Date().getFullYear()} para estas marcas:
    
    ${batch.map(b => `- ${b.name} (${b.category})`).join('\n')}
    
    FECHA ACTUAL: ${new Date().toLocaleDateString('es-MX')}
    
    CRITERIOS:
    1. Solo modelos lanzados en ${new Date().getFullYear()} o anunciados para ${new Date().getFullYear() + 1}
    2. Modelos en producción real (no conceptos)
    3. Incluye variantes importantes (ej: Mustang Mach-E, Golf R)
    
    FORMATO JSON:
    [
      {
        "brandName": "Nombre EXACTO de la marca",
        "modelName": "Nombre del modelo",
        "yearIntroduced": ${new Date().getFullYear()},
        "isElectric": true | false,
        "isHybrid": true | false,
        "confidence": 0.95
      }
    ]
    
    Responde [] si no hay nuevos modelos significativos.
    Responde SOLO JSON, sin markdown.
    `

        const { geminiPro } = await import('@/lib/ai/geminiClient');
        const response = await safeGenerateContent(prompt, 5, geminiPro); // ✅ Pro
        const responseText = response.text().trim()

        const models = safeExtractJSON<any[]>(responseText)
        if (!models || models.length === 0) continue

        for (const modelData of models) {
            const brand = batch.find(b => b.name === modelData.brandName)
            if (!brand) continue

            if (modelData.confidence < 0.85) {
                console.log(`  ⚠️  Modelo rechazado: ${brand.name} ${modelData.modelName} (${modelData.confidence})`)
                continue
            }

            try {
                await prisma.model.create({
                    data: {
                        name: modelData.modelName,
                        brandId: brand.id,
                        yearIntroduced: modelData.yearIntroduced,
                        isElectric: modelData.isElectric || false,
                        isHybrid: modelData.isHybrid || false,
                        source: 'ai_discovered',
                        confidence: modelData.confidence,
                        isActive: true
                    }
                })
                totalAdded++
                console.log(`  ✅ Nuevo modelo: ${brand.name} ${modelData.modelName}`)
            } catch (error: any) {
                if (error.code !== 'P2002') {
                    console.error(`  ❌ Error con ${brand.name} ${modelData.modelName}:`, error.message)
                }
            }
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000))
    }

    return totalAdded
}

export async function discoverNewVehicleTypes(): Promise<number> {
    const existingTypes = await prisma.vehicleType.findMany({
        select: { name: true }
    })

    const prompt = `
  Identifica NUEVAS categorías o tipos de vehículos que hayan emergido en ${new Date().getFullYear()}.
  
  TIPOS EXISTENTES (NO repetir):
  ${existingTypes.map(t => t.name).join(', ')}
  
  EJEMPLOS de lo que buscamos:
  - "E-Scooters de Alta Velocidad"
  - "Vehículos Autónomos Nivel 4"
  - "Micro-Movilidad Urbana"
  
  FORMATO JSON:
  [
    {
      "name": "Nombre del tipo",
      "category": "Categoría general",
      "description": "Descripción breve",
      "confidence": 0.90
    }
  ]
  
  Responde [] si no hay tipos verdaderamente nuevos.
  Solo JSON, sin markdown.
  `

    const { geminiPro } = await import('@/lib/ai/geminiClient');
    const response = await safeGenerateContent(prompt, 5, geminiPro); // ✅ Pro
    const responseText = response.text().trim()

    const types = safeExtractJSON<any[]>(responseText)

    if (!types || types.length === 0) {
        console.log('  ℹ️  No se encontraron nuevos tipos')
        return 0
    }
    let addedCount = 0

    for (const typeData of types) {
        if (typeData.confidence < 0.85) continue

        try {
            await prisma.vehicleType.create({
                data: {
                    name: typeData.name,
                    category: typeData.category,
                    description: typeData.description,
                    source: 'ai_discovered',
                    isActive: true
                }
            })
            addedCount++
            console.log(`  ✅ Nuevo tipo: ${typeData.name}`)
        } catch (error: any) {
            if (error.code !== 'P2002') {
                console.error(`  ❌ Error con tipo ${typeData.name}:`, error.message)
            }
        }
    }

    return addedCount
}

async function getExistingBrandNames(): Promise<string[]> {
    const brands = await prisma.brand.findMany({
        select: { name: true }
    })
    return brands.map(b => b.name)
}
