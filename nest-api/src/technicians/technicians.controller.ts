import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { TechniciansService } from './technicians.service';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('technicians')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TechniciansController {
  constructor(private readonly techniciansService: TechniciansService) {}

  @Post()
  @Roles('HQ_ADMIN')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/images',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  }))
  create(@Body() createTechnicianDto: CreateTechnicianDto, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      createTechnicianDto.profileImage = `/uploads/images/${file.filename}`;
    }
    return this.techniciansService.create(createTechnicianDto);
  }

  @Get()
  findAll() {
    return this.techniciansService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.techniciansService.findOne(id);
  }

  @Patch(':id')
  @Roles('HQ_ADMIN')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/images',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  }))
  update(
    @Param('id') id: string, 
    @Body() updateTechnicianDto: UpdateTechnicianDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (file) {
      updateTechnicianDto.profileImage = `/uploads/images/${file.filename}`;
    }
    return this.techniciansService.update(id, updateTechnicianDto);
  }

  @Delete(':id')
  @Roles('HQ_ADMIN')
  remove(@Param('id') id: string) {
    return this.techniciansService.remove(id);
  }
}
