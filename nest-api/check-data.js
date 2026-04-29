
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const result = await prisma.$queryRawUnsafe('SELECT * FROM locations LIMIT 5');
    console.log('Sample data:', result);
  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
