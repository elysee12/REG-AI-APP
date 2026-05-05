import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) {}

  create(createDeviceDto: CreateDeviceDto) {
    return this.prisma.device.create({
      data: createDeviceDto,
      include: { branch: true, securityContacts: true },
    });
  }

  findAll() {
    return this.prisma.device.findMany({
      include: { branch: true, securityContacts: true },
    });
  }

  findOne(id: string) {
    return this.prisma.device.findUnique({
      where: { id },
      include: { branch: true, securityContacts: true },
    });
  }

  update(id: string, updateDeviceDto: UpdateDeviceDto) {
    return this.prisma.device.update({
      where: { id },
      data: updateDeviceDto,
      include: { branch: true, securityContacts: true },
    });
  }

  async updateStatus(id: string, data: any) {
    return this.prisma.device.update({
      where: { id },
      data: {
        status: 'online',
        cameraConnected: data.cameraConnected ?? true,
        esp32Connected: data.esp32Connected ?? true,
        gpsSatellites: data.gpsSatellites ?? 0,
        lat: data.gpsLatitude ?? undefined,
        lng: data.gpsLongitude ?? undefined,
        updatedAt: new Date(),
      },
    });
  }

  async remove(id: string) {
    // We need to handle related incidents first due to foreign key constraints
    return this.prisma.$transaction(async (tx) => {
      // 1. Delete all incidents associated with this device
      await tx.incident.deleteMany({
        where: { deviceId: id },
      });

      // 2. Delete the device itself
      // Many-to-many relations (SecurityContacts) are handled automatically by Prisma
      return tx.device.delete({
        where: { id },
      });
    });
  }

  findByBranch(branchId: number) {
    return this.prisma.device.findMany({
      where: { branchId },
      include: { branch: true, securityContacts: true },
    });
  }
}
