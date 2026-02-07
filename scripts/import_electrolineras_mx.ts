
import { prisma } from '../src/lib/db';
import { generateSlug } from '../src/lib/slug';
import dotenv from 'dotenv';


dotenv.config();

console.log("🚀 SCRIPT STARTED: import_electrolineras_mx.ts");

const OVERPASS_MIRRORS = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://z.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
];
const BATCH_SIZE = 50; // Smaller batch size to be safe

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

    console.log(`✅ Asignando electrolineras al usuario: ${adminUser.name || 'Admin'} (${adminUser.email})`);

    // Ensure category 'electrolinera' is valid or at least used correctly (it's a string in DB so it's fine)

    if (cityArg) {
        await importRegion(cityArg, adminUser);
    } else {
        console.log('🇲🇽 Iniciando importación masiva por ESTADOS...');
        for (const state of STATES) {
            console.log(`\n👉 Procesando Estado: ${state}`);
            await importRegion(state, adminUser);
            // Wait to respect rate limits
            await new Promise(r => setTimeout(r, 4000));
        }
    }

    console.log('\n🏁 IMPORTACIÓN GLOBAL COMPLETADA 🏁');
}

async function importRegion(regionName: string, adminUser: any) {
    console.log(`🌍 Descargando datos para ${regionName}...`);

    // Query for electric charging stations
    const query = `[out:json][timeout:90];
        (
          area["name"="${regionName}"]["admin_level"~"4|6|7|8"];
          area["name"~"${regionName}"]["admin_level"~"4"];
        )->.searchArea;
        (
          node["amenity"="charging_station"](area.searchArea);
          way["amenity"="charging_station"](area.searchArea);
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
        console.log(`ℹ️ No se encontraron electrolineras en ${regionName}.`);
        return;
    }

    console.log(`📡 Recibidos ${elements.length} registros para ${regionName}. Guardando...`);

    let addedCount = 0;

    for (let i = 0; i < elements.length; i += BATCH_SIZE) {
        const batch = elements.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (node: any) => {
            const lat = node.lat || node.center?.lat;
            const lon = node.lon || node.center?.lon;
            if (!lat || !lon) return;

            // Deduplication
            const exists = await prisma.business.findFirst({
                where: {
                    latitude: { gte: lat - 0.0001, lte: lat + 0.0001 },
                    longitude: { gte: lon - 0.0001, lte: lon + 0.0001 },
                    category: 'electrolinera'
                }
            });

            if (exists) return;

            const name = node.tags?.name || node.tags?.operator || 'Estación de Carga';
            const city = node.tags?.['addr:city'] || regionName;

            // Generate nice description based on tags
            const capacity = node.tags?.capacity ? `Capacidad: ${node.tags.capacity} vehículos. ` : '';
            const output = node.tags?.socket_type ? `Tipos: ${node.tags.socket_type}. ` : '';
            const fee = node.tags?.fee === 'yes' ? 'Con costo.' : (node.tags?.fee === 'no' ? 'Gratuita.' : '');

            const description = `Estación de carga para vehículos eléctricos. ${capacity}${output}${fee}`;

            // Slug
            const slug = generateSlug(`${name} ${city}`) + '-' + (node.id || Math.random().toString(36).slice(2, 7));

            try {
                await prisma.business.create({
                    data: {
                        userId: adminUser.id,
                        name: name,
                        slug: slug,
                        category: 'electrolinera',
                        description: description,
                        address: node.tags?.['addr:street'] || `Ubicación en ${city}`,
                        street: node.tags?.['addr:street'] || null,
                        city: city,
                        state: regionName,
                        country: 'MX',
                        latitude: lat,
                        longitude: lon,
                        isActive: true,
                        isFreePublication: true,
                        services: ['Carga Eléctrica', 'Estacionamiento'],
                        hours: node.tags?.opening_hours || '24 Horas',
                        is24Hours: node.tags?.opening_hours === '24/7',
                        expiresAt: new Date(Date.now() + 315360000000), // 10 years
                        images: [] // Could maybe find a generic image
                    }
                });
                addedCount++;
            } catch (err: any) {
                // Ignore unique constraint errors
            }
        }));
    }
    console.log(`✅ ${regionName}: ${addedCount} electrolineras agregadas.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
