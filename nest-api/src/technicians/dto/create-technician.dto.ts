import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTechnicianDto {
  @IsString()
  @IsNotEmpty()
  staffId: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @Type(() => Number)
  @IsInt()
  branchId: number;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsOptional()
  @IsOptional()
  profileImage?: string;

  @IsOptional()
  faceToken?: any;

  @IsOptional()
  @IsString()
  capturedImage?: string;
}
