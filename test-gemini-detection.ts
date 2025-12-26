
import { analyzeMultipleImages } from './src/lib/ai/imageAnalyzer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback to .env

async function runTest() {
    console.log("🧪 INICIANDO TEST DE IA GEMINI...");
    console.log("PWD:", process.cwd());
    console.log("API KEY Presente:", !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY));

    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
        console.error("❌ ERROR: No se encontró API KEY en variables de entorno (.env o .env.local).");
        process.exit(1);
    }

    // Imagen de una planta (Monstera) - DEBERÍA SER RECHAZADA
    const plantImageURL = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Monstera_deliciosa2.jpg/640px-Monstera_deliciosa2.jpg";

    // Imagen de un coche (Toyota Corolla) - DEBERÍA SER ACEPTADA
    const carImageURL = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/2019_Toyota_Corolla_LE_sedan_%28USA%29_front_view.jpg/640px-2019_Toyota_Corolla_LE_sedan_%28USA%29_front_view.jpg";

    try {
        // Helper to fetch and convert to base64
        const urlToBase64 = async (url: string) => {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer).toString('base64');
        };

        console.log("📥 Descargando imágenes de prueba...");
        const plantBase64 = await urlToBase64(plantImageURL);
        const carBase64 = await urlToBase64(carImageURL);

        console.log("🤖 Enviando a Gemini (Esto puede tardar unos segundos)...");

        // Simular array como en la app: [Portada, Planta]
        const result = await analyzeMultipleImages([carBase64, plantBase64]);

        console.log("\n════ RESULTADO DEL ANÁLISIS ════");
        console.log("JSON Puro:", JSON.stringify(result, null, 2));

        console.log("\n════ EVALUACIÓN ════");
        if (result.invalidIndices && result.invalidIndices.includes(1)) {
            console.log("✅ ÉXITO: La planta (índice 1) fue detectada correctamente.");
            console.log(`Indices inválidos detectados: [${result.invalidIndices.join(', ')}]`);
        } else {
            console.log("❌ FALLO: La planta NO fue detectada como inválida.");
            console.log(`Indices reportados como inválidos: ${JSON.stringify(result.invalidIndices)}`);
        }

    } catch (error) {
        console.error("❌ CRASH DEL TEST:", error);
    }
}

runTest();
