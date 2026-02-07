
import { randomUUID } from 'crypto';

/**
 * 🏢 SCRIPT DE BENCHMARKING: INSTANT BUSINESS
 * Mide la velocidad de respuesta de la API de negocios bajo carga simulada.
 * 
 * Uso: npx tsx scripts/benchmark-business.ts
 */

const API_URL = 'http://localhost:3000/api/businesses';
const ITERATIONS = 5;

const MOCK_BUSINESS = {
    name: "Taller Veloz - PRUEBA DE ESTRÉS",
    description: "Benchmark automatizado de registro de negocios.",
    category: "mechanic",
    phone: "5551234567",
    address: "Avenida Siempre Viva 123",
    city: "Springfield",
    latitude: 19.4326,
    longitude: -99.1332,
    images: [
        "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1000&q=80" // Foto de taller
    ],
    fingerprint: {
        deviceHash: "benchmark-business-" + randomUUID()
    },
    // Atributos
    is24Hours: true,
    hasEmergencyService: false
};

async function runBenchmark() {
    console.log(`\n🚀 INICIANDO BENCHMARK DE "INSTANT BUSINESS" (${ITERATIONS} iteraciones)`);
    console.log(`📡 Target API: ${API_URL}`);
    console.log('--------------------------------------------------');

    const results = [];

    for (let i = 0; i < ITERATIONS; i++) {
        const start = performance.now();

        try {
            console.log(`⏱️  Iteración ${i + 1}: Registrando negocio...`);

            const response = await fetch(API_URL, {
                method: 'POST', // Ojo: esto intentará crear negocios reales si la auth pasa
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(MOCK_BUSINESS)
            });

            const end = performance.now();
            const duration = end - start;

            const status = response.status;

            results.push({ duration, status });

            console.log(`   ✅ Respuesta: ${status} | Tiempo: ${duration.toFixed(2)}ms`);

            if (duration > 1000) {
                console.warn(`   ⚠️  LENTO: Superó 1 segundo.`);
            }

        } catch (error) {
            console.error(`   ❌ Error de red:`, error);
        }
    }

    console.log('--------------------------------------------------');
    const avg = results.reduce((acc, curr) => acc + curr.duration, 0) / results.length;
    console.log(`📊 RESULTADOS FINALES NEGOCIOS:`);
    console.log(`   Promedio: ${avg.toFixed(2)}ms`);
    console.log(`   (Meta: < 800ms para sensación instantánea)`);
}

runBenchmark();
