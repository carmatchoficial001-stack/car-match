
// Scripts must be ES modules or use ts-node
import { interpretSearchQuery } from './src/lib/ai/searchInterpreter';

async function test() {
    console.log("Testing search: 'Ram negra'");
    const result = await interpretSearchQuery('Ram negra', 'MARKET');
    console.log("Result:", JSON.stringify(result, null, 2));
}

test();
