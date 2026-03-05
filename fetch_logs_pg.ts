import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    await client.connect();
    console.log("Connected to DB via PG.");

    const resLogs = await client.query(`
    SELECT "createdAt", "level", "source", "message", "metadata"::text 
    FROM "SystemLog" 
    WHERE "source" = 'Cloudinary' 
       OR "message" ILIKE '%Worker%' 
       OR "message" ILIKE '%Generando%' 
       OR "message" ILIKE '%error fatal%'
       OR "message" ILIKE '%Studio%'
    ORDER BY "createdAt" DESC 
    LIMIT 20;
  `);

    console.log("--- SYSTEM LOGS ---");
    resLogs.rows.forEach(log => {
        console.log(`[${log.createdAt.toISOString()}] ${log.level} [${log.source}]: ${log.message}`);
        if (log.metadata) {
            console.log(`  Meta: ${log.metadata.substring(0, 100)}...`);
        }
    });

    const resMsg = await client.query(`
    SELECT id, content, "imagePrompt", images::text 
    FROM "StudioMessage" 
    ORDER BY "createdAt" DESC 
    LIMIT 1;
  `);

    if (resMsg.rows.length > 0) {
        console.log("\n--- LAST MESSAGE ---");
        console.log(resMsg.rows[0]);
    }

    await client.end();
}

run().catch(console.error);
