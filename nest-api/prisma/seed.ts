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

  // Seed locations
  const locationsData = [
    { province_name: 'Kigali City', district_name: 'Gasabo', sector_name: 'Kacyiru', cell_name: 'Kamukina' },
    { province_name: 'Kigali City', district_name: 'Gasabo', sector_name: 'Remera', cell_name: 'Giporoso' },
    { province_name: 'Kigali City', district_name: 'Nyarugenge', sector_name: 'Nyamirambo', cell_name: 'Mumena' },
    { province_name: 'Kigali City', district_name: 'Kicukiro', sector_name: 'Kicukiro', cell_name: 'Kicukiro' },
    { province_name: 'Southern Province', district_name: 'Huye', sector_name: 'Ngoma', cell_name: 'Tumba' },
    { province_name: 'Southern Province', district_name: 'Muhanga', sector_name: 'Nyamabuye', cell_name: 'Gitarama' },
    { province_name: 'Northern Province', district_name: 'Musanze', sector_name: 'Muhoza', cell_name: 'Ruhengeri' },
    { province_name: 'Northern Province', district_name: 'Gicumbi', sector_name: 'Byumba', cell_name: 'Byumba' },
    { province_name: 'Eastern Province', district_name: 'Rwamagana', sector_name: 'Muhazi', cell_name: 'Gishari' },
    { province_name: 'Eastern Province', district_name: 'Nyagatare', sector_name: 'Nyagatare', cell_name: 'Nyagatare' },
    { province_name: 'Western Province', district_name: 'Rubavu', sector_name: 'Gisenyi', cell_name: 'Rubavu' },
    { province_name: 'Western Province', district_name: 'Rusizi', sector_name: 'Kamembe', cell_name: 'Kamembe' },
  ];

  for (const data of locationsData) {
    await prisma.location.upsert({
      where: {
        province_name_district_name_sector_name_cell_name: {
          province_name: data.province_name,
          district_name: data.district_name,
          sector_name: data.sector_name,
          cell_name: data.cell_name,
        },
      },
      update: {},
      create: {
        province_name: data.province_name,
        district_name: data.district_name,
        sector_name: data.sector_name,
        cell_name: data.cell_name,
      },
    });
  }
  console.log('Locations seeded successfully.');

  // Seed Branches
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

  // Seed Devices
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

  // Seed Incidents
  const incidents = [
    {
      deviceId: 'DEV-001',
      type: 'Vandalism',
      severity: 'high',
      status: 'active',
      time: new Date(),
    },
    {
      deviceId: 'DEV-001',
      type: 'Unauthorized Access',
      severity: 'medium',
      status: 'resolved',
      time: new Date(Date.now() - 86400000), // 1 day ago
    },
    {
      deviceId: 'DEV-001',
      type: 'Tampering',
      severity: 'low',
      status: 'active',
      time: new Date(Date.now() - 3600000), // 1 hour ago
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
