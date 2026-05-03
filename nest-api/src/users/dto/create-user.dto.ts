import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsInt, IsBoolean, MinLength } from 'class-validator';
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
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
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
