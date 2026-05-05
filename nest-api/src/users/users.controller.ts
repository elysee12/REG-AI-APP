import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Request, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { MailService } from '../mail/mail.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, SecureUpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthService } from '../auth/auth.service';
import { OtpService } from '../auth/otp.service';
import * as bcrypt from 'bcrypt';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
  ) {}

  @Post()
  @Roles('HQ_ADMIN')
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    
    await this.mailService.sendWelcomeEmail(
      user.email,
      user.fullName,
      createUserDto.password,
    );
    
    const { password, ...result } = user;
    return result;
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post('fcm-token')
  async updateFcmToken(@Request() req, @Body('fcmToken') fcmToken: string) {
    if (!fcmToken) {
      throw new BadRequestException('FCM token is required');
    }
    return this.usersService.updateFcmToken(req.user.userId, fcmToken);
  }

  @Patch(':id')
  @Roles('HQ_ADMIN')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/secure-update')
  @Roles('HQ_ADMIN')
  async secureUpdate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SecureUpdateUserDto,
    @Request() req,
  ) {
    const adminId = req.user.userId;
    const admin = await this.authService.getUserById(adminId);
    
    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    // 1. Verify Admin Password (Optional if OTP is valid)
    if (dto.adminCurrentPassword) {
      const isCurrentPasswordValid = await bcrypt.compare(dto.adminCurrentPassword, admin.password);
      if (!isCurrentPasswordValid) {
        throw new BadRequestException('Invalid admin password');
      }
    }

    // 2. Verify OTP
    const verifyResult = await this.otpService.verifyPasswordChangeOtp(adminId, dto.otp);
    if (!verifyResult.success) {
      throw new BadRequestException(verifyResult.message);
    }

    // 3. Perform update
    const { adminCurrentPassword, otp, newUserPassword, ...rest } = dto;
    const updateData: any = { ...rest };
    
    if (newUserPassword) {
      updateData.password = newUserPassword;
    }

    const updatedUser = await this.usersService.update(id, updateData);

    if (newUserPassword) {
      await this.mailService.sendPasswordChangeConfirmation(updatedUser.email, updatedUser.fullName);
    }

    const { password, ...result } = updatedUser;
    return result;
  }

  @Delete(':id')
  @Roles('HQ_ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
