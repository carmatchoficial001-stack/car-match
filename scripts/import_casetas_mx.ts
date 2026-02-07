
import { prisma } from '../src/lib/db';
import { generateSlug } from '../src/lib/slug';
import dotenv from 'dotenv';
// No extra fetch import needed for Node 18+

dotenv.config();

console.log("🚀 SCRIPT STARTED: import_casetas_mx.ts");

const OVERPASS_MIRRORS = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://z.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
];
const BATCH_SIZE = 5;

const STATES = [
    "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
    "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango",
    "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "México",
    "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca",
    "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa",
    "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz",
    "Yucatán", "Zacatecas"
];

const cityArg = process.argv[2];

async function main() {
    console.log('🔍 Buscando usuario Administrador...');
    const adminEmail = process.env.ADMIN_EMAIL;
    let adminUser = null;

    if (adminEmail) {
        adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    }

    if (!adminUser) {
        console.log('⚠️ No se encontró usuario con ADMIN_EMAIL, buscando el primer admin disponible...');
        adminUser = await prisma.user.findFirst({ where: { isAdmin: true } });
    }

    // Fallback: buscar cualquier usuario si no hay admin (para dev)
    if (!adminUser) {
        console.warn('⚠️ No se encontró ningún admin. Buscando el primer usuario disponible como fallback...');
        adminUser = await prisma.user.findFirst();
    }

    if (!adminUser) {
        console.error('❌ ERROR CRÍTICO: No se encontró ningún usuario en la base de datos.');
        process.exit(1);
    }

    console.log(`✅ Asignando casetas al usuario: ${adminUser.name || 'Admin'} (${adminUser.email})`);

    if (cityArg) {
        await importRegion(cityArg, adminUser);
    } else {
        console.log('🛣️ Iniciando importación masiva de CASETAS por ESTADOS...');
        for (const state of STATES) {
            console.log(`\n👉 Procesando Estado: ${state}`);
            await importRegion(state, adminUser);
            // Wait to respect rate limits
            await new Promise(r => setTimeout(r, 4000));
        }
    }

    console.log('\n🏁 IMPORTACIÓN GLOBAL DE CASETAS COMPLETADA 🏁');
}

async function importRegion(regionName: string, adminUser: any) {
    console.log(`🌍 Descargando datos para ${regionName}...`);

    // Query for toll booths
    // barrier=toll_booth matches the booth itself
    // highway=toll_gantry matches electronic toll gantries
    const query = `[out:json][timeout:90];
        (
          area["name"="${regionName}"]["admin_level"~"4|6|7|8"];
          area["name"~"${regionName}"]["admin_level"~"4"];
        )->.searchArea;
        (
          node["barrier"="toll_booth"](area.searchArea);
          way["barrier"="toll_booth"](area.searchArea);
          node["highway"="toll_gantry"](area.searchArea);
        );
        out center qt;`;

    let elements: any[] = [];
    let success = false;

    for (const mirror of OVERPASS_MIRRORS) {
        if (success) break;
        try {
            const response = await fetch(`${mirror}?data=${encodeURIComponent(query)}`);
            if (!response.ok) continue;
            const data: any = await response.json();
            elements = data.elements || [];
            success = true;
        } catch (e) {
            console.log(`⚠️ Mirror ${mirror} failed, trying next...`);
        }
    }

    if (!success) {
        console.warn(`⚠️ Fallaron todos los mirrors para ${regionName}. Saltando.`);
        return;
    }

    if (elements.length === 0) {
        console.log(`ℹ️ No se encontraron casetas en ${regionName}.`);
        return;
    }

    console.log(`📡 Recibidos ${elements.length} registros para ${regionName}. Guardando...`);

    let addedCount = 0;

    // Sequential processing to avoid connection pool exhaustion
    for (const node of elements) {
        const lat = node.lat || node.center?.lat;
        const lon = node.lon || node.center?.lon;
        if (!lat || !lon) continue;

        // Deduplication
        const exists = await prisma.business.findFirst({
            where: {
                latitude: { gte: lat - 0.0001, lte: lat + 0.0001 },
                longitude: { gte: lon - 0.0001, lte: lon + 0.0001 },
                category: 'caseta'
            }
        });

        if (exists) continue;

        const name = node.tags?.name || 'Caseta de Cobro';
        const city = node.tags?.['addr:city'] || regionName;

        // Generate nice description based on tags
        const fee = node.tags?.fee === 'yes' ? 'Cobro obligatorio. ' : '';
        const operator = node.tags?.operator ? `Operado por: ${node.tags.operator}. ` : '';

        const description = `Caseta de cobro / Peaje. ${fee}${operator}Recuerda preparar tu efectivo o Tag.`;

        // Slug
        const slug = generateSlug(`${name} ${city}`) + '-' + (node.id || Math.random().toString(36).slice(2, 7));

        try {
            await prisma.business.create({
                data: {
                    userId: adminUser.id,
                    name: name,
                    slug: slug,
                    category: 'caseta',
                    description: description,
                    address: node.tags?.['addr:street'] || `Carretera en ${regionName}`,
                    street: node.tags?.['addr:street'] || null,
                    city: city,
                    state: regionName,
                    country: 'MX',
                    latitude: lat,
                    longitude: lon,
                    isActive: true,
                    isFreePublication: true,
                    services: ['Pago en Efectivo', 'Tag/IAVE', 'Baños'],
                    hours: '24 Horas',
                    is24Hours: true,
                    expiresAt: new Date(Date.now() + 315360000000), // 10 years
                    images: []
                }
            });
            addedCount++;
        } catch (err: any) {
            // Ignore unique constraint errors
        }
        // Small delay to prevent connection pool exhaustion
        await new Promise(r => setTimeout(r, 100));
    }
    console.log(`✅ ${regionName}: ${addedCount} casetas agregadas.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
