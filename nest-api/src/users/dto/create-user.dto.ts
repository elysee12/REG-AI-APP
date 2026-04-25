import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsInt, IsBoolean } from 'class-validator';
import { Role, UserStatus } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @IsBoolean()
  @IsOptional()
  mustChangePassword?: boolean;

  @IsInt()
  @IsOptional()
  branchId?: number;
}
