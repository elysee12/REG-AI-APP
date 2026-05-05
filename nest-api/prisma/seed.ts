import { PrismaClient, Role, UserStatus, IncidentClass, IncidentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const commonPassword = await bcrypt.hash('Telysee2002@', 10);

  // 1. Seed Branch
  const branch = await prisma.branch.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Kigali Main Branch',
      region: 'Kigali City',
      address: 'KN 2 St, Kigali',
    },
  });

  // 2. Seed Users
  const users = [
    {
      email: 'admin@reg.gov.rw',
      fullName: 'HQ Administrator',
      password: commonPassword,
      role: Role.HQ_ADMIN,
      status: UserStatus.ENABLED,
      mustChangePassword: false,
    },
    {
      email: 'tuyisengeelysee1@gmail.com',
      fullName: 'TUYISENGE Elysée',
      password: commonPassword,
      role: Role.BRANCH_USER,
      status: UserStatus.ENABLED,
      mustChangePassword: false,
      branchId: branch.id,
    }
  ];

  for (const u of users) {
    await prisma.user.upsert({ where: { email: u.email }, update: {}, create: u });
  }

  // 3. Seed Device
  const device = await prisma.device.upsert({
    where: { id: 'GRIDGuard-PI-001' },
    update: {},
    create: {
      id: 'GRIDGuard-PI-001',
      name: 'Gasabo Station Unit',
      branchId: branch.id,
      status: 'ACTIVE',
      incidentStatus: 'safe',
      lat: -1.9500,
      lng: 30.0588,
      address: 'Gasabo, Kacyiru, Kigali',
      province: 'Kigali City',
      district: 'Gasabo',
      sector: 'Kacyiru',
      cell: 'Kamukina',
    },
  });

  // 5. Seed Incidents (IKOSOYE: Fixed aiClass Enum and alertStatus boolean/string)
  const incidents = [
    {
      deviceId: 'GRIDGuard-PI-001',
      aiClass: IncidentClass.VANDAL, // Koresha Enum aho kuba string 'cutting'
      aiConfidence: 96.27,
      videoPath: 'uploads/incidents/videos/evidence-1.mp4',
      alertStatus: true, // Niba ari boolean muri schema, koresha true aho kuba 'TRUE'
      time: new Date(),
      status: IncidentStatus.ACTIVE,
      aiSummary: 'Detection Analysis: AI detected cutting at 12:45 PM.',
      alertType: 'THIEF',
      gpsLatitude: -1.9500,
      gpsLongitude: 30.0588,
      pirSensor: 'ACTIVE',
      servoPosition: 90
    },
    {
      deviceId: 'GRIDGuard-PI-001',
      aiClass: IncidentClass.SUSPICIOUS, // Koresha Enum
      aiConfidence: 94.44,
      videoPath: 'uploads/incidents/videos/evidence-2.mp4',
      alertStatus: true,
      time: new Date(),
      status: IncidentStatus.ACTIVE,
      aiSummary: 'Detection Analysis: AI unit detected suspicious motion.',
      alertType: 'THIEF',
      gpsLatitude: -1.9501,
      gpsLongitude: 30.0589,
      pirSensor: 'ACTIVE',
      servoPosition: 45
    }
  ];

  for (const inc of incidents) {
    await prisma.incident.create({ data: inc });
  }

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
