
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
const envLocalPath = path.join(process.cwd(), '.env.local');

function checkEnv(filePath) {
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const hasToken = content.includes('REPLICATE_API_TOKEN=');
        console.log(`${path.basename(filePath)} exists. Has REPLICATE_API_TOKEN: ${hasToken}`);
    } else {
        console.log(`${path.basename(filePath)} does not exist.`);
    }
}

checkEnv(envPath);
checkEnv(envLocalPath);

console.log('Current process.env.REPLICATE_API_TOKEN length:', process.env.REPLICATE_API_TOKEN ? process.env.REPLICATE_API_TOKEN.length : 'undefined');
