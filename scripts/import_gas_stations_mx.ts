
import { prisma } from '../src/lib/db';
import dotenv from 'dotenv';
// fetch is global in Node 18+

dotenv.config();

// Config
// Reverting to Main Instance with GET request for maximum compatibility
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const TIMEOUT_SECONDS = 900; // 15 Minutos para país completo
const BATCH_SIZE = 50;

async function importGasStations() {
    console.log('⛽ Iniciando importación de Gasolineras para TODO MÉXICO...');

    // 1. Find Admin User
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
        console.error('👉 Por favor registra un usuario y asígnalo como admin, o configura ADMIN_EMAIL en .env');
        process.exit(1);
    }

    console.log(`✅ Asignando gasolineras al usuario: ${adminUser.name || 'Admin'} (${adminUser.email})`);

    // 2. Fetch from Overpass API
    console.log('🌍 Descargando datos de OpenStreetMap para TODO MÉXICO (Esto puede tardar varios minutos)...');

    // Query: Nodes tagged as fuel in Mexico (Relation 3601146805)
    // Warning: Area ID in Overpass is 3600000000 + OSM Relation ID. Mexico is 1146805 -> 3601146805
    const query = `[out:json][timeout:900];area(3601146805)->.searchArea;(node["amenity"="fuel"](area.searchArea););out qt;`;
    const url = `${OVERPASS_URL}?data=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Overpass API Error: ${response.status} ${response.statusText} \nBody: ${text.slice(0, 200)}`);
        }

        const data: any = await response.json();
        const elements = data.elements || [];
        console.log(`📡 Se encontraron ${elements.length} gasolineras en TODO MÉXICO.`);

        // 3. Process and Insert
        console.log('💾 Procesando y guardando en base de datos...');

        let addedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        // Process in batches
        for (let i = 0; i < elements.length; i += BATCH_SIZE) {
            const batch = elements.slice(i, i + BATCH_SIZE);

            await Promise.all(batch.map(async (node: any) => {
                try {
                    // Check if exists close by (simple dedup by checking exact coordinates or name+city)
                    const exists = await prisma.business.findFirst({
                        where: {
                            latitude: node.lat,
                            longitude: node.lon,
                            category: 'gasolinera'
                        }
                    });

                    if (exists) {
                        skippedCount++;
                        return;
                    }

                    // Extract suitable name
                    const brand = node.tags?.brand || '';
                    let name = node.tags?.name || brand || 'Gasolinera';

                    // Si el nombre es genérico "Gasolinera" y hay marca, prefiero "Pemex", "Oxxo Gas", etc.
                    if (name === 'Gasolinera' && brand) name = brand;

                    // Build address
                    const street = node.tags?.['addr:street'] || '';
                    const number = node.tags?.['addr:housenumber'] || '';
                    const address = (street + ' ' + number).trim() || `Ubicación: ${node.lat.toFixed(4)}, ${node.lon.toFixed(4)}`;

                    // Usa la info de tag (puede venir vacia en muchos nodos, pero intentamos)
                    const city = node.tags?.['addr:city'] || 'México';
                    const state = node.tags?.['addr:state'] || '';

                    await prisma.business.create({
                        data: {
                            userId: adminUser.id,
                            name: name,
                            category: 'gasolinera', // Matches CATEGORY_COLORS key
                            description: `Gasolinera ${brand} verificada. Servicios disponibles.`,
                            address: address,
                            city: city,
                            state: state,
                            country: 'MX',
                            latitude: node.lat,
                            longitude: node.lon,
                            isActive: true, // Auto-activate
                            isFreePublication: true,
                            phone: node.tags?.phone || null,
                            website: node.tags?.website || null,
                            services: ['Baños', 'Tienda de Conveniencia', 'Magna', 'Premium', 'Aire'],
                            hours: node.tags?.opening_hours || '24 Horas',
                            images: [], // No images from OSM usually
                            is24Hours: node.tags?.opening_hours === '24/7',
                            hasMiniWeb: false,
                        }
                    });
                    addedCount++;
                } catch (err) {
                    errorCount++;
                }
            }));

            // Progress log
            console.log(`🔄 Progreso: ${Math.min(i + BATCH_SIZE, elements.length)}/${elements.length} procesados...`);
        }

        console.log('🏁 IMPORTACIÓN COMPLETADA');
        console.log(`✅ Agregadas: ${addedCount}`);
        console.log(`⏭️ Saltadas (ya existían): ${skippedCount}`);
        console.log(`❌ Errores: ${errorCount}`);

    } catch (error) {
        console.error('💥 Error en el proceso:', error);
    } finally {
        await prisma.$disconnect();
    }
}

importGasStations();
