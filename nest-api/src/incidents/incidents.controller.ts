import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('incidents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  create(@Body() createIncidentDto: CreateIncidentDto) {
    return this.incidentsService.create(createIncidentDto);
  }

  @Get()
  findAll(@Query('branchId') branchId?: string) {
    if (branchId) {
      const id = parseInt(branchId);
      if (!isNaN(id)) {
        return this.incidentsService.findByBranch(id);
      }
    }
    return this.incidentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.incidentsService.updateStatus(id, status);
  }

  @Post(':id/broadcast')
  broadcastAlert(@Param('id') id: string, @Body('message') message: string) {
    return this.incidentsService.broadcastAlert(id, message);
  }

  @Post(':id/broadcast-whatsapp')
  broadcastWhatsappAlert(@Param('id') id: string, @Body('message') message: string) {
    return this.incidentsService.broadcastWhatsappAlert(id, message);
  }
}
