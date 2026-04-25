import { PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('REG-Admin-2026!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@reg.gov.rw' },
    update: {},
    create: {
      email: 'admin@reg.gov.rw',
      fullName: 'HQ Administrator',
      password: password,
      role: Role.HQ_ADMIN,
      status: UserStatus.ENABLED,
      mustChangePassword: false,
    },
  });

  console.log({ admin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
