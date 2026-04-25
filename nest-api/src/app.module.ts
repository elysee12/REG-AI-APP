import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { BranchesModule } from './branches/branches.module';
import { DevicesModule } from './devices/devices.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { LocationsModule } from './locations/locations.module';

@Module({
  imports: [PrismaModule, UsersModule, BranchesModule, DevicesModule, AuthModule, MailModule, LocationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
