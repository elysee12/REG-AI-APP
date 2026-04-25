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

  remove(id: number) {
    return this.prisma.branch.delete({
      where: { id },
    });
  }
}
