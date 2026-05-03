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
    // Window: 2 minutes. After 2 minutes, a new incident will be created.
    // This prevents the database from cluttering with redundant logs for the same tower.

    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);

    const existingActiveIncident = await this.prisma.incident.findFirst({
      where: {
        deviceId,
        status: {
          in: [IncidentStatus.ACTIVE, IncidentStatus.PENDING],
        },
        time: {
          gte: twoMinutesAgo,
        },
      },
      orderBy: { time: 'desc' },
    });

    // Sanitize aiClass to ensure it's never an empty string
    const sanitizedAiClass = (aiClass && String(aiClass).trim() !== '') ? aiClass : 'SUSPICIOUS';
    console.log(`[IncidentsService] Creating/Updating incident. Original Class: "${aiClass}", Sanitized: "${sanitizedAiClass}"`);

    if (existingActiveIncident) {
      // 1. ESCALATION: If existing is SUSPICIOUS and new is a high-risk class, upgrade the session
      const highRiskClasses = ['VANDAL', 'CLIMBING', 'CUTTING_WIRES', 'OPENING_BOX'];
      const isEscalation = existingActiveIncident.aiClass === 'SUSPICIOUS' && 
                          highRiskClasses.includes(sanitizedAiClass as string);
      
      const updatedIncident = await this.prisma.incident.update({
        where: { id: existingActiveIncident.id },
        data: {
          aiClass: isEscalation ? (sanitizedAiClass as any) : existingActiveIncident.aiClass,
          alertStatus: isEscalation ? true : existingActiveIncident.alertStatus,
          aiConfidence: createIncidentDto.aiConfidence ?? existingActiveIncident.aiConfidence,
          videoPath: createIncidentDto.videoPath ?? existingActiveIncident.videoPath,
          time: now, // Update time to current to extend the 2-minute window
        },
        include: {
          device: { include: { branch: true, securityContacts: true } },
        },
      }) as any;

      // If it was just escalated, trigger the email alert now
      if (isEscalation && updatedIncident.alertStatus && updatedIncident.device?.securityContacts?.length > 0) {
        for (const contact of updatedIncident.device.securityContacts) {
          await this.mailService.sendIncidentAlertEmail(contact.email, contact.name, updatedIncident);
        }
      }

      return updatedIncident;
    }

    // 2. NO ACTIVE SESSION: Create a new incident record
    let alertStatus = createIncidentDto.alertStatus;
    const highRiskClasses = ['VANDAL', 'CLIMBING', 'CUTTING_WIRES', 'OPENING_BOX'];
    if (highRiskClasses.includes(sanitizedAiClass as string)) {
      alertStatus = true;
    } else if (sanitizedAiClass === 'SUSPICIOUS') {
      alertStatus = false;
    }

    const incident = await this.prisma.incident.create({
      data: {
        deviceId: createIncidentDto.deviceId,
        aiClass: sanitizedAiClass as any,
        aiConfidence: createIncidentDto.aiConfidence,
        videoPath: createIncidentDto.videoPath,
        alertStatus: alertStatus ?? false,
        status: (createIncidentDto.status as any) || IncidentStatus.ACTIVE,
        time: now,
      },
      include: {
        device: {
          include: {
            branch: true,
            securityContacts: true,
          },
        },
      },
    }) as any;

    // Send email alert ONLY for high-priority incidents
    if (incident.alertStatus && incident.device?.securityContacts?.length > 0) {
      for (const contact of incident.device.securityContacts) {
        await this.mailService.sendIncidentAlertEmail(contact.email, contact.name, incident);
      }
    }

    return incident;
  }

  async findAssignedToUser(email: string) {
    const contact = await this.prisma.securityContact.findFirst({
      where: { email },
      include: { devices: true },
    });

    if (!contact?.devices?.length) {
      return [];
    }

    const deviceIds = contact.devices.map((device) => device.id);
    return this.prisma.incident.findMany({
      where: {
        deviceId: { in: deviceIds },
      },
      orderBy: { time: 'desc' },
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
      data: { status: status as any },
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
    try {
      return await this.prisma.incident.update({
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
    } catch (error) {
      console.error(`[updateVideoPath] Failed to update video for incident ${id}: Record not found or database error.`);
      return null;
    }
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
          results.push({ email: contact.email, success: false, error: (error as Error).message });
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
          results.push({ name: contact.name, phone: contact.phone, success: false, error: (error as Error).message });
        }
      }
      return { success: true, whatsappResults: results };
    }

    return { success: true, message: 'No security contacts to notify' };
  }
}
