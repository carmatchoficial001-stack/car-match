import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  console.log('Testing connection...')
  try {
    const count = await prisma.systemLog.count()
    console.log('Connection successful. Log count:', count)
  } catch (e) {
    console.error('Connection failed:', e)
  }
}
main().catch(console.error).finally(() => prisma.$disconnect())
