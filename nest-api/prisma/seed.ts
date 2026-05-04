import { PrismaClient, Role, UserStatus, IncidentClass } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Generate Hashed Passwords
  const hqAdminPassword = await bcrypt.hash('GRIDGuard-Admin-2026!', 10);
  const user1Password = await bcrypt.hash('Telysee2002@', 10);
  const user2Password = await bcrypt.hash('Telysee2002@', 10);

  // 2. Seed HQ Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@reg.gov.rw' },
    update: {},
    create: {
      email: 'admin@reg.gov.rw',
      fullName: 'HQ Administrator',
      password: hqAdminPassword,
      role: Role.HQ_ADMIN,
      status: UserStatus.ENABLED,
      mustChangePassword: false, // Set to 0
    },
  });

  // 3. Seed Branch
  const branch = await prisma.branch.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Kigali Main Branch',
      region: 'Kigali',
      address: 'KN 2 St, Kigali',
    },
  });

  // 4. Seed New Branch Users
  const branchUsers = [
    {
      email: 'tuyisengeelysee1@gmail.com',
      fullName: 'TUYISENGE Elysée',
      password: user1Password,
      role: Role.BRANCH_USER,
      status: UserStatus.ENABLED,
      mustChangePassword: false, // Set to 0
      branchId: branch.id,
    },
    {
      email: 'tuyisengeelysee10@gmail.com',
      fullName: 'Ezi Skz',
      password: user2Password,
      role: Role.BRANCH_USER,
      status: UserStatus.ENABLED,
      mustChangePassword: false, // Set to 0
      branchId: branch.id,
    },
  ];

  for (const userData of branchUsers) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
  }

  console.log('Admin and Branch Users seeded successfully.');

  // 5. Seed Device
  const device = await prisma.device.upsert({
    where: { id: 'DEV-001' },
    update: {},
    create: {
      id: 'DEV-001',
      name: 'Main Entrance Camera',
      branchId: branch.id,
      status: 'online',
      incidentStatus: 'safe',
      lat: -1.9441,
      lng: 30.0619,
      address: 'Kacyiru, Gasabo, Kigali',
      province: 'Kigali City',
      district: 'Gasabo',
      sector: 'Kacyiru',
      cell: 'Kamukina',
    },
  });

  // 6. Seed Incidents
  const incidents = [
    {
      deviceId: 'DEV-001',
      aiClass: IncidentClass.VANDAL,
      aiConfidence: 0.95,
      alertStatus: true,
      videoPath: '/uploads/incidents/videos/incident-001.mp4',
    },
    {
      deviceId: 'DEV-001',
      aiClass: IncidentClass.SUSPICIOUS,
      aiConfidence: 0.87,
      alertStatus: false,
      videoPath: null,
    },
    {
      deviceId: 'DEV-001',
      aiClass: IncidentClass.OPENING_BOX,
      aiConfidence: 0.92,
      alertStatus: true,
      videoPath: '/uploads/incidents/videos/incident-003.mp4',
    },
  ];

  for (const incidentData of incidents) {
    await prisma.incident.create({
      data: incidentData,
    });
  }
  
  console.log('Devices and Incidents seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
