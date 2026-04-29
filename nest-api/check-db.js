
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLocations() {
  try {
    const count = await prisma.location.count();
    console.log(`Location count: ${count}`);
    if (count > 0) {
      const sample = await prisma.location.findFirst();
      console.log('Sample location:', sample);
    }
  } catch (error) {
    console.error('Error checking locations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLocations();
