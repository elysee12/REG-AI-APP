import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { BranchesModule } from './branches/branches.module';
import { DevicesModule } from './devices/devices.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { LocationsModule } from './locations/locations.module';
import { IncidentsModule } from './incidents/incidents.module';
import { SecurityContactsModule } from './security-contacts/security-contacts.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        setHeaders: (res, path) => {
          res.set('Access-Control-Allow-Origin', '*');
          res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          res.set('Access-Control-Allow-Headers', 'Content-Type, Range');
          res.set('Accept-Ranges', 'bytes');
          if (path.endsWith('.mp4')) {
            res.set('Content-Type', 'video/mp4');
          }
        },
      },
    }),
    PrismaModule, 
    UsersModule, 
    BranchesModule, 
    DevicesModule, 
    AuthModule, 
    MailModule, 
    LocationsModule, 
    IncidentsModule, 
    SecurityContactsModule, 
    WhatsappModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
