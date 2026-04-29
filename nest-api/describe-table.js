
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function describeTable() {
  try {
    const result = await prisma.$queryRawUnsafe('DESCRIBE locations');
    console.log('Table structure:', result);
  } catch (error) {
    console.error('Error describing table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

describeTable();
