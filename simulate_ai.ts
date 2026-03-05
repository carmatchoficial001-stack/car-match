import { geminiFlashConversational } from './src/lib/ai/geminiModels'

async function simulateChat() {
    console.log("Simulating AI Studio chat request...");

    const contextStr = "USUARIO: quiero 1 auto rojo en la playa";

    const prompt = `Eres el DIRECTOR CREATIVO SUPREMO de CarMatch México.
Tu personalidad: Eres apasionado, visionario, dominas la jerga creativa y el marketing digital mexicano. 
Tu objetivo es platicar con el usuario en ESPAÑOL para entender su visión.
Una vez que la idea esté clara, propón un "PROMPT FINAL" detallado.

REGLAS DE INTERACCIÓN:
1. Siempre habla en ESPAÑOL.
2. Cuando el usuario pida generar la imagen, responde con "PROMPT_READY".

HISTORIAL:
${contextStr}

INSTRUCCIONES DE RESPUESTA JSON:
Si vas a proponer el diseño final, responde con un JSON válido como este ejemplo:
{
    "type": "PROMPT_READY",
    "message": "Mensaje entusiasta en ESPAÑOL.",
    "imagePrompt": "ULTRA DETAILED prompt in ENGLISH.",
    "photoCount": 11,
    "platforms": { "instagram": true }
}
(NOTA: En photoCount asigna el número exacto de fotos que el usuario solicitó; si no especificó, usa 11).

Si estás platicando, responde:
{
    "type": "CHAT",
    "message": "Tu respuesta en ESPAÑOL"
}
Responde ÚNICAMENTE con JSON válido y respeta la cantidad de imágenes pedida.`

    try {
        const result = await geminiFlashConversational.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.9,
                maxOutputTokens: 4096
            }
        }) as any;

        let responseText = result.response.text().trim()
        console.log("Raw Response:\n", responseText);

        const data = JSON.parse(responseText);
        console.log("Parsed JSON:\n", data);
    } catch (e) {
        console.error("Simulation failed:", e);
    }
}

simulateChat();
