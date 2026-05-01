import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const tables: any[] = await prisma.$queryRaw`SHOW TABLES`;
    console.log('Tables in database:', JSON.stringify(tables, null, 2));
    
    if (tables.length === 0) {
      console.log('Database is empty!');
    } else {
      console.log(`Found ${tables.length} tables.`);
    }
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
