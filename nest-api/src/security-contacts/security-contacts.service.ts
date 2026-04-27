import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSecurityContactDto } from './dto/create-security-contact.dto';
import { UpdateSecurityContactDto } from './dto/update-security-contact.dto';

@Injectable()
export class SecurityContactsService {
  constructor(private prisma: PrismaService) {}

  async create(createSecurityContactDto: CreateSecurityContactDto) {
    const contact = await this.prisma.securityContact.create({
      data: createSecurityContactDto,
    });

    // Auto-link to devices in the same area
    if (contact.province && contact.district && contact.sector) {
      const matchingDevices = await this.prisma.device.findMany({
        where: {
          province: contact.province,
          district: contact.district,
          sector: contact.sector,
          branchId: contact.branchId,
        },
      });

      if (matchingDevices.length > 0) {
        await this.prisma.securityContact.update({
          where: { id: contact.id },
          data: {
            devices: {
              connect: matchingDevices.map((d) => ({ id: d.id })),
            },
          },
        });
      }
    }

    return contact;
  }

  findAll() {
    return this.prisma.securityContact.findMany({
      include: {
        branch: true,
        devices: true,
      },
    });
  }

  findByBranch(branchId: number) {
    return this.prisma.securityContact.findMany({
      where: { branchId },
      include: {
        devices: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.securityContact.findUnique({
      where: { id },
      include: {
        branch: true,
        devices: true,
      },
    });
  }

  async update(id: number, updateSecurityContactDto: UpdateSecurityContactDto) {
    const contact = await this.prisma.securityContact.update({
      where: { id },
      data: updateSecurityContactDto,
    });

    // Auto-link to devices in the same area if address was updated
    if (contact.province && contact.district && contact.sector) {
      const matchingDevices = await this.prisma.device.findMany({
        where: {
          province: contact.province,
          district: contact.district,
          sector: contact.sector,
          branchId: contact.branchId,
        },
      });

      if (matchingDevices.length > 0) {
        await this.prisma.securityContact.update({
          where: { id: contact.id },
          data: {
            devices: {
              connect: matchingDevices.map((d) => ({ id: d.id })),
            },
          },
        });
      }
    }

    return contact;
  }

  remove(id: number) {
    return this.prisma.securityContact.delete({
      where: { id },
    });
  }

  async linkToDevice(contactId: number, deviceId: string) {
    return this.prisma.securityContact.update({
      where: { id: contactId },
      data: {
        devices: {
          connect: { id: deviceId },
        },
      },
    });
  }

  async unlinkFromDevice(contactId: number, deviceId: string) {
    return this.prisma.securityContact.update({
      where: { id: contactId },
      data: {
        devices: {
          disconnect: { id: deviceId },
        },
      },
    });
  }
}
