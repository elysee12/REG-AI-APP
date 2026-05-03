import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsEnum } from 'class-validator';

export enum IncidentClass {
  VANDAL = 'VANDAL',
  CLIMBING = 'CLIMBING',
  CUTTING_WIRES = 'CUTTING_WIRES',
  OPENING_BOX = 'OPENING_BOX',
  SUSPICIOUS = 'SUSPICIOUS',
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
