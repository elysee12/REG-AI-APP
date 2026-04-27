import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class SecureUpdateUserDto extends UpdateUserDto {
  @IsString()
  @IsOptional()
  adminCurrentPassword?: string;

  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsString()
  @IsOptional()
  @MinLength(8)
  newUserPassword?: string;
}
