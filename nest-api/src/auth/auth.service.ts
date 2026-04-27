import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async validateUserByEmail(email: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user) {
      const { password, ...result } = user;
      return { ...result, password: user.password };
    }
    return null;
  }

  async getUserById(id: number): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (user) {
      const { password, ...result } = user;
      return { ...result, password: user.password };
    }
    return null;
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        branchName: user.branch?.name || (user.role === 'HQ_ADMIN' ? 'Headquarter' : null),
        region: user.branch?.region || (user.role === 'HQ_ADMIN' ? 'All' : null),
        branchId: user.branchId,
        status: user.status.toLowerCase(),
        mustChangePassword: user.mustChangePassword,
      },
    };
  }
}
