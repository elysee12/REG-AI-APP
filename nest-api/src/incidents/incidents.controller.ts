import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query, UseInterceptors, UploadedFiles, UploadedFile } from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto, IncidentStatus } from './dto/create-incident.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'video', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            const dest = file.fieldname === 'video' 
              ? './uploads/incidents/videos' 
              : './uploads/incidents/images';
            cb(null, dest);
          },
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
          },
        }),
      },
    ),
  )
  async create(
    @Body() body: any,
    @UploadedFiles() files?: { image?: Express.Multer.File[], video?: Express.Multer.File[] }
  ) {
    // Create a clean DTO with only the fields expected by the service/database
    const createIncidentDto: CreateIncidentDto = {
      deviceId: body.deviceId,
      aiClass: body.aiClass,
      aiConfidence: body.aiConfidence !== undefined ? body.aiConfidence : body.confidence,
      videoPath: body.videoPath !== undefined ? body.videoPath : body.videoUrl,
      alertStatus: body.alertStatus,
      status: body.status,
    };

    // If files are uploaded, add their paths to the DTO
    if (files?.video?.[0]) {
      createIncidentDto.videoPath = `/uploads/incidents/videos/${files.video[0].filename}`;
    }

    // Transform string numbers/booleans if they come from multipart/form-data
    if (typeof createIncidentDto.aiConfidence === 'string') {
      createIncidentDto.aiConfidence = parseFloat(createIncidentDto.aiConfidence);
    }
    
    if (typeof createIncidentDto.alertStatus === 'string') {
      createIncidentDto.alertStatus = createIncidentDto.alertStatus === '1' || createIncidentDto.alertStatus === 'true';
    }

    return this.incidentsService.create(createIncidentDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll(@Query('branchId') branchId?: string, @Query('deviceId') deviceId?: string) {
    if (deviceId) {
      return this.incidentsService.findByDevice(deviceId);
    }
    if (branchId) {
      const id = parseInt(branchId);
      if (!isNaN(id)) {
        return this.incidentsService.findByBranch(id);
      }
    }
    return this.incidentsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateStatus(@Param('id') id: string, @Body('status') status: IncidentStatus) {
    return this.incidentsService.updateStatus(id, status);
  }

  @Post(':id/video')
  @UseInterceptors(
    FileInterceptor('video', {
      storage: diskStorage({
        destination: './uploads/incidents/videos',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `video-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadVideo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new Error('Video file is required');
    }
    const videoPath = `/uploads/incidents/videos/${file.filename}`;
    return this.incidentsService.updateVideoPath(id, videoPath);
  }

  @Post(':id/broadcast')
  @UseGuards(JwtAuthGuard, RolesGuard)
  broadcastAlert(@Param('id') id: string, @Body('message') message: string) {
    return this.incidentsService.broadcastAlert(id, message);
  }

  @Post(':id/broadcast-whatsapp')
  @UseGuards(JwtAuthGuard, RolesGuard)
  broadcastWhatsappAlert(@Param('id') id: string, @Body('message') message: string) {
    return this.incidentsService.broadcastWhatsappAlert(id, message);
  }
}
