import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';

@Injectable()
export class TechniciansService {
  constructor(private prisma: PrismaService) {}

  async create(createTechnicianDto: CreateTechnicianDto) {
    return this.prisma.technician.create({
      data: {
        ...createTechnicianDto,
        branchId: Number(createTechnicianDto.branchId),
      },
    });
  }

  async findAll() {
    return this.prisma.technician.findMany({
      include: {
        branch: true,
      },
    });
  }

  async findOne(id: string) {
    const technician = await this.prisma.technician.findUnique({
      where: { id },
      include: {
        branch: true,
      },
    });
    if (!technician) {
      throw new NotFoundException(`Technician with ID ${id} not found`);
    }
    return technician;
  }

  async update(id: string, updateTechnicianDto: UpdateTechnicianDto) {
    return this.prisma.technician.update({
      where: { id },
      data: {
        ...updateTechnicianDto,
        branchId: updateTechnicianDto.branchId ? Number(updateTechnicianDto.branchId) : undefined,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.technician.delete({
      where: { id },
    });
  }
}
