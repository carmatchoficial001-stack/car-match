import "dotenv/config";
import { fetchTaxonomyUpdates } from "../src/lib/ai/taxonomyUpdater";
import { safeGenerateContent } from "../src/lib/ai/geminiClient";

async function debugAI() {
    console.log("🔍 Depurando respuesta de IA (Taxonomía)...");
    try {
        const updates = await fetchTaxonomyUpdates();
        console.log("RESULTADO:", updates ? "LOGRADO" : "FALLÓ");
    } catch (e) {
        console.error("DEBUG ERROR:", e);
    }
}

debugAI();
