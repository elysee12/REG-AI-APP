import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidentDto, IncidentStatus } from './dto/create-incident.dto';
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
    const aiClass = createIncidentDto.aiClass;
    const deviceId = createIncidentDto.deviceId;
    const now = new Date();

    // --- PERMANENT DEDUPLICATION LOGIC ---
    // Rule: One device can only have ONE "Active Session" (ACTIVE or PENDING) at a time.
    // This prevents the database from cluttering with redundant logs for the same tower.

    const existingActiveIncident = await this.prisma.incident.findFirst({
      where: {
        deviceId,
        status: {
          in: [IncidentStatus.ACTIVE, IncidentStatus.PENDING],
        },
      },
      orderBy: { time: 'desc' },
    });

    if (existingActiveIncident) {
      // 1. ESCALATION: If existing is SUSPICIOUS and new is THIEF, upgrade the session
      const isEscalation = existingActiveIncident.aiClass === 'SUSPICIOUS' && aiClass === 'THIEF';
      
      const updatedIncident = await this.prisma.incident.update({
        where: { id: existingActiveIncident.id },
        data: {
          aiClass: isEscalation ? 'THIEF' : existingActiveIncident.aiClass,
          alertStatus: isEscalation ? true : existingActiveIncident.alertStatus,
          aiConfidence: createIncidentDto.aiConfidence ?? existingActiveIncident.aiConfidence,
          videoPath: createIncidentDto.videoPath ?? existingActiveIncident.videoPath,
          // We keep the original 'time' to group everything under the first detection event
        },
        include: {
          device: { include: { branch: true, securityContacts: true } },
        },
      });

      // If it was just escalated to THIEF, trigger the email alert now
      if (isEscalation && updatedIncident.device.securityContacts?.length > 0) {
        for (const contact of updatedIncident.device.securityContacts) {
          await this.mailService.sendIncidentAlertEmail(contact.email, contact.name, updatedIncident);
        }
      }

      return updatedIncident;
    }

    // 2. NO ACTIVE SESSION: Create a new incident record
    let alertStatus = createIncidentDto.alertStatus;
    if (aiClass === 'THIEF') {
      alertStatus = true;
    } else if (aiClass === 'SUSPICIOUS') {
      alertStatus = false;
    }

    const incident = await this.prisma.incident.create({
      data: {
        ...createIncidentDto,
        alertStatus: alertStatus ?? false,
        status: createIncidentDto.status || IncidentStatus.ACTIVE,
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

    // Send email alert ONLY for new THIEF incidents
    if (incident.aiClass === 'THIEF' && incident.device.securityContacts?.length > 0) {
      for (const contact of incident.device.securityContacts) {
        await this.mailService.sendIncidentAlertEmail(contact.email, contact.name, incident);
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

  async updateStatus(id: string, status: IncidentStatus) {
    return this.prisma.incident.update({
      where: { id },
      data: { status },
      include: {
        device: {
          include: {
            branch: true,
          },
        },
      },
    });
  }

  async updateVideoPath(id: string, videoPath: string) {
    return this.prisma.incident.update({
      where: { id },
      data: { videoPath },
      include: {
        device: {
          include: {
            branch: true,
          },
        },
      },
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
