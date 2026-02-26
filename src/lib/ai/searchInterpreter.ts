// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.


import { geminiPro } from "./geminiModels"; // 🚀 UPGRADE: Usamos PRO para "Entendimiento Humano" perfecto
import { BRANDS, COLORS, TRANSMISSIONS, FUELS } from "../vehicleTaxonomy";
import aiCache from "./aiCache"; // 💰 Sistema de caché para reducir costos
import { orchestrator } from "./orchestrator";

interface SearchIntent {
  category?: string;
  vehicleType?: string;
  brand?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number; // Added maxYear
  color?: string;
  transmission?: string;
  fuel?: string;
  passengers?: number;
  cylinders?: number;
  mileage?: number; // Added mileage
  traction?: string; // Added traction (4x4, AWD, etc.)
  hp?: number; // Added horsepower
  range?: number; // Added electric range
  condition?: string; // New, used, etc.
  owners?: number; // Added number of owners
  features?: string[];
  sort?: string; // sorting intent
  query_language?: string; // Just for logging/debugging
  keywords?: string[]; // Extra keywords like "roja", "4x4"
  isBusinessSearch?: boolean; // If user is looking for a shop/mechanic instead of a car
  aiReasoning?: string; // 🗣️ Mensaje de la IA explicando su lógica al usuario
  advisorTip?: string; // 💡 Intelligent tip from the expert advisor
  isConversational?: boolean; // 💬 TRUE si la IA necesita más info y está iniciando un cuestionario
  nextQuestion?: string; // ❓ La pregunta que la IA le hace al usuario para refinar la búsqueda
}

export async function interpretSearchQuery(query: string, context: 'MARKET' | 'MAP'): Promise<SearchIntent> {
  console.log(`🧠 Interpretando búsqueda (${context}): "${query}"`);

  try {
    // 🚀 NIVEL 0: ORQUESTADOR DE EFICIENCIA EXTREMA
    const orchestratedResult = await orchestrator.execute(query, {
      role: 'INTERPRETER',
      efficiency: 'LOCAL_FIRST',
      useCache: true,
      context: { taxonomy: { BRANDS, COLORS, TRANSMISSIONS, FUELS }, searchContext: context }
    });

    let finalFilters = {} as SearchIntent;

    if (orchestratedResult.source === 'LOCAL' || orchestratedResult.source === 'CACHE') {
      console.log(`✅ [ORCHESTRATOR ${orchestratedResult.source}] Costo: $0. Confianza: ${orchestratedResult.confidence}`);
      finalFilters = orchestratedResult.data as SearchIntent;
    } else if (orchestratedResult.source === 'FLASH' && orchestratedResult.confidence >= 0.8) {
      console.log(`⚡ [ORCHESTRATOR FLASH] Costo mínimo. Confianza: ${orchestratedResult.confidence}`);
      finalFilters = orchestratedResult.data as SearchIntent;
    } else if (orchestratedResult.data) {
      console.log(`👑 [ORCHESTRATOR PRO] Máxima precisión garantizada.`);
      finalFilters = orchestratedResult.data as SearchIntent;
    }

    return finalFilters;
  } catch (orchError) {
    console.warn("⚠️ Orquestador no disponible, usando flujo legacy:", orchError);
  }

  // 🚀 PASO 1: FALLBACK - Intentar obtener del caché directo (por si el orquestador falló)
  try {
    const cachedResult = aiCache.get(query, context);
    if (cachedResult) {
      console.log(`⚡ [CACHE HIT LEGACY] Respuesta recuperada del caché. $0 gastados.`);
      return cachedResult as SearchIntent;
    }

    // Si no está en caché, usamos el modelo PRO (Fallback legacy)
    const prompt = `Extrae filtros de búsqueda de: "${query}". Contexto: ${context}. Responde en JSON. Exactamente como la interfaz SearchIntent.`;
    const result = await geminiPro.generateContent(prompt);
    const responseText = result.response.text();
    const match = responseText.match(/\{[\s\S]*\}/);
    const aiOutput = match ? JSON.parse(match[0]) as SearchIntent : {} as SearchIntent;

    // 🛡️ REFUERZO DE TAXONOMÍA: Corrección post-IA
    if (aiOutput.color) {
      const outputColor = aiOutput.color;
      const exact = COLORS.find(c => c.toLowerCase() === outputColor.toLowerCase());
      if (exact) {
        aiOutput.color = exact;
      } else {
        const partial = COLORS.find(c => outputColor.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(outputColor.toLowerCase().substring(0, 4)));
        if (partial) aiOutput.color = partial;
      }
    }

    if (aiOutput.fuel) {
      const outputFuel = aiOutput.fuel;
      const exact = FUELS.find(f => f.toLowerCase() === outputFuel.toLowerCase());
      if (exact) aiOutput.fuel = exact;
    }

    if (aiOutput.transmission) {
      const outputTrans = aiOutput.transmission;
      const exact = TRANSMISSIONS.find(t => t.toLowerCase() === outputTrans.toLowerCase());
      if (exact) aiOutput.transmission = exact;
    }

    // 💾 PASO FINAL: Guardar en caché para futuras consultas
    aiCache.set(query, aiOutput, context);
    console.log(`💰 [CACHE SAVE] Próxima búsqueda idéntica será gratis.`);

    return aiOutput;
  } catch (error) {
    console.error("❌ Error interpretando búsqueda:", error);
    return {}; // Return empty filter if AI fails (fallback to text search)
  }
}
