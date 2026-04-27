import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

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
}
