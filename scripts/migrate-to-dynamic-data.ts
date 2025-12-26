import { PrismaClient } from '@prisma/client'
import { BRANDS, POPULAR_MODELS, VEHICLE_CATEGORIES } from '../src/lib/vehicleTaxonomy'

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
                            console.error(`    ⚠️  Error con modelo ${modelName}:`, error)
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
