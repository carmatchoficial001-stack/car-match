
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";

if (!apiKey) {
    console.warn("⚠️ Advertencia: Ni GEMINI_API_KEY ni GOOGLE_API_KEY están definidas.");
}

const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
