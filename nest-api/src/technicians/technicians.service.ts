import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
import * as fs from 'fs';
import * as path from 'path';
import { Prisma } from '@prisma/client';

@Injectable()
export class TechniciansService {
  private readonly fastapiUrl = 'http://localhost:8001'; // Assuming FastAPI runs here

  constructor(private prisma: PrismaService) {}

  async create(createTechnicianDto: CreateTechnicianDto) {
    let faceToken = createTechnicianDto.faceToken;
    let profileImagePath = createTechnicianDto.profileImage;

    // Check if staffId or email already exists
    const existing = await this.prisma.technician.findFirst({
      where: {
        OR: [
          { staffId: createTechnicianDto.staffId },
          { email: createTechnicianDto.email }
        ]
      }
    });

    if (existing) {
      const field = existing.staffId === createTechnicianDto.staffId ? 'Staff ID' : 'Email';
      throw new ConflictException(`Technician with this ${field} already exists`);
    }

    // If a captured image (base64) is provided, process it via FastAPI to get faceToken
    if (createTechnicianDto.capturedImage) {
      console.log('Processing captured image for face token...');
      try {
        // 1. Save the captured image to disk first
        const base64Data = createTechnicianDto.capturedImage.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `tech-${Date.now()}.jpg`;
        const uploadDir = path.join(process.cwd(), 'uploads/images');
        
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);
        profileImagePath = `/uploads/images/${fileName}`;
        console.log('Saved captured image to:', profileImagePath);

        // 2. Call FastAPI to get faceToken using the base64 image
        const response = await fetch(`${this.fastapiUrl}/generate-face-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: createTechnicianDto.capturedImage }),
        });

        if (response.ok) {
          const result = await response.json() as any;
          faceToken = result.faceToken;
          console.log('Successfully generated face token from FastAPI');
        } else {
          const errorText = await response.text();
          console.error('FastAPI error generating face token:', response.status, errorText);
        }
      } catch (error) {
        console.error('Error calling FastAPI for face token:', error.message);
      }
    } else if (profileImagePath && !profileImagePath.startsWith('http')) {
      // If a file was uploaded instead of captured, we still need to generate a face token
      console.log('Processing uploaded image for face token:', profileImagePath);
      try {
        const fullPath = path.join(process.cwd(), profileImagePath);
        if (fs.existsSync(fullPath)) {
          const fileBuffer = fs.readFileSync(fullPath);
          const base64Image = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;
          
          const response = await fetch(`${this.fastapiUrl}/generate-face-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image }),
          });

          if (response.ok) {
            const result = await response.json() as any;
            faceToken = result.faceToken;
            console.log('Successfully generated face token from uploaded file');
          } else {
            const errorText = await response.text();
            console.error('FastAPI error generating face token from file:', response.status, errorText);
          }
        }
      } catch (error) {
        console.error('Error processing uploaded file for face token:', error.message);
      }
    }

    try {
      return await this.prisma.technician.create({
        data: {
          staffId: createTechnicianDto.staffId,
          fullName: createTechnicianDto.fullName,
          email: createTechnicianDto.email,
          phone: createTechnicianDto.phone,
          role: createTechnicianDto.role,
          branchId: Number(createTechnicianDto.branchId),
          profileImage: profileImagePath,
          faceToken: faceToken,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = (error.meta?.target as string[]) || [];
          const field = target.includes('staffId') ? 'Staff ID' : 'Email';
          throw new ConflictException(`Technician with this ${field} already exists`);
        }
      }
      throw error;
    }
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
    const technician = await this.findOne(id);
    let faceToken = updateTechnicianDto.faceToken;
    let profileImagePath = updateTechnicianDto.profileImage;

    // If a captured image (base64) is provided, process it
    if (updateTechnicianDto.capturedImage) {
      console.log('Processing captured image for technician update...');
      try {
        // 1. Save the captured image to disk
        const base64Data = updateTechnicianDto.capturedImage.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `tech-${Date.now()}.jpg`;
        const uploadDir = path.join(process.cwd(), 'uploads/images');
        
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);
        profileImagePath = `/uploads/images/${fileName}`;

        // 2. Call FastAPI to get faceToken
        const response = await fetch(`${this.fastapiUrl}/generate-face-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: updateTechnicianDto.capturedImage }),
        });

        if (response.ok) {
          const result = await response.json() as any;
          faceToken = result.faceToken;
          console.log('Successfully generated face token for update');
        }
      } catch (error) {
        console.error('Error updating technician face token:', error.message);
      }
    } else if (profileImagePath && profileImagePath !== technician.profileImage && !profileImagePath.startsWith('http')) {
      // If a new file was uploaded, regenerate face token
      console.log('Processing newly uploaded image for technician update:', profileImagePath);
      try {
        const fullPath = path.join(process.cwd(), profileImagePath);
        if (fs.existsSync(fullPath)) {
          const fileBuffer = fs.readFileSync(fullPath);
          const base64Image = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;
          
          const response = await fetch(`${this.fastapiUrl}/generate-face-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image }),
          });

          if (response.ok) {
            const result = await response.json() as any;
            faceToken = result.faceToken;
            console.log('Successfully generated face token from new uploaded file');
          }
        }
      } catch (error) {
        console.error('Error processing updated file for face token:', error.message);
      }
    }

    // Clean up DTO to avoid Prisma issues with extra fields
    const { capturedImage, ...prismaData } = updateTechnicianDto;

    return this.prisma.technician.update({
      where: { id },
      data: {
        ...prismaData,
        branchId: updateTechnicianDto.branchId ? Number(updateTechnicianDto.branchId) : undefined,
        profileImage: profileImagePath,
        faceToken: faceToken,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.technician.delete({
      where: { id },
    });
  }
}
