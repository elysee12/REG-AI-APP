import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  create(createBranchDto: CreateBranchDto) {
    return this.prisma.branch.create({
      data: createBranchDto,
    });
  }

  findAll() {
    return this.prisma.branch.findMany({
      include: {
        _count: {
          select: { users: true, devices: true },
        },
      },
    });
  }

  findOne(id: number) {
    return this.prisma.branch.findUnique({
      where: { id },
      include: {
        users: true,
        devices: true,
      },
    });
  }

  update(id: number, updateBranchDto: UpdateBranchDto) {
    return this.prisma.branch.update({
      where: { id },
      data: updateBranchDto,
    });
  }

  async remove(id: number) {
    // We need to handle all related entities due to foreign key constraints
    return this.prisma.$transaction(async (tx) => {
      // 1. Handle Devices and their Incidents
      const branchDevices = await tx.device.findMany({
        where: { branchId: id },
        select: { id: true },
      });
      
      const deviceIds = branchDevices.map(d => d.id);
      
      if (deviceIds.length > 0) {
        // Delete incidents for all devices in this branch
        await tx.incident.deleteMany({
          where: { deviceId: { in: deviceIds } },
        });
        
        // Delete the devices themselves
        await tx.device.deleteMany({
          where: { branchId: id },
        });
      }

      // 2. Delete Security Contacts
      await tx.securityContact.deleteMany({
        where: { branchId: id },
      });

      // 3. Delete Users associated with this branch
      // (Alternatively, set branchId to null if you want to keep them, but usually they are branch-specific)
      await tx.user.deleteMany({
        where: { branchId: id },
      });

      // 4. Finally, delete the branch
      return tx.branch.delete({
        where: { id },
      });
    });
  }
}
