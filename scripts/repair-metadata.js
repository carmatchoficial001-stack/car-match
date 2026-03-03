
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('--- Starting Metadata Repair ---')
    const campaigns = await prisma.publicityCampaign.findMany()
    console.log(`Found ${campaigns.length} campaigns.`)

    for (const c of campaigns) {
        let meta = c.metadata
        if (!meta) continue

        let changed = false

        // 1. If metadata is a string, parse it
        if (typeof meta === 'string') {
            try {
                meta = JSON.parse(meta)
                changed = true
                console.log(`[CAMPAIGN ${c.id}] Parsed string metadata.`)
            } catch (e) {
                console.error(`[CAMPAIGN ${c.id}] Error parsing metadata string:`, e.message)
                continue
            }
        }

        // 2. If assets inside metadata is a string, parse it
        if (meta && meta.assets && typeof meta.assets === 'string') {
            try {
                meta.assets = JSON.parse(meta.assets)
                changed = true
                console.log(`[CAMPAIGN ${c.id}] Parsed nested assets string.`)
            } catch (e) {
                console.warn(`[CAMPAIGN ${c.id}] Could not parse assets string:`, e.message)
            }
        }

        if (changed) {
            await prisma.publicityCampaign.update({
                where: { id: c.id },
                data: { metadata: meta }
            })
            console.log(`[CAMPAIGN ${c.id}] SAVED.`)
        }
    }
    console.log('--- Repair Complete ---')
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
