import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export interface OtpEntry {
  userId: number;
  otp: string;
  expiresAt: Date;
  type: 'PASSWORD_RESET' | 'PASSWORD_CHANGE';
}

@Injectable()
export class OtpService {
  private otpStore: Map<string, OtpEntry> = new Map();
  private readonly OTP_EXPIRY_MINUTES = 10;

  constructor(private prisma: PrismaService) {}

  private generateOtp(): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < 6; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
  }

  async generatePasswordResetOtp(email: string): Promise<{ success: boolean; message: string; otp?: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return { success: false, message: 'User not found with this email address' };
    }

    const otp = this.generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    const existingKey = `reset:${user.id}`;
    this.otpStore.set(existingKey, {
      userId: user.id,
      otp: hashedOtp,
      expiresAt,
      type: 'PASSWORD_RESET',
    });

    return { success: true, message: 'OTP generated successfully', otp };
  }

  async verifyPasswordResetOtp(email: string, otp: string): Promise<{ success: boolean; message: string; userId?: number }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const entry = this.otpStore.get(`reset:${user.id}`);

    if (!entry) {
      return { success: false, message: 'No OTP found. Please request a new one.' };
    }

    if (new Date() > entry.expiresAt) {
      this.otpStore.delete(`reset:${user.id}`);
      return { success: false, message: 'OTP has expired. Please request a new one.' };
    }

    const isValid = await bcrypt.compare(otp, entry.otp);

    if (!isValid) {
      return { success: false, message: 'Invalid OTP. Please try again.' };
    }

    this.otpStore.delete(`reset:${user.id}`);
    return { success: true, message: 'OTP verified successfully', userId: user.id };
  }

  async generatePasswordChangeOtp(userId: number): Promise<{ success: boolean; message: string; otp?: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const otp = this.generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    const existingKey = `change:${userId}`;
    this.otpStore.set(existingKey, {
      userId: user.id,
      otp: hashedOtp,
      expiresAt,
      type: 'PASSWORD_CHANGE',
    });

    return { success: true, message: 'OTP generated successfully', otp };
  }

  async verifyPasswordChangeOtp(userId: number, otp: string): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const entry = this.otpStore.get(`change:${userId}`);

    if (!entry) {
      return { success: false, message: 'No OTP found. Please request a new one.' };
    }

    if (new Date() > entry.expiresAt) {
      this.otpStore.delete(`change:${userId}`);
      return { success: false, message: 'OTP has expired. Please request a new one.' };
    }

    const isValid = await bcrypt.compare(otp, entry.otp);

    if (!isValid) {
      return { success: false, message: 'Invalid OTP. Please try again.' };
    }

    this.otpStore.delete(`change:${userId}`);
    return { success: true, message: 'OTP verified successfully' };
  }

  clearOtps(userId: number): void {
    this.otpStore.delete(`reset:${userId}`);
    this.otpStore.delete(`change:${userId}`);
  }
}
