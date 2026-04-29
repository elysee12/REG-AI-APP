
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addIdColumn() {
  try {
    console.log('Adding id column to locations table...');
    await prisma.$executeRawUnsafe('ALTER TABLE locations ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST');
    console.log('Successfully added id column.');
  } catch (error) {
    console.error('Error adding id column:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addIdColumn();
