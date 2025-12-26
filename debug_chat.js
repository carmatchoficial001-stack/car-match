
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log("Starting Chat Debug...")

    // 1. Get two users
    const users = await prisma.user.findMany({ take: 2 })
    if (users.length < 2) {
        console.log("Not enough users to test chat.")
        return
    }
    const buyer = users[1] // carro dos
    const seller = users[0] // carro uno
    console.log(`Buyer: ${buyer.name} (${buyer.id})`)
    console.log(`Seller: ${seller.name} (${seller.id})`)

    // 2. Find a vehicle owned by Seller (or create one for test?)
    // Let's find *any* vehicle first ideally owned by 'seller'
    let vehicle = await prisma.vehicle.findFirst({
        where: { userId: seller.id }
    })

    if (!vehicle) {
        console.log("Seller has no vehicles. Finding any vehicle not owned by buyer...")
        vehicle = await prisma.vehicle.findFirst({
            where: {
                NOT: { userId: buyer.id }
            }
        })
    }

    if (!vehicle) {
        console.log("No distinct vehicle found to test.")
        return
    }

    console.log(`Vehicle: ${vehicle.title} (${vehicle.id}) owned by ${vehicle.userId}`)

    // 3. Test findUnique
    console.log("Testing findUnique Chat...")
    try {
        const chat = await prisma.chat.findUnique({
            where: {
                vehicleId_buyerId: {
                    vehicleId: vehicle.id,
                    buyerId: buyer.id
                }
            }
        })
        console.log("findUnique result:", chat)
    } catch (e) {
        console.error("findUnique FAILED:", e)
    }

    // 4. Test Create (only if not found, to avoid unique error in this script, or handle it)
    console.log("Testing Create Chat...")
    try {
        // We use upsert or just create inside try/catch
        const newChat = await prisma.chat.create({
            data: {
                vehicleId: vehicle.id,
                buyerId: buyer.id,
                sellerId: vehicle.userId
            }
        })
        console.log("Create result:", newChat)
    } catch (e) {
        if (e.code === 'P2002') {
            console.log("Chat already exists (Unique constraint works).")
        } else {
            console.error("Create FAILED:", e)
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
