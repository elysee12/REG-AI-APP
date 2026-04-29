import { PrismaClient, Role, UserStatus } from '@prisma/client';
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
      type: 'Vandalism',
      severity: 'high',
      status: 'active',
      time: new Date(),
      motionStatus: 'detected',
      vibrationStatus: 'normal',
      accelX: 0.12,
      accelY: 9.81,
      accelZ: 0.05,
      accelStatus: 'normal',
      aiClass: 'vandalism',
      aiConfidence: 0.95,
      alertStatus: 'sent',
      imagePath: '/images/incident-001.jpg',
      videoPath: '/videos/incident-001.mp4',
      sourceNote: 'AI detection via camera DEV-001',
    },
    {
      deviceId: 'DEV-001',
      type: 'Unauthorized Access',
      severity: 'medium',
      status: 'resolved',
      time: new Date(Date.now() - 86400000),
      motionStatus: 'detected',
      vibrationStatus: 'normal',
      accelX: 0.08,
      accelY: 9.79,
      accelZ: 0.02,
      accelStatus: 'normal',
      aiClass: 'unauthorized_access',
      aiConfidence: 0.87,
      alertStatus: 'resolved',
      imagePath: '/images/incident-002.jpg',
      videoPath: null,
      sourceNote: 'Motion detected at back entrance',
    },
    {
      deviceId: 'DEV-001',
      type: 'Tampering',
      severity: 'low',
      status: 'active',
      time: new Date(Date.now() - 3600000),
      motionStatus: 'none',
      vibrationStatus: 'high',
      accelX: 2.45,
      accelY: 8.92,
      accelZ: 1.23,
      accelStatus: 'alert',
      aiClass: 'tampering',
      aiConfidence: 0.78,
      alertStatus: 'pending',
      imagePath: null,
      videoPath: '/videos/incident-003.mp4',
      sourceNote: 'Abnormal vibration detected',
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
