import { IsString, IsNotEmpty, IsInt, IsOptional, IsNumber } from 'class-validator';

export class CreateDeviceDto {
  @IsString()
  @IsNotEmpty()
  id: string; // Serial Number

  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @IsNotEmpty()
  branchId: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  incidentStatus?: string;

  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @IsNumber()
  @IsNotEmpty()
  lng: number;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  sector?: string;

  @IsString()
  @IsOptional()
  cell?: string;

  @IsString()
  @IsOptional()
  lastData?: string;
}
