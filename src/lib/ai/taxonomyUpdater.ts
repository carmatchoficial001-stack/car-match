
import { geminiModel } from "./geminiClient";
import { VEHICLE_CATEGORIES, BRANDS } from "../vehicleTaxonomy";
import { prisma } from "@/lib/db";

// Define the structure for the AI response
interface TaxonomyUpdate {
  newBrands: Record<string, string[]>; // Category -> [New Brands]
  newCategories: Record<string, string[]>; // Category -> [New Subtypes]
}

export async function updateTaxonomyDatabase() {
  console.log("🦾 Iniciando actualización automática de taxonomía vía IA...");

  // 1. Fetch updates from Gemini
  const updates = await fetchTaxonomyUpdates();
  if (!updates) return { success: false, error: "Failed to fetch from AI" };

  const { newBrands, newCategories } = updates;
  let addedBrands = 0;
  let addedTypes = 0;

  // 2. Save New Brands
  for (const [category, brands] of Object.entries(newBrands)) {
    for (const brandName of brands) {
      try {
        await prisma.discoveredBrand.upsert({
          where: { name: brandName },
          update: {}, // Already exists, do nothing
          create: {
            name: brandName,
            category: category
          }
        });
        addedBrands++;
      } catch (e) {
        // Ignore duplicates or errors
      }
    }
  }

  // 3. Save New Types (Subtypes/Categories)
  for (const [category, types] of Object.entries(newCategories)) {
    for (const typeName of types) {
      try {
        await prisma.discoveredType.upsert({
          where: { name: typeName },
          update: {},
          create: {
            name: typeName,
            category: category
          }
        });
        addedTypes++;
      } catch (e) {
        // Ignore
      }
    }
  }

  console.log(`✅ Taxonomía actualizada: ${addedBrands} marcas, ${addedTypes} tipos nuevos.`);
  return { success: true, addedBrands, addedTypes };
}

export async function fetchTaxonomyUpdates() {
  console.log("🤖 Consultando a Gemini sobre novedades automotrices...");

  const prompt = `
    Actúa como un experto global en la industria automotriz y de transporte.
    Tu tarea es identificar NUEVAS marcas o tipos de vehículos que hayan ganado relevancia mundial recientemente y que falten en nuestra base de datos.
    
    Analiza las siguientes categorías existentes:
    ${JSON.stringify(Object.keys(VEHICLE_CATEGORIES))}
    
    Y las marcas existentes actuales (Muestra parcial):
    ${JSON.stringify(BRANDS['Automóvil']?.slice(0, 10))}... (y muchas más).

    Genera un JSON con el siguiente formato estricto:
    {
      "newBrands": {
        "Automóvil": ["MarcaNueva1", "MarcaNueva2"],
        "Motocicleta": [],
        "Especial": ["MarcaUTVNueva"]
      },
      "newCategories": {
        "Automóvil": ["NuevoTipoDeCarroceriaSiExiste"],
        "Especial": ["NuevoTipoDeVehiculo"]
      }
    }

    REGLAS:
    1. Solo incluye marcas REALES y relevantes globalmente que NO suelen estar en listas antiguas.
    2. Usa nombres estandarizados (Sin jerga).
    3. Si no hay nada nuevo relevante, devuelve listas vacías. No inventes.
    4. Céntrate en vehículos eléctricos chinos emergentes o nuevas divisiones de marcas de lujo.
  `;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean the text to ensure it's valid JSON (remove markdown code blocks if any)
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data: TaxonomyUpdate = JSON.parse(jsonString);

    return data;
  } catch (error) {
    console.error("❌ Error consultando a Gemini:", error);
    return null;
  }
}
