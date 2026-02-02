
import { safeGenerateContent, safeExtractJSON } from "./geminiClient";
import { VEHICLE_CATEGORIES, BRANDS } from "../vehicleTaxonomy";
import { prisma } from "@/lib/db";

// Define the structure for the AI response
interface TaxonomyUpdate {
  newBrands: Record<string, string[]>; // Category -> [New Brands]
  newModels: Record<string, string[]>; // Brand -> [New Models]
  newCategories: Record<string, string[]>; // Category -> [New Subtypes]
  confidence: number;
}

export async function updateTaxonomyDatabase() {
  console.log("🦾 Iniciando actualización automática de taxonomía vía IA...");

  // 1. Fetch updates from Gemini
  const updates = await fetchTaxonomyUpdates();
  if (!updates) return { success: false, error: "Failed to fetch from AI" };

  const { newBrands, newModels, newCategories, confidence } = updates;
  let addedBrands = 0;
  let addedModels = 0;
  let addedTypes = 0;
  let totalProcessed = 0;

  // 2. Save New Brands
  for (const [category, brands] of Object.entries(newBrands)) {
    for (const brandName of brands) {
      try {
        await prisma.brand.upsert({
          where: { name: brandName },
          update: {},
          create: {
            name: brandName,
            category: category,
            source: 'AI'
          }
        });
        addedBrands++;
      } catch (e) { }
    }
  }

  // 2.5 Save New Models (Linking to Brand)
  for (const [brandName, models] of Object.entries(newModels)) {
    try {
      const brand = await prisma.brand.findUnique({ where: { name: brandName } });
      if (brand) {
        for (const modelName of models) {
          try {
            await prisma.model.upsert({
              where: {
                brandId_name: {
                  brandId: brand.id,
                  name: modelName
                }
              },
              update: {},
              create: {
                name: modelName,
                brandId: brand.id,
                source: 'AI'
              }
            });
            addedModels++;
          } catch (e) { }
        }
      }
    } catch (e) { }
  }

  // 3. Save New Types (Subtypes/Categories)
  for (const [category, types] of Object.entries(newCategories)) {
    for (const typeName of types) {
      try {
        await prisma.vehicleType.upsert({
          where: { name: typeName },
          update: {},
          create: {
            name: typeName,
            category: category,
            source: 'AI'
          }
        });
        addedTypes++;
      } catch (e) { }
    }
  }

  // 4. Log the update with audit fields
  try {
    await prisma.autoUpdateLog.create({
      data: {
        status: 'COMPLETED',
        brandsAdded: addedBrands,
        modelsAdded: addedModels,
        typesAdded: addedTypes,
        totalProcessed: totalProcessed,
        source: 'Gemini-1.5-Flash',
        confidenceThreshold: confidence || 1.0,
        region: 'MX-JUAREZ',
        triggeredBy: 'SYSTEM_AUTOMATIC',
        metadata: {
          timestamp: new Date().toISOString(),
          version: '2.0-car-authority'
        }
      }
    });
  } catch (e) {
    console.error("❌ Error creando log de auditoría:", e);
  }

  console.log(`✅ Taxonomía actualizada: ${addedBrands} marcas, ${addedModels} modelos y ${addedTypes} tipos nuevos.`);
  return { success: true, addedBrands, addedModels, addedTypes };
}

export async function fetchTaxonomyUpdates() {
  console.log("🤖 Consultando a Gemini sobre novedades automotrices...");

  const prompt = `[SISTEMA: RESPUESTA ÚNICAMENTE EN JSON. PROHIBIDO TEXTO EXPLICATIVO]
    Eres el ANALISTA MAESTRO de CarMatch. Tu base de datos debe ser actualizada con marcas y modelos REALES de 2024-2026.
    
    CATEGORÍAS ACTUALES: ${JSON.stringify(Object.keys(VEHICLE_CATEGORIES))}
    
    🌍 ALCANCE COMPLETO: CarMatch NO solo vende autos/motos. Vendemos CUALQUIER VEHÍCULO MOTORIZADO TERRESTRE:
    - Autos, Motos, Camiones, Autobuses (COMERCIALES) ✅
    - Maquinaria: Montacargas, Excavadoras, Tractores, Bulldozers ✅
    - Servicios: Ambulancias, Patrullas, Food Trucks, Grúas ✅
    - Agrícolas: Tractores, Cosechadoras, Fumigadoras ✅
    - Recreativos: RVs, ATVs, Carritos Golf, Cuatrimotos ✅
    - Industriales: Barredoras, Compactadoras, Revolvedoras ✅
    - Movilidad: Scooters eléctricos, Segways, Triciclos ✅
    
    TU TAREA:
    1. Buscar vehículos NUEVOS 2024-2026 en TODAS estas categorías
    2. Incluir marcas emergentes (ej: BYD eléctricos, Rivian pickups, nuevos montacargas eléctricos)
    3. Incluir modelos nuevos de marcas existentes (ej: Toyota Tacoma 2025, Ford E-Transit 2024)
    4. Incluir subtipos nuevos (ej: "Pickup Eléctrica", "Montacargas Autónomo")
    
    EJEMPLOS DE LO QUE DEBES DETECTAR:
    - newBrands: { "Automóvil": ["BYD", "Rivian", "Lucid"], "Maquinaria": ["Hangcha"] }
    - newModels: { "Tesla": ["Cybertruck", "Model 3 Highland"], "Caterpillar": ["320 GC"] }
    - newCategories: { "Automóvil": ["Pickup Eléctrica"], "Maquinaria": ["Montacargas Eléctrico"] }
    
    FORMATO OBLIGATORIO:
    {
      "newBrands": { "Automóvil": ["Nombre"], "Motocicleta": [], "Maquinaria": [] },
      "newModels": { "MarcaExistente": ["Modelo1", "Modelo2"] },
      "newCategories": { "Automóvil": ["Subtipo"], "Maquinaria": ["Subtipo"] },
      "confidence": 0.95
    }

    REGLAS DE ORO:
    1. Si no hay nada nuevo, devuelve el objeto con listas vacías.
    2. NUNCA inventes marcas (verifica en fuentes oficiales).
    3. INCLUYE vehículos especializados (no solo autos comerciales).
    4. NO incluyas markdown, NO digas "Aquí tienes", NO expliques nada. Solo el JSON.
  `;

  try {
    const response = await safeGenerateContent(prompt);
    const text = response.text();

    const data = safeExtractJSON<TaxonomyUpdate>(text);
    if (!data) throw new Error("Could not parse AI response as JSON");

    return data;
  } catch (error) {
    console.error("❌ Error consultando a Gemini:", error);
    return null;
  }
}
