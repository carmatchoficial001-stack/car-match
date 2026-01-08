import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";

async function listModels() {
    if (!apiKey) {
        console.error("❌ No API Key found");
        return;
    }

    console.log("Consultando modelos disponibles en tu cuenta...");

    try {
        // Usamos una petición fetch directa al API para ver qué dice el servidor exactamente
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data: any = await response.json();

        if (data.error) {
            console.error("❌ Error de API:", data.error.message);
            console.log("Detalles:", JSON.stringify(data.error, null, 2));
            return;
        }

        const commonModels = [
            "gemini-flash-latest",
            "gemini-1.5-flash",
            "gemini-2.0-flash",
            "gemini-pro-latest"
        ];

        if (data.models) {
            console.log("✅ Modelos detectados. Probando conectividad y cuota...");
            const genAI = new GoogleGenerativeAI(apiKey);

            for (const modelId of commonModels) {
                try {
                    process.stdout.write(`Probando ${modelId}... `);
                    const model = genAI.getGenerativeModel({ model: modelId });
                    const result = await model.generateContent("hi");
                    if (result.response) {
                        console.log("✅ FUNCIONA!");
                    }
                } catch (e: any) {
                    if (e.message.includes("429")) {
                        console.log("❌ CUOTA AGOTADA (429)");
                    } else if (e.message.includes("404")) {
                        console.log("❌ NO ENCONTRADO (404)");
                    } else {
                        console.log(`❌ ERROR: ${e.message.split('\n')[0]}`);
                    }
                }
            }
        } else {
            console.log("❓ No se regresaron modelos.");
        }
    } catch (error: any) {
        console.error("❌ Error de ejecución:", error.message);
    }
}

listModels();
