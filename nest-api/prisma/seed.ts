import { PrismaClient, Role, UserStatus, IncidentClass } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('REG-Admin-2026!', 10);

  // Seed Admin User only
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

  // Seed Branch (required for Device)
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

  // Seed Device (required for Incident)
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

  // Seed Incidents matching the Incident schema
  const incidents = [
    {
      deviceId: 'DEV-001',
      aiClass: IncidentClass.THIEF,
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
      aiClass: IncidentClass.SUSPICIOUS,
      aiConfidence: 0.78,
      alertStatus: false,
      videoPath: '/uploads/incidents/videos/incident-003.mp4',
    },
  ];

  for (const incidentData of incidents) {
    await prisma.incident.create({
      data: incidentData,
    });
  }
  console.log('Incidents seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
