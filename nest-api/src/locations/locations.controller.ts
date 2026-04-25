import { Controller, Get, Query } from '@nestjs/common';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('provinces')
  getProvinces() {
    return this.locationsService.getProvinces();
  }

  @Get('districts')
  getDistricts(@Query('province') province: string) {
    return this.locationsService.getDistricts(province);
  }

  @Get('sectors')
  getSectors(
    @Query('province') province: string,
    @Query('district') district: string,
  ) {
    return this.locationsService.getSectors(province, district);
  }

  @Get('cells')
  getCells(
    @Query('province') province: string,
    @Query('district') district: string,
    @Query('sector') sector: string,
  ) {
    return this.locationsService.getCells(province, district, sector);
  }
}
