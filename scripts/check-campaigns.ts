
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log("\n--- RECENT CAMPAIGNS ---")
  const campaigns = await prisma.publicityCampaign.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
        // We fetch posts manually since no relation
    }
  })
  
  const posts = await prisma.socialPost.findMany({
    orderBy: { createdAt: 'desc' },
    take: 15
  })

  console.log("Campaigns:", JSON.stringify(campaigns, null, 2))
  console.log("\nSocial Posts:", JSON.stringify(posts, null, 2))
  
  console.log("\n--- ERROR LOGS (LAST 10) ---")
  const logs = await prisma.systemLog.findMany({
    where: { level: 'ERROR' },
    orderBy: { createdAt: 'desc' },
    take: 10
  })
  console.log(JSON.stringify(logs, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
