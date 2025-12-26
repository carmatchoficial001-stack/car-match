
import { NextResponse } from 'next/server';
import { analyzeImage } from '@/lib/ai/imageAnalyzer';

export const runtime = 'nodejs'; // Gemini SDK might prefer nodejs runtime for now or edge depending on config

export async function POST(req: Request) {
    try {
        const body = await req.json();
        let { image, type } = body;

        if (!image) {
            return NextResponse.json({ valid: false, reason: "No se recibió imagen" }, { status: 400 });
        }

        // Si es una URL (Cloudinary), descargarla y convertir a Base64
        if (image.startsWith('http')) {
            try {
                const response = await fetch(image);
                if (!response.ok) throw new Error('Failed to fetch image from URL');
                const buffer = await response.arrayBuffer();
                image = Buffer.from(buffer).toString('base64');
            } catch (err) {
                console.error("Error fetching image from URL:", err);
                // Si falla descargar, fallamos open (valid: true) para no bloquear al usuario
                // o devolvemos error. Mejor valid:true pero sin detalles.
                return NextResponse.json({ valid: true });
            }
        } else {
            // Clean base64 header if present (si viene directo del cliente como base64)
            image = image.replace(/^data:image\/\w+;base64,/, "");
        }

        const analysis = await analyzeImage(image, type);

        return NextResponse.json(analysis);

    } catch (error) {
        console.error("API Error validating image:", error);
        return NextResponse.json({ valid: true }, { status: 500 });
    }
}
