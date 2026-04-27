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

  remove(id: string) {
    return this.prisma.device.delete({
      where: { id },
    });
  }

  findByBranch(branchId: number) {
    return this.prisma.device.findMany({
      where: { branchId },
      include: { branch: true, securityContacts: true },
    });
  }
}
