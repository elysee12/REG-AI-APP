import { Module } from '@nestjs/common';
import { SecurityContactsService } from './security-contacts.service';
import { SecurityContactsController } from './security-contacts.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SecurityContactsController],
  providers: [SecurityContactsService],
  exports: [SecurityContactsService],
})
export class SecurityContactsModule {}
