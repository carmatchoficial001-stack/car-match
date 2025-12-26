import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = process.env.GOOGLE_API_KEY as string

if (!apiKey) {
    console.warn("⚠️ GOOGLE_API_KEY no detectada. La IA funcionará en modo simulado.")
}

// Inicializar el cliente (Singleton basic)
const genAI = new GoogleGenerativeAI(apiKey)

// Usar modelo Flash para velocidad/costo
export const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
        maxOutputTokens: 250,
        temperature: 0.7,
    }
})
