import { PrismaClient, Role, UserStatus, IncidentClass } from '@prisma/client';
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

  // 2. Seed Users (HQ na Branch)
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

  // 3. Seed Device (GRIDGuard-PI-001) - Kuzuza byose
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

  // 4. Seed Technicians (Hamwe na Face Token yuzuye)
  const technician = await prisma.technician.upsert({
    where: { staffId: 'REG-TECH-001' },
    update: {},
    create: {
      staffId: 'REG-TECH-001',
      fullName: 'Habimana Jean',
      email: 'jean.h@reg.gov.rw',
      phone: '0788000000',
      faceToken: Array.from({ length: 128 }, () => Math.random()), // Vector data
    },
  });

  // 5. Seed Incidents (Kukurikiza ifoto neza nta NULL isigaye)
  const incidents = [
    {
      deviceId: 'GRIDGuard-PI-001',
      aiClass: 'cutting',
      aiConfidence: 96.27,
      videoPath: 'uploads/incidents/videos/evidence-17779796635.mp4',
      alertStatus: 'TRUE', 
      time: new Date(),
      status: 'ACTIVE',
      aiSummary: 'Detection Analysis: AI detected cutting at 12:45 PM. GPS Locked.',
      alertType: 'THIEF',
      gps_latitude: -1.9500,
      gps_longitude: 30.0588,
      pirSensor: 'ACTIVE',
      servoPosition: 90
    },
    {
      deviceId: 'GRIDGuard-PI-001',
      aiClass: 'suspicious',
      aiConfidence: 94.44,
      videoPath: 'uploads/incidents/videos/evidence-17779795536.mp4',
      alertStatus: 'TRUE',
      time: new Date(),
      status: 'ACTIVE',
      aiSummary: 'Detection Analysis: At 1:20 PM, AI unit detected suspicious motion.',
      alertType: 'THIEF',
      gps_latitude: -1.9501,
      gps_longitude: 30.0589,
      pirSensor: 'ACTIVE',
      servoPosition: 45
    }
  ];

  for (const inc of incidents) {
    await prisma.incident.create({ data: inc });
  }

  console.log('✅ Seed completed: All tables are filled with data (No Empty Fields).');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
