import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { SecurityContactsService } from './security-contacts.service';
import { CreateSecurityContactDto } from './dto/create-security-contact.dto';
import { UpdateSecurityContactDto } from './dto/update-security-contact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('security-contacts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SecurityContactsController {
  constructor(private readonly securityContactsService: SecurityContactsService) {}

  @Post()
  @Roles(Role.HQ_ADMIN, Role.BRANCH_USER)
  create(@Body() createSecurityContactDto: CreateSecurityContactDto) {
    return this.securityContactsService.create(createSecurityContactDto);
  }

  @Get()
  @Roles(Role.HQ_ADMIN, Role.BRANCH_USER)
  findAll(@Query('branchId') branchId?: string) {
    if (branchId) {
      return this.securityContactsService.findByBranch(+branchId);
    }
    return this.securityContactsService.findAll();
  }

  @Get(':id')
  @Roles(Role.HQ_ADMIN, Role.BRANCH_USER)
  findOne(@Param('id') id: string) {
    return this.securityContactsService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.HQ_ADMIN, Role.BRANCH_USER)
  update(@Param('id') id: string, @Body() updateSecurityContactDto: UpdateSecurityContactDto) {
    return this.securityContactsService.update(+id, updateSecurityContactDto);
  }

  @Delete(':id')
  @Roles(Role.HQ_ADMIN, Role.BRANCH_USER)
  remove(@Param('id') id: string) {
    return this.securityContactsService.remove(+id);
  }

  @Post(':id/link/:deviceId')
  @Roles(Role.HQ_ADMIN, Role.BRANCH_USER)
  linkToDevice(@Param('id') id: string, @Param('deviceId') deviceId: string) {
    return this.securityContactsService.linkToDevice(+id, deviceId);
  }

  @Post(':id/unlink/:deviceId')
  @Roles(Role.HQ_ADMIN, Role.BRANCH_USER)
  unlinkFromDevice(@Param('id') id: string, @Param('deviceId') deviceId: string) {
    return this.securityContactsService.unlinkFromDevice(+id, deviceId);
  }
}
