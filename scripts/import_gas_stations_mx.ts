
import { prisma } from '../src/lib/db';
import { generateSlug } from '../src/lib/slug';
import dotenv from 'dotenv';
// fetch is global in Node 18+

dotenv.config();

// Config
// Reverting to Main Instance with GET request for maximum compatibility
const OVERPASS_MIRRORS = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://z.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
];
const TIMEOUT_SECONDS = 900;
const BATCH_SIZE = 100;

// Obtener ciudad de los argumentos de línea de comandos
const cityArg = process.argv[2];

async function importGasStations() {
    if (cityArg) {
        console.log(`⛽ Iniciando importación de Gasolineras para: ${cityArg}...`);
    } else {
        console.log('⛽ Iniciando importación de Gasolineras para TODO MÉXICO...');
        console.warn('⚠️ ADVERTENCIA: Importar todo México puede ser muy lento y fallar por timeout.');
    }

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
    if (cityArg) {
        console.log(`🌍 Descargando datos de OpenStreetMap para ${cityArg}...`);
    } else {
        console.log('🌍 Descargando datos de OpenStreetMap para TODO MÉXICO (Esto puede tardar varios minutos)...');
    }

    try {
        // Query: Buscamos gasolineras (nodos, vías y relaciones) en el área de la ciudad.
        // Usamos un filtro de admin_level para priorizar municipios (8) o estados (4) si es necesario.
        const query = cityArg
            ? `[out:json][timeout:900];
                (
                  area["name"="${cityArg}"]["admin_level"~"8|6|7|4"];
                  area["name"="Municipio de ${cityArg}"];
                  area["name"~"${cityArg}"]["admin_level"="8"];
                )->.searchArea;
                (
                  node["amenity"="fuel"](area.searchArea);
                  way["amenity"="fuel"](area.searchArea);
                  relation["amenity"="fuel"](area.searchArea);
                );
                out center qt;`
            : `[out:json][timeout:900];area["ISO3166-1"="MX"]->.searchArea;(node["amenity"="fuel"](area.searchArea);way["amenity"="fuel"](area.searchArea);relation["amenity"="fuel"](area.searchArea););out center qt;`;

        let elements = [];
        let success = false;

        for (const mirror of OVERPASS_MIRRORS) {
            if (success) break;
            console.log(`🌍 Intentando con mirror: ${mirror}...`);
            const url = `${mirror}?data=${encodeURIComponent(query)}`;

            try {
                const response = await fetch(url);

                if (!response.ok) {
                    console.warn(`⚠️ Mirror ${mirror} falló: ${response.status} ${response.statusText}`);
                    continue;
                }

                const data: any = await response.json();
                elements = data.elements || [];
                if (elements.length > 0) {
                    console.log(`📡 Se encontraron ${elements.length} gasolineras en ${cityArg || 'México'}.`);
                    success = true;
                } else {
                    console.warn(`⚠️ Mirror ${mirror} devolvió 0 resultados.`);
                }
            } catch (err) {
                console.warn(`❌ Error con mirror ${mirror}:`, err instanceof Error ? err.message : err);
            }
        }

        if (!success) {
            console.error('❌ ERROR: Todos los mirrors de Overpass fallaron o devolvieron 0 resultados.');
            if (cityArg) {
                console.error(`👉 TIPS:`);
                console.error(`   1. Asegúrate de que "${cityArg}" sea el nombre oficial (ej: "Tijuana", no "Tij").`);
                console.error(`   2. Si es una ciudad con nombre compuesto, intenta con comillas.`);
                console.error(`   3. A veces OSM usa nombres como "Municipio de ${cityArg}".`);
            }
            process.exit(1);
        }

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
                    // Si es way o relation, el punto es 'center', si es node es lat/lon
                    const lat = node.lat || node.center?.lat;
                    const lon = node.lon || node.center?.lon;

                    if (!lat || !lon) return;

                    // Check if exists close by
                    const exists = await prisma.business.findFirst({
                        where: {
                            latitude: { gte: lat - 0.0001, lte: lat + 0.0001 },
                            longitude: { gte: lon - 0.0001, lte: lon + 0.0001 },
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
                    const address = (street + ' ' + number).trim() || `Ubicación: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;

                    // Usara la info de tag o el argumento de ciudad
                    const city = node.tags?.['addr:city'] || cityArg || 'México';
                    const state = node.tags?.['addr:state'] || '';

                    // Generar Slug Único
                    const baseSlug = generateSlug(`${name} ${city}`);
                    const osmIdSuffix = node.id ? node.id.toString().slice(-5) : Math.random().toString(36).substring(2, 7);
                    const finalSlug = `${baseSlug}-${osmIdSuffix}`;

                    // Establecer vigencia de 10 años para administrador
                    const now = new Date();
                    const expirationDate = new Date();
                    expirationDate.setFullYear(now.getFullYear() + 10);

                    await prisma.business.create({
                        data: {
                            userId: adminUser.id,
                            name: name,
                            slug: finalSlug,
                            category: 'gasolinera', // Matches CATEGORY_COLORS key
                            description: `Gasolinera ${brand} verificada en ${city}. Ubicación estratégica y servicios de calidad.`,
                            address: address,
                            city: city,
                            state: state,
                            country: 'MX',
                            latitude: lat,
                            longitude: lon,
                            isActive: true, // Auto-activate
                            isFreePublication: true,
                            phone: node.tags?.phone || null,
                            website: node.tags?.website || null,
                            services: ['Magna', 'Premium', 'Diesel', 'Baños', 'Tienda'],
                            hours: node.tags?.opening_hours || '24 Horas',
                            images: [],
                            is24Hours: node.tags?.opening_hours === '24/7' || node.tags?.opening_hours === '24 hours' || node.tags?.opening_hours === '24h',
                            hasMiniWeb: false,
                            expiresAt: expirationDate,
                        }
                    });
                    addedCount++;
                } catch (err) {
                    console.error('❌ Error al insertar:', err);
                    errorCount++;
                }
            }));

            // Progress log
            console.log(`🔄 Progreso: ${Math.min(i + BATCH_SIZE, elements.length)}/${elements.length} procesados...`);
        }

        console.log('🏁 IMPORTACIÓN COMPLETADA');
        console.log(`📍 Ciudad: ${cityArg || 'Todo México'}`);
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

