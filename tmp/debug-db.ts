
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- RECENT SOCIAL POSTS ---')
  const posts = await prisma.socialPost.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      status: true,
      imageUrl: true,
      platform: true,
      createdAt: true
    }
  })
  console.table(posts)

  console.log('\n--- RECENT SYSTEM LOGS ---')
  const logs = await prisma.systemLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      source: true,
      level: true,
      message: true,
      createdAt: true
    }
  })
  console.table(logs)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
