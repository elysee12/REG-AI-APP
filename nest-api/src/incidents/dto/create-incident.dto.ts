import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateIncidentDto {
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  severity: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsOptional()
  motionStatus?: string;

  @IsString()
  @IsOptional()
  vibrationStatus?: string;

  @IsNumber()
  @IsOptional()
  accelX?: number;

  @IsNumber()
  @IsOptional()
  accelY?: number;

  @IsNumber()
  @IsOptional()
  accelZ?: number;

  @IsString()
  @IsOptional()
  accelStatus?: string;

  @IsString()
  @IsOptional()
  aiClass?: string;

  @IsNumber()
  @IsOptional()
  aiConfidence?: number;

  @IsString()
  @IsOptional()
  alertStatus?: string;

  @IsString()
  @IsOptional()
  imagePath?: string;

  @IsString()
  @IsOptional()
  videoPath?: string;

  @IsString()
  @IsOptional()
  sourceNote?: string;
}
