import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { MailService } from '../mail/mail.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  RequestPasswordResetDto,
  VerifyOtpDto,
  ResetPasswordDto,
  ChangePasswordDto,
  RequestPasswordChangeDto,
  VerifyChangeOtpDto,
  AdminChangeUserPasswordDto,
} from './dto/password-reset.dto';
import * as bcrypt from 'bcrypt';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private otpService: OtpService,
    private mailService: MailService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Request() req, @Body() dto: RequestPasswordResetDto) {
    // Only HQ_ADMIN can request password reset for others
    if (req.user.role !== 'HQ_ADMIN') {
      return { success: false, message: 'Unauthorized' };
    }

    const result = await this.otpService.generatePasswordResetOtp(dto.email);
    
    if (result.success && result.otp) {
      const user = await this.authService.validateUserByEmail(dto.email);
      if (user) {
        await this.mailService.sendPasswordResetEmail(dto.email, user.fullName, result.otp);
      }
    }

    return {
      success: true,
      message: 'If an account with that email exists, a password reset OTP has been sent.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-reset-otp')
  @HttpCode(HttpStatus.OK)
  async verifyResetOtp(@Request() req, @Body() dto: VerifyOtpDto) {
    if (req.user.role !== 'HQ_ADMIN') {
      return { success: false, message: 'Unauthorized' };
    }
    const result = await this.otpService.verifyPasswordResetOtp(dto.email, dto.otp);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Request() req, @Body() dto: ResetPasswordDto) {
    if (req.user.role !== 'HQ_ADMIN') {
      return { success: false, message: 'Unauthorized' };
    }
    const verifyResult = await this.otpService.verifyPasswordResetOtp(dto.email, dto.otp);
    
    if (!verifyResult.success || !verifyResult.userId) {
      return { success: false, message: verifyResult.message };
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.authService.updateUserPassword(verifyResult.userId, hashedPassword);
    
    const user = await this.authService.validateUserByEmail(dto.email);
    if (user) {
      await this.mailService.sendPasswordChangeConfirmation(dto.email, user.fullName);
    }

    return { success: true, message: 'Password has been reset successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('request-password-change')
  @HttpCode(HttpStatus.OK)
  async requestPasswordChange(@Request() req, @Body() dto: RequestPasswordChangeDto) {
    const userId = req.user.userId;
    const result = await this.otpService.generatePasswordChangeOtp(userId);
    
    if (result.success && result.otp) {
      const user = await this.authService.getUserById(userId);
      if (user) {
        await this.mailService.sendPasswordResetEmail(user.email, user.fullName, result.otp);
      }
    }

    return {
      success: true,
      message: 'If your current password is correct, an OTP has been sent to your email.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-change-otp')
  @HttpCode(HttpStatus.OK)
  async verifyChangeOtp(@Request() req, @Body() dto: VerifyChangeOtpDto) {
    const userId = req.user.userId;
    const user = await this.authService.getUserById(userId);
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return { success: false, message: 'Current password is incorrect' };
    }

    const verifyResult = await this.otpService.verifyPasswordChangeOtp(userId, dto.otp);
    return verifyResult;
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password-with-otp')
  @HttpCode(HttpStatus.OK)
  async changePasswordWithOtp(@Request() req, @Body() dto: ChangePasswordDto) {
    const userId = req.user.userId;
    const user = await this.authService.getUserById(userId);
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return { success: false, message: 'Current password is incorrect' };
    }

    const verifyResult = await this.otpService.verifyPasswordChangeOtp(userId, dto.otp);
    if (!verifyResult.success) {
      return verifyResult;
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.authService.updateUserPassword(userId, hashedPassword);
    
    await this.mailService.sendPasswordChangeConfirmation(user.email, user.fullName);

    return { success: true, message: 'Password has been changed successfully' };
  }
}
