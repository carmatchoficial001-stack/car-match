
import { interpretSearchQuery } from './e:/carmatchapp/src/lib/ai/searchInterpreter';

async function testIntelligence() {
    console.log("🧪 Testing Intelligent MarketChat...");

    const queries = [
        "busco una troca 4x4 barata",
        "quiero un auto electrico con mucho rango",
        "camioneta familiar con pocos dueños",
        "deportivo con muchos caballos de fuerza"
    ];

    for (const query of queries) {
        console.log(`\n🔍 Query: "${query}"`);
        const result = await interpretSearchQuery(query, 'MARKET');
        console.log("📊 Results:", JSON.stringify(result, null, 2));
        if (result.advisorTip) {
            console.log("✅ Advisor Tip Found!");
        } else {
            console.log("❌ Advisor Tip MISSING!");
        }
    }
}

// Mocking some dependencies since we are running in a script context
// This is a simplified test. In a real environment, we'd run use the actual API.
testIntelligence().catch(console.error);
