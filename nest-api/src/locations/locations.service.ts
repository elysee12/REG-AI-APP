import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async getProvinces() {
    const locations = await this.prisma.location.findMany({
      distinct: ['province_name'],
      select: {
        province_name: true,
      },
    });
    return locations.map(l => l.province_name);
  }

  async getDistricts(provinceName: string) {
    const locations = await this.prisma.location.findMany({
      where: {
        province_name: provinceName,
      },
      distinct: ['district_name'],
      select: {
        district_name: true,
      },
    });
    return locations.map(l => l.district_name);
  }

  async getSectors(provinceName: string, districtName: string) {
    const locations = await this.prisma.location.findMany({
      where: {
        province_name: provinceName,
        district_name: districtName,
      },
      distinct: ['sector_name'],
      select: {
        sector_name: true,
      },
    });
    return locations.map(l => l.sector_name);
  }

  async getCells(provinceName: string, districtName: string, sectorName: string) {
    const locations = await this.prisma.location.findMany({
      where: {
        province_name: provinceName,
        district_name: districtName,
        sector_name: sectorName,
      },
      distinct: ['cell_name'],
      select: {
        cell_name: true,
      },
    });
    return locations.map(l => l.cell_name);
  }

  async getVillages(provinceName: string, districtName: string, sectorName: string, cellName: string) {
    const locations = await this.prisma.location.findMany({
      where: {
        province_name: provinceName,
        district_name: districtName,
        sector_name: sectorName,
        cell_name: cellName,
      },
      distinct: ['village_name'],
      select: {
        village_name: true,
      },
    });
    return locations.map(l => l.village_name);
  }
}
