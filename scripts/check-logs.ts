
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log("\n--- LAST 10 STUDIO MESSAGES (FULL) ---")
  const messages = await prisma.studioMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  })
  console.log(JSON.stringify(messages, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
