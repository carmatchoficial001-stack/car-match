
import { prisma } from '../src/lib/db';
import { generateSlug } from '../src/lib/slug';
import dotenv from 'dotenv';

dotenv.config();

console.log("🚀 SCRIPT STARTED: import_gas_stations_mx.ts");

const OVERPASS_MIRRORS = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://z.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
];
const BATCH_SIZE = 100;

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

    if (!adminUser) {
        console.error('❌ ERROR CRÍTICO: No se encontró ningún usuario administrador en la base de datos.');
        process.exit(1);
    }

    console.log(`✅ Asignando gasolineras al usuario: ${adminUser.name || 'Admin'} (${adminUser.email})`);

    if (cityArg) {
        await importRegion(cityArg, adminUser);
    } else {
        console.log('🇲🇽 Iniciando importación masiva por ESTADOS (para optimizar memoria)...');
        // Procesar secuencialmente para no saturar
        for (const state of STATES) {
            console.log(`\n👉 Procesando Estado: ${state}`);
            await importRegion(state, adminUser);
            // Pequeña pausa para respetar rate limits de la API pública
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    console.log('\n🏁 IMPORTACIÓN GLOBAL COMPLETADA 🏁');
}

async function importRegion(regionName: string, adminUser: any) {
    console.log(`🌍 Descargando datos para ${regionName}...`);

    // Query flexible para encontrar estado o ciudad
    // admin_level 4 = Estado, 6/8 = Municipio/Ciudad
    const query = `[out:json][timeout:900];
        (
          area["name"="${regionName}"]["admin_level"~"4|6|7|8"];
          area["name"~"${regionName}"]["admin_level"~"4"];
        )->.searchArea;
        (
          node["amenity"="fuel"](area.searchArea);
          way["amenity"="fuel"](area.searchArea);
          relation["amenity"="fuel"](area.searchArea);
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
            if (elements.length > 0) success = true;
        } catch (e) {
            // ignore error and try next mirror
        }
    }

    if (!success || elements.length === 0) {
        console.warn(`⚠️ No se encontraron resultados para ${regionName} (o falló la API). Saltando.`);
        return;
    }

    console.log(`📡 Recibidos ${elements.length} registros para ${regionName}. Guardando...`);

    let addedCount = 0;

    // Batch processing
    for (let i = 0; i < elements.length; i += BATCH_SIZE) {
        const batch = elements.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (node: any) => {
            const lat = node.lat || node.center?.lat;
            const lon = node.lon || node.center?.lon;
            if (!lat || !lon) return;

            // Simple deduplication check nearby
            const exists = await prisma.business.findFirst({
                where: {
                    latitude: { gte: lat - 0.0001, lte: lat + 0.0001 },
                    longitude: { gte: lon - 0.0001, lte: lon + 0.0001 },
                    category: 'gasolinera'
                }
            });

            if (exists) return;

            const brand = node.tags?.brand || '';
            let name = node.tags?.name || brand || 'Gasolinera';
            if (name === 'Gasolinera' && brand) name = brand;

            const city = node.tags?.['addr:city'] || regionName;

            // Slug único
            const slug = generateSlug(`${name} ${city}`) + '-' + (node.id || Math.random().toString(36).slice(2, 7));

            try {
                await prisma.business.create({
                    data: {
                        userId: adminUser.id,
                        name: name,
                        slug: slug,
                        category: 'gasolinera',
                        description: `Gasolinera ${brand} en ${city}, ${regionName}.`,
                        address: node.tags?.['addr:street'] || `Ubicación en ${city}`,
                        city: city,
                        state: regionName, // Aproximación
                        country: 'MX',
                        latitude: lat,
                        longitude: lon,
                        isActive: true,
                        isFreePublication: true,
                        services: ['Combustible', 'Aire', 'Tienda'],
                        hours: '24 Horas',
                        is24Hours: true,
                        // 10 años de vigencia
                        expiresAt: new Date(Date.now() + 315360000000),
                        images: []
                    }
                });
                addedCount++;
            } catch (err) {
                // Ignore unique constraint errors mostly
            }
        }));
    }
    console.log(`✅ ${regionName}: ${addedCount} gasolineras agregadas.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
