
import { prisma } from '../src/lib/db';
import { generateSlug } from '../src/lib/slug';
import dotenv from 'dotenv';
// No extra fetch import needed for Node 18+

dotenv.config();

console.log("🚀 SCRIPT STARTED: import_public_services_mx.ts");

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

// Configuration for each type
const TYPES = [
    { key: 'hospital', amenity: 'hospital', label: 'Hospital', emoji: '🏥', services: ['Urgencias', 'Farmacia', 'Ambulancia'] },
    { key: 'policia', amenity: 'police', label: 'Estación de Policía', emoji: '🚓', services: ['Denuncias', 'Emergencias'] },
    { key: 'central_autobus', amenity: 'bus_station', label: 'Central de Autobuses', emoji: '🚌', services: ['Boletos', 'Andenes', 'Taxis'] },
    { key: 'aeropuerto', amenity: null, aeroway: 'aerodrome', label: 'Aeropuerto', emoji: '✈️', services: ['Vuelos', 'Taxis', 'Renta de Autos'] }
];

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
        console.warn('⚠️ No se encontró ningún admin. Buscando el primer usuario disponible como fallback...');
        adminUser = await prisma.user.findFirst();
    }

    if (!adminUser) {
        console.error('❌ ERROR CRÍTICO: No se encontró ningún usuario en la base de datos.');
        process.exit(1);
    }

    console.log(`✅ Usuario asignado: ${adminUser.name || 'Admin'} (${adminUser.email})`);

    if (cityArg) {
        await importRegion(cityArg, adminUser);
    } else {
        console.log('🏗️ Iniciando importación masiva de SERVICIOS PÚBLICOS...');
        console.log('💡 Procesando un tipo a la vez para optimizar memoria\n');

        // Process each TYPE one at a time across all states
        for (const type of TYPES) {
            console.log(`\n🔄 === PROCESANDO: ${type.emoji} ${type.label.toUpperCase()} ===\n`);

            for (const state of STATES) {
                await importTypeForState(type, state, adminUser);
                // Small pause between states
                await new Promise(r => setTimeout(r, 3000));
            }

            console.log(`\n✅ === COMPLETADO: ${type.emoji} ${type.label.toUpperCase()} ===\n`);
            // Longer pause between types to allow GC
            await new Promise(r => setTimeout(r, 5000));
        }
    }

    console.log('\n🏁 IMPORTACIÓN GLOBAL COMPLETADA 🏁');
}

async function importTypeForState(type: any, regionName: string, adminUser: any) {
    let query = '';
    if (type.key === 'aeropuerto') {
        query = `[out:json][timeout:60];
            (
              area["name"="${regionName}"]["admin_level"~"4|6|7|8"];
              area["name"~"${regionName}"]["admin_level"~"4"];
            )->.searchArea;
            (
              node["aeroway"="aerodrome"]["name"](area.searchArea);
              way["aeroway"="aerodrome"]["name"](area.searchArea);
            );
            out center qt;`;
    } else {
        query = `[out:json][timeout:60];
            (
              area["name"="${regionName}"]["admin_level"~"4|6|7|8"];
              area["name"~"${regionName}"]["admin_level"~"4"];
            )->.searchArea;
            (
              node["amenity"="${type.amenity}"]["name"](area.searchArea);
              way["amenity"="${type.amenity}"]["name"](area.searchArea);
            );
            out center qt;`;
    }

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
            // Try next mirror
        }
    }

    if (!success || elements.length === 0) {
        return;
    }

    let addedCount = 0;

    // Process in smaller batches
    // Sequential processing
    for (const node of elements) {
        const lat = node.lat || node.center?.lat;
        const lon = node.lon || node.center?.lon;
        if (!lat || !lon) continue;

        // Deduplication
        const exists = await prisma.business.findFirst({
            where: {
                latitude: { gte: lat - 0.0001, lte: lat + 0.0001 },
                longitude: { gte: lon - 0.0001, lte: lon + 0.0001 },
                category: type.key
            }
        });

        if (exists) continue;

        const name = node.tags?.name || type.label;
        if (!name || name.length < 3) continue;

        const city = node.tags?.['addr:city'] || regionName;
        const description = `${type.emoji} ${type.label}: ${name}. Ubicado en ${city}, ${regionName}.`;
        const slug = generateSlug(`${name} ${city}`) + '-' + (node.id || Math.random().toString(36).slice(2, 7));

        try {
            await prisma.business.create({
                data: {
                    userId: adminUser.id,
                    name: name,
                    slug: slug,
                    category: type.key,
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
                    services: type.services,
                    hours: '24 Horas',
                    is24Hours: true,
                    expiresAt: new Date(Date.now() + 315360000000),
                    images: []
                }
            });
            addedCount++;
        } catch (err: any) {
            // Ignore
        }
        // Small delay to prevent connection pool exhaustion
        await new Promise(r => setTimeout(r, 100));
    }

    if (addedCount > 0) {
        console.log(`   ✅ ${regionName}: ${addedCount} ${type.label}`);
    }
}

async function importRegion(regionName: string, adminUser: any) {
    // For single region mode, process all types
    for (const type of TYPES) {
        await importTypeForState(type, regionName, adminUser);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
