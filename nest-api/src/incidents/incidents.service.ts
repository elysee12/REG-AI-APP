import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { MailService } from '../mail/mail.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class IncidentsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private whatsappService: WhatsappService,
  ) {}

  async create(createIncidentDto: CreateIncidentDto) {
    const incident = await this.prisma.incident.create({
      data: createIncidentDto,
      include: {
        device: {
          include: {
            branch: true,
            securityContacts: true,
          },
        },
      },
    });

    // Send email to all linked security contacts
    if (incident.device.securityContacts && incident.device.securityContacts.length > 0) {
      for (const contact of incident.device.securityContacts) {
        await this.mailService.sendIncidentAlertEmail(
          contact.email,
          contact.name,
          incident,
        );
      }
    }

    return incident;
  }

  async findAll() {
    return this.prisma.incident.findMany({
      orderBy: {
        time: 'desc',
      },
      include: {
        device: {
          include: {
            branch: true,
            securityContacts: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.incident.findUnique({
      where: { id },
      include: {
        device: {
          include: {
            branch: true,
            securityContacts: true,
          },
        },
      },
    });
  }

  async findByBranch(branchId: number) {
    if (isNaN(branchId)) {
      return this.findAll();
    }
    return this.prisma.incident.findMany({
      where: {
        device: {
          branchId: branchId,
        },
      },
      orderBy: {
        time: 'desc',
      },
      include: {
        device: {
          include: {
            branch: true,
          },
        },
      },
    });
  }

  async findByDevice(deviceId: string) {
    return this.prisma.incident.findMany({
      where: {
        deviceId: deviceId,
      },
      orderBy: {
        time: 'desc',
      },
      include: {
        device: {
          include: {
            branch: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.incident.update({
      where: { id },
      data: { status },
    });
  }

  async broadcastAlert(id: string, message: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        device: {
          include: {
            branch: true,
            securityContacts: true,
          },
        },
      },
    });

    if (!incident) {
      throw new Error('Incident not found');
    }

    if (incident.device.securityContacts && incident.device.securityContacts.length > 0) {
      const results: { email: string; success: boolean; error?: string }[] = [];
      for (const contact of incident.device.securityContacts) {
        try {
          await this.mailService.sendBroadcastAlertEmail(
            contact.email,
            contact.name,
            message,
            incident,
          );
          results.push({ email: contact.email, success: true });
        } catch (error) {
          results.push({ email: contact.email, success: false, error: error.message });
        }
      }
      return { success: true, broadcastResults: results };
    }

    return { success: true, message: 'No security contacts to notify' };
  }

  async broadcastWhatsappAlert(id: string, message: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        device: {
          include: {
            securityContacts: true,
          },
        },
      },
    });

    if (!incident) {
      throw new Error('Incident not found');
    }

    if (incident.device.securityContacts && incident.device.securityContacts.length > 0) {
      const results: { name: string; phone: string; success: boolean; error?: string }[] = [];
      for (const contact of incident.device.securityContacts) {
        try {
          const success = await this.whatsappService.sendAutomatedMessage(
            contact.phone,
            message,
          );
          results.push({ name: contact.name, phone: contact.phone, success });
        } catch (error) {
          results.push({ name: contact.name, phone: contact.phone, success: false, error: error.message });
        }
      }
      return { success: true, whatsappResults: results };
    }

    return { success: true, message: 'No security contacts to notify' };
  }
}
