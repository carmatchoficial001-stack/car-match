
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Free publication & Admin User (Same as other public services)
const ADMIN_EMAIL = 'carmatchoficial001@gmail.com';

// Overpass API Mirrors
const OVERPASS_INSTANCES = [
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

function generateSlug(name: string): string {
    return name.toLowerCase()
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function fetchOverpass(query: string) {
    for (const url of OVERPASS_INSTANCES) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `data=${encodeURIComponent(query)}`,
                signal: controller.signal
            });
            clearTimeout(timeout);

            if (response.ok) return await response.json();
        } catch (e) {
            console.warn(`⚠️ Mirror ${url} failed, trying next...`);
        }
    }
    throw new Error('All Overpass mirrors failed');
}

async function importTrains(regionName: string, adminUser: any) {
    console.log(`👉 Procesando Estado: ${regionName}`);

    // Query for Train Stations
    const query = `
        [out:json][timeout:25];
        area["name"="${regionName}"]["admin_level"="4"]->.searchArea;
        (
          node["railway"="station"](area.searchArea);
          way["railway"="station"](area.searchArea);
        );
        out center;
    `;

    let data;
    try {
        data = await fetchOverpass(query);
    } catch (e) {
        console.error(`❌ Error descargando datos para ${regionName}:`, e);
        return;
    }

    const elements = data.elements || [];
    console.log(`📡 Recibidos ${elements.length} registros para ${regionName}. Guardando...`);

    if (elements.length === 0) return;

    let addedCount = 0;

    for (const node of elements) {
        const lat = node.lat || node.center?.lat;
        const lon = node.lon || node.center?.lon;
        if (!lat || !lon) continue;

        // Deduplication
        const exists = await prisma.business.findFirst({
            where: {
                latitude: { gte: lat - 0.0001, lte: lat + 0.0001 },
                longitude: { gte: lon - 0.0001, lte: lon + 0.0001 },
                category: 'estacion_tren'
            }
        });

        if (exists) continue;

        const name = node.tags?.name || 'Estación de Tren';
        const city = node.tags?.['addr:city'] || regionName;
        const description = `🚆 Estación de Tren: ${name}. Ubicado en ${city}, ${regionName}.`;
        const slug = generateSlug(`${name} ${city}`) + '-' + (node.id || Math.random().toString(36).slice(2, 7));

        try {
            await prisma.business.create({
                data: {
                    userId: adminUser.id,
                    name: name,
                    slug: slug,
                    category: 'estacion_tren',
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
                    services: ['Venta de Boletos', 'Andenes', 'Sala de Espera', 'Cafetería', 'Taxis'],
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
        // Small delay
        await new Promise(r => setTimeout(r, 100));
    }

    if (addedCount > 0) {
        console.log(`✅ ${regionName}: ${addedCount} estaciones agregadas.`);
    }
}

async function main() {
    console.log('🔍 Buscando usuario Administrador...');
    const adminUser = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

    if (!adminUser) {
        console.error('❌ No se encontró el usuario administrador.');
        return;
    }

    console.log(`✅ Usuario asignado: ${adminUser.name} (${adminUser.email})`);
    console.log('🚂 Iniciando importación de ESTACIONES DE TREN...');

    for (const state of STATES) {
        await importTrains(state, adminUser);
        await new Promise(r => setTimeout(r, 2000)); // Pause between states
    }

    console.log('🏁 IMPORTACIÓN DE TRENES COMPLETADA 🏁');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
