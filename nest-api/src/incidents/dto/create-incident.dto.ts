import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsEnum } from 'class-validator';

export enum IncidentClass {
  SUSPICIOUS = 'SUSPICIOUS',
  THIEF = 'THIEF',
}

export enum IncidentStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SOLVED = 'SOLVED',
  FALSE_ALARM = 'FALSE_ALARM',
}

export class CreateIncidentDto {
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsEnum(IncidentClass)
  @IsOptional()
  aiClass?: IncidentClass;

  @IsNumber()
  @IsOptional()
  aiConfidence?: number;

  @IsString()
  @IsOptional()
  videoPath?: string;

  @IsBoolean()
  @IsOptional()
  alertStatus?: boolean;

  @IsEnum(IncidentStatus)
  @IsOptional()
  status?: IncidentStatus;
}
