// Script de migración en JavaScript puro (sin TypeScript)
const { PrismaClient } = require('@prisma/client')

// Importar datos desde el archivo de taxonomía
const taxonomyPath = require('path').join(__dirname, '../src/lib/vehicleTaxonomy.ts')
console.log('⚠️  NOTA: Este script requiere que el proyecto esté compilado o usa datos hardcodeados')

// Datos hardcodeados para la migración (copiados de vehicleTaxonomy.ts)
const BRANDS = {
    'Automóvil': ['Acura', 'Alfa Romeo', 'Aston Martin', 'Audi', 'BAIC', 'Bentley', 'BMW', 'Bugatti', 'Buick', 'BYD', 'Cadillac', 'Changan', 'Chery', 'Chevrolet', 'Chrysler', 'Citroën', 'Cupra', 'Dacia', 'Daewoo', 'Dodge', 'Ferrari', 'Fiat', 'Ford', 'GAC', 'Geely', 'Genesis', 'GMC', 'Great Wall', 'Haval', 'Honda', 'Hummer', 'Hyundai', 'Infiniti', 'Isuzu', 'JAC', 'Jaguar', 'Jeep', 'Jetour', 'Kia', 'Koenigsegg', 'Lamborghini', 'Land Rover', 'Lexus', 'Lincoln', 'Lotus', 'Maserati', 'Mazda', 'McLaren', 'Mercedes-Benz', 'MG', 'Mini', 'Mitsubishi', 'Nissan', 'Omoda', 'Opel', 'Pagani', 'Peugeot', 'Porsche', 'RAM', 'Renault', 'Rolls-Royce', 'Saab', 'SEAT', 'Smart', 'Subaru', 'Suzuki', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo', 'Zeekr'].sort(),
    'Motocicleta': ['Aprilia', 'Arctic Cat', 'Bajaj', 'Benelli', 'Beta', 'BMW Motorrad', 'BRP (Can-Am)', 'CFMoto', 'Ducati', 'GasGas', 'Harley-Davidson', 'Hero', 'Honda', 'Husqvarna', 'Indian', 'Italika', 'Kawasaki', 'KTM', 'Kymco', 'MV Agusta', 'Piaggio', 'Polaris', 'Royal Enfield', 'Segway Powersports', 'Sherco', 'Suzuki', 'Triumph', 'TVS', 'Vento', 'Vespa', 'Yamaha', 'Zontes'].sort(),
    'Camión': ['Caterpillar', 'Chevrolet', 'DAF', 'Daimler', 'Dodge', 'Fiat', 'Ford', 'Freightliner', 'GMC', 'Hino', 'Hyundai', 'International', 'Isuzu', 'Iveco', 'JAC', 'Kamaz', 'Kenworth', 'Mack', 'MAN', 'Mercedes-Benz', 'Mitsubishi Fuso', 'Navistar', 'Peterbilt', 'RAM', 'Renault Trucks', 'Scania', 'Tata', 'UD Trucks', 'Volvo Trucks', 'Western Star'].sort(),
    'Autobús': ['Alexander Dennis', 'BYD', 'Daimler', 'Dennis', 'Dina', 'Hino', 'Hyundai', 'Irizar', 'Iveco', 'King Long', 'MAN', 'Mercedes-Benz', 'Neoplan', 'New Flyer', 'Prevost', 'Proterra', 'Scania', 'Setra', 'Tata', 'Van Hool', 'Volvo Buses', 'Yutong'].sort(),
    'Maquinaria': ['CASE', 'Caterpillar', 'Doosan', 'Hitachi', 'Hyundai', 'JCB', 'John Deere', 'Komatsu', 'Kubota', 'Liebherr', 'New Holland', 'SANY', 'Terex', 'Volvo CE', 'XCMG', 'Yanmar'].sort(),
    'Especial': ['Club Car', 'Custom', 'E-Z-GO', 'Otro', 'Polaris RZR', 'Yamaha'].sort(),
    'Drones': ['DJI', 'Autel Robotics', 'Parrot', 'Skydio', 'Yuneec', 'Hubsan', 'Syma', 'Holy Stone', 'BetaFPV', 'iFlight'].sort()
}

const POPULAR_MODELS = {
    'Acura': ['ILX', 'TLX', 'Integra', 'MDX', 'RDX', 'NSX', 'ZDX'],
    'Alfa Romeo': ['Giulia', 'Stelvio', 'Tonale', '4C', 'MiTo'],
    'Audi': ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'R8', 'e-tron', 'RS3', 'RS5', 'RS6', 'RS7', 'RS Q8'],
    'BMW': ['Serie 1', 'Serie 2', 'Serie 3', 'Serie 4', 'Serie 5', 'Serie 7', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4', 'M2', 'M3', 'M4', 'M5', 'i3', 'i4', 'iX'],
    'Buick': ['Encore', 'Envision', 'Enclave', 'LaCrosse', 'Regal'],
    'Cadillac': ['CT4', 'CT5', 'XT4', 'XT5', 'XT6', 'Escalade', 'Lyriq'],
    'Chevrolet': ['Aveo', 'Spark', 'Beat', 'Sonic', 'Cruze', 'Malibu', 'Camaro', 'Corvette', 'Trax', 'Tracker', 'Equinox', 'Blazer', 'Traverse', 'Tahoe', 'Suburban', 'Silverado', 'Cheyenne', 'Colorado', 'S10', 'Tornado', 'Cavalier', 'Onix', 'Captiva', 'Groove'],
    'Chrysler': ['300', 'Pacifica', 'Voyager'],
    'Dodge': ['Attitude', 'Neon', 'Charger', 'Challenger', 'Durango', 'Journey', 'Grand Caravan', 'RAM 1500', 'RAM 2500', 'RAM 4000', 'Dakota'],
    'Fiat': ['500', '500X', 'Tipo', 'Panda', 'Argo', 'Cronos', 'Mobi', 'Toro'],
    'Ford': ['Fiesta', 'Focus', 'Figo', 'Fusion', 'Mustang', 'EcoSport', 'Escape', 'Edge', 'Explorer', 'Expedition', 'Bronco', 'Bronco Sport', 'Ranger', 'F-150', 'Lobo', 'Maverick', 'Transit', 'Transit Courier', 'Territory'],
    'GMC': ['Sierra', 'Canyon', 'Terrain', 'Acadia', 'Yukon', 'Savana'],
    'Honda': ['Civic', 'City', 'Fit', 'Accord', 'Insight', 'CR-V', 'HR-V', 'BR-V', 'Pilot', 'Odyssey', 'Ridgeline', 'Element', 'Passport', 'CBR1000RR', 'CBR600RR', 'CBR500R', 'CBR300R', 'CBR250R', 'CRF450', 'CRF250', 'CRF1100 Africa Twin', 'Gold Wing', 'Rebel', 'Shadow', 'Grom', 'Navi', 'Dio', 'Elite', 'PCX', 'Varios', 'Cargo', 'Invicta', 'CB190R', 'CB500X', 'NC750X'],
    'Hyundai': ['Grand i10', 'Accent', 'Elantra', 'Sonata', 'Creta', 'Tucson', 'Santa Fe', 'Palisade', 'Venue', 'Staria', 'H100', 'Ioniq'],
    'Infiniti': ['Q50', 'Q60', 'QX50', 'QX55', 'QX60', 'QX80'],
    'Jeep': ['Wrangler', 'Rubicon', 'Sahara', 'Gladiator', 'Cherokee', 'Grand Cherokee', 'Compass', 'Renegade', 'Patriot', 'Commander', 'Wagoneer'],
    'Kia': ['Rio', 'Forte', 'K3', 'Optima', 'Stinger', 'Soul', 'Seltos', 'Sportage', 'Sorento', 'Telluride', 'Niro', 'Sedona', 'Carnival'],
    'Lexus': ['IS', 'ES', 'GS', 'LS', 'RC', 'LC', 'UX', 'NX', 'RX', 'GX', 'LX', 'RZ'],
    'Lincoln': ['Corsair', 'Nautilus', 'Aviator', 'Navigator'],
    'Mazda': ['Mazda 2', 'Mazda 3', 'Mazda 6', 'MX-5', 'CX-3', 'CX-30', 'CX-5', 'CX-50', 'CX-9', 'CX-90', 'BT-50'],
    'Mercedes-Benz': ['Clase A', 'Clase C', 'Clase E', 'Clase S', 'CLA', 'CLS', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'Clase G', 'EQA', 'EQC', 'EQS', 'Sprinter'],
    'Mitsubishi': ['Mirage', 'Attrage', 'Lancer', 'Eclipse Cross', 'Outlander', 'Montero', 'Pajero', 'L200'],
    'Nissan': ['Versa', 'Sentra', 'March', 'Tiida', 'Tsuru', 'Altima', 'Maxima', 'Kicks', 'X-Trail', 'Pathfinder', 'Murano', 'Armada', 'Frontier', 'NP300', 'Titan', 'Urvan', 'Leaf', 'V-Drive', '370Z', 'GT-R'],
    'Porsche': ['911', 'Taycan', 'Panamera', 'Cayenne', 'Macan', 'Boxster', 'Cayman'],
    'RAM': ['1500', '2500', '3500', '4000', 'ProMaster'],
    'Renault': ['Kwid', 'Sandero', 'Logan', 'Stepway', 'Duster', 'Oroch', 'Koleos', 'Captur'],
    'Subaru': ['Impreza', 'Legacy', 'Outback', 'Forester', 'Crosstrek', 'Ascent', 'WRX', 'BRZ'],
    'Suzuki': ['Swift', 'Baleno', 'Ignis', 'Vitara', 'S-Cross', 'Ertiga', 'Ciaz', 'Jimny', 'GSX-R600', 'GSX-R750', 'GSX-R1000', 'GSX-S750', 'GSX-S1000', 'V-Strom 650', 'V-Strom 1050', 'Hayabusa', 'Boulevard', 'DR650'],
    'Tesla': ['Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck', 'Roadster'],
    'Toyota': ['Corolla', 'Camry', 'Prius', 'Yaris', 'Supra', 'RAV4', 'Highlander', 'Sienna', 'Tacoma', 'Tundra', 'Hilux', 'Avanza', 'C-HR', 'Corolla Cross', 'Sequoia', 'Land Cruiser', '4Runner', 'Hiace'],
    'Volkswagen': ['Jetta', 'Golf', 'Polo', 'Vento', 'Virtus', 'Passat', 'Arteon', 'Beetle', 'Tiguan', 'Taos', 'T-Cross', 'Nivus', 'Teramont', 'Touareg', 'Saveiro', 'Amarok', 'Crafter', 'Transporter', 'Caddy', 'ID.4', 'Gol', 'CrossFox'],
    'Volvo': ['S60', 'S90', 'V60', 'V90', 'XC40', 'XC60', 'XC90', 'C40'],
    'Yamaha': ['R1', 'R6', 'R3', 'R15', 'MT-03', 'MT-07', 'MT-09', 'MT-10', 'FZ-07', 'FZ-09', 'Fazer', 'XMAX', 'NMAX', 'Ray ZR', 'Crypton', 'V-Star', 'Bolt', 'Super Tenere', 'Tenere 700', 'YZF', 'WR250', 'WR450'],
    'Kawasaki': ['Ninja 400', 'Ninja 650', 'Ninja ZX-6R', 'Ninja ZX-10R', 'Z400', 'Z650', 'Z900', 'Versys 650', 'Versys 1000', 'Vulcan', 'KLR650', 'KX450'],
    'Ducati': ['Panigale V2', 'Panigale V4', 'Monster', 'Streetfighter', 'Multistrada', 'Diavel', 'Scrambler', 'Hypermotard'],
    'KTM': ['Duke 200', 'Duke 390', 'Duke 790', 'RC 390', 'Adventure 390', 'Adventure 1290', '450 SX-F', '250 SX'],
    'Harley-Davidson': ['Street 750', 'Iron 883', 'Sportster', 'Softail', 'Road King', 'Street Glide', 'Road Glide', 'Fat Boy', 'Pan America'],
    'BMW Motorrad': ['G 310 R', 'F 900 R', 'S 1000 RR', 'R 1250 GS', 'R 1250 RT', 'K 1600'],
    'Triumph': ['Street Triple', 'Speed Triple', 'Bonneville', 'Scrambler', 'Tiger', 'Rocket 3'],
    'Italika': ['FT150', 'FT125', 'DT150', 'DM200', 'DM250', 'WS150', 'DS150', 'Vort-X 200', 'Vort-X 300', 'Vort-X 650', 'Blackbird']
}

const VEHICLE_CATEGORIES = {
    'automovil': ['Sedán', 'SUV', 'Hatchback', 'Coupé', 'Convertible', 'Camioneta', 'Station Wagon', 'Crossover'],
    'motocicleta': ['Deportiva', 'Touring', 'Cruiser', 'Naked', 'Adventure', 'Scooter', 'Enduro', 'Chopper'],
    'comercial': ['Pickup', 'Camión Ligero', 'Camión Pesado', 'Tráiler', 'Volteo'],
    'industrial': ['Montacargas', 'Excavadora', 'Retroexcavadora', 'Grúa', 'Bulldozer', 'Compactadora'],
    'transporte': ['Autobús', 'Microbús', 'Van de Pasajeros', 'Autobús Escolar'],
    'especial': ['Carrito de Golf', 'Vehículo Recreativo (RV)', 'ATV', 'UTV', 'Cuatrimoto']
}

const prisma = new PrismaClient()

async function migrateData() {
    console.log('🚀 Iniciando migración de datos estáticos a PostgreSQL...\n')

    let totalBrands = 0
    let totalModels = 0
    let totalTypes = 0

    try {
        // Paso 1: Migrar marcas y modelos
        console.log('📦 Paso 1/2: Migrando marcas y modelos...')

        for (const [category, brandList] of Object.entries(BRANDS)) {
            console.log(`\n  📁 Categoría: ${category}`)

            for (const brandName of brandList) {
                // Crear o actualizar marca
                const brand = await prisma.brand.upsert({
                    where: { name: brandName },
                    update: {
                        category,
                        isActive: true
                    },
                    create: {
                        name: brandName,
                        category,
                        source: 'manual',
                        isActive: true
                    }
                })

                totalBrands++

                // Migrar modelos si existen
                const models = POPULAR_MODELS[brandName] || []

                if (models.length > 0) {
                    for (const modelName of models) {
                        try {
                            await prisma.model.upsert({
                                where: {
                                    brandId_name: {
                                        brandId: brand.id,
                                        name: modelName
                                    }
                                },
                                update: {
                                    isActive: true
                                },
                                create: {
                                    name: modelName,
                                    brandId: brand.id,
                                    source: 'manual',
                                    isActive: true
                                }
                            })
                            totalModels++
                        } catch (error) {
                            console.error(`    ⚠️  Error con modelo ${modelName}:`, error.message)
                        }
                    }
                    console.log(`    ✅ ${brandName}: ${models.length} modelos`)
                } else {
                    console.log(`    ⚪ ${brandName}: Sin modelos predefinidos`)
                }
            }
        }

        // Paso 2: Migrar tipos de vehículos
        console.log('\n📦 Paso 2/2: Migrando tipos de vehículos...')

        for (const [category, types] of Object.entries(VEHICLE_CATEGORIES)) {
            console.log(`\n  📁 Categoría: ${category}`)

            for (const typeName of types) {
                await prisma.vehicleType.upsert({
                    where: { name: typeName },
                    update: {
                        category,
                        isActive: true
                    },
                    create: {
                        name: typeName,
                        category,
                        source: 'manual',
                        isActive: true
                    }
                })
                totalTypes++
            }
            console.log(`    ✅ ${types.length} tipos migrados`)
        }

        // Resumen final
        console.log('\n' + '='.repeat(60))
        console.log('✨ MIGRACIÓN COMPLETADA CON ÉXITO\n')
        console.log(`  📊 Total de marcas migradas:  ${totalBrands}`)
        console.log(`  📊 Total de modelos migrados: ${totalModels}`)
        console.log(`  📊 Total de tipos migrados:   ${totalTypes}`)
        console.log('='.repeat(60) + '\n')

    } catch (error) {
        console.error('\n❌ ERROR durante la migración:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Ejecutar migración
migrateData()
    .then(() => {
        console.log('👍 Proceso completado. La base de datos está lista.')
        process.exit(0)
    })
    .catch((error) => {
        console.error('💥 Falló la migración:', error)
        process.exit(1)
    })
