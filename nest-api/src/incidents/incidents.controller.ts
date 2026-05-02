import { 
  Controller, Get, Post, Body, Patch, Param, 
  UseGuards, Query, UseInterceptors, UploadedFiles, UploadedFile, BadRequestException, Request 
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as path from 'path';
import * as fs from 'fs';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto, IncidentStatus } from './dto/create-incident.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  /**
   * STEP 1: INITIAL ALERT CREATION
   * Handles the instant alarm from FastAPI.
   */
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'file', maxCount: 1 },
        { name: 'image', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            const root = process.cwd();
            const dest = (file.fieldname === 'video' || file.fieldname === 'file')
              ? path.join(root, 'uploads/incidents/videos') 
              : path.join(root, 'uploads/incidents/images');
            
            if (!fs.existsSync(dest)) {
              fs.mkdirSync(dest, { recursive: true });
            }
            cb(null, dest);
          },
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const name = `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`;
            console.log(`[Step 1] Saving file: ${name}`);
            cb(null, name);
          },
        }),
      },
    ),
  )
  async create(
    @Body() body: any,
    @UploadedFiles() files?: { image?: Express.Multer.File[], video?: Express.Multer.File[], file?: Express.Multer.File[] }
  ) {
    // Determine video path from any possible upload field
    let videoPath = body.videoPath || body.videoUrl;
    const videoFile = files?.video?.[0] || files?.file?.[0];
    
    if (videoFile) {
      videoPath = `/uploads/incidents/videos/${videoFile.filename}`;
    }

    // Prepare DTO and handle multipart string-to-number/boolean conversions
    const createIncidentDto: CreateIncidentDto = {
      deviceId: body.deviceId?.toString().trim(),
      aiClass: body.aiClass?.toString().trim(),
      aiConfidence: body.aiConfidence !== undefined ? parseFloat(body.aiConfidence) : parseFloat(body.confidence),
      videoPath: videoPath,
      alertStatus: body.alertStatus === 'true' || body.alertStatus === '1' || body.alertStatus === true,
      status: body.status || IncidentStatus.ACTIVE,
    };

    return this.incidentsService.create(createIncidentDto);
  }

  /**
   * STEP 2: LATE VIDEO UPLOAD (EVIDENCE ATTACHMENT)
   * Path updated to ':id/upload-video' to match your FastAPI logs.
   * FileInterceptor updated to 'file' to match 'VIDEO_UPLOAD_FIELD' in your Python code.
   */
  @Post(':id/upload-video')
  @UseInterceptors(
    FileInterceptor('file', { // Matches VIDEO_UPLOAD_FIELD="file" in FastAPI
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dest = path.join(process.cwd(), 'uploads/incidents/videos');
          if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
          }
          cb(null, dest);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const name = `evidence-${uniqueSuffix}${extname(file.originalname)}`;
          console.log(`[Step 2] Attaching video: ${name} to Incident: ${req.params.id}`);
          cb(null, name);
        },
      }),
      limits: { fileSize: 1024 * 1024 * 500 } // 500MB Limit
    }),
  )
  async uploadVideo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException('No video file received (Ensure field name is "file")');
    }
    
    const videoPath = `/uploads/incidents/videos/${file.filename}`;
    return this.incidentsService.updateVideoPath(id, videoPath);
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

  @Get('assigned')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAssigned(@Request() req) {
    const email = req.user?.email;
    if (!email) {
      return [];
    }
    return this.incidentsService.findAssignedToUser(email);
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
