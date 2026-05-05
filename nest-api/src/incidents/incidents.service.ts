import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidentDto, IncidentStatus } from './dto/create-incident.dto';
import { MailService } from '../mail/mail.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class IncidentsService {
  private readonly fastapiUrl = 'http://localhost:8001'; // Assuming FastAPI runs here

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private whatsappService: WhatsappService,
  ) {}

  async create(createIncidentDto: CreateIncidentDto) {
    const aiClass = createIncidentDto.aiClass;
    const deviceId = createIncidentDto.deviceId;
    const now = new Date();

    // --- FACE RECOGNITION AUTHORIZATION LOGIC ---
    let isAuthorized = false;
    let incidentFaceToken = createIncidentDto.faceToken;

    // If an image is provided but no token, generate token first via FastAPI
    if (!incidentFaceToken && createIncidentDto.capturedImage) {
      try {
        const tokenResponse = await fetch(`${this.fastapiUrl}/generate-face-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: createIncidentDto.capturedImage }),
        });
        if (tokenResponse.ok) {
          const tokenResult = await tokenResponse.json() as any;
          incidentFaceToken = tokenResult.faceToken;
        }
      } catch (error) {
        console.error('Error generating token for incident face:', error);
      }
    }

    if (incidentFaceToken) {
      try {
        const technicians = await this.prisma.technician.findMany({
          where: { status: 'ACTIVE' },
          select: { faceToken: true, fullName: true, staffId: true }
        });

        // Call FastAPI to compare the incident faceToken with all technician tokens
        const compareResponse = await fetch(`${this.fastapiUrl}/compare-faces`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            incidentToken: incidentFaceToken,
            technicianTokens: technicians.map(t => ({ token: t.faceToken, id: t.staffId }))
          }),
        });

        if (compareResponse.ok) {
          const compareResult = await compareResponse.json() as any;
          if (compareResult.match) {
            isAuthorized = true;
            console.log(`[IncidentsService] Face matched: Authorized action by ${compareResult.technicianId}`);
          }
        }
      } catch (error) {
        console.error('Error during face comparison:', error);
      }
    }

    // Sanitize aiClass to ensure it's never an empty string
    let sanitizedAiClass = (aiClass && String(aiClass).trim() !== '') ? aiClass : 'SUSPICIOUS';
    
    // If a face is matched, override the class to AUTHORIZED
    if (isAuthorized) {
      sanitizedAiClass = 'AUTHORIZED_TECH';
    }
    
    // Generate AI Summary if not provided
    const aiSummary = createIncidentDto.aiSummary || this.generateAiSummary({
      ...createIncidentDto,
      aiClass: sanitizedAiClass as any
    });

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

    console.log(`[IncidentsService] Creating/Updating incident. Original Class: "${aiClass}", Sanitized: "${sanitizedAiClass}"`);

    if (existingActiveIncident) {
      // 1. ESCALATION: If existing is SUSPICIOUS and new is a high-risk class, upgrade the session
      const highRiskClasses = ['VANDAL', 'CLIMBING', 'CUTTING_WIRES', 'OPENING_BOX', 'THIEF'];
      const isEscalation = existingActiveIncident.aiClass === 'SUSPICIOUS' && 
                          highRiskClasses.includes(sanitizedAiClass as string);
      
      const updatedIncident = await this.prisma.incident.update({
        where: { id: existingActiveIncident.id },
        data: {
          aiClass: isEscalation ? (sanitizedAiClass as any) : existingActiveIncident.aiClass,
          alertStatus: isEscalation ? true : existingActiveIncident.alertStatus,
          aiConfidence: createIncidentDto.aiConfidence ?? existingActiveIncident.aiConfidence,
          videoPath: createIncidentDto.videoPath ?? existingActiveIncident.videoPath,
          alertType: createIncidentDto.alertType ?? existingActiveIncident.alertType,
          pirSensor: createIncidentDto.pirSensor ?? existingActiveIncident.pirSensor,
          servoPosition: createIncidentDto.servoPosition ?? existingActiveIncident.servoPosition,
          gpsLatitude: createIncidentDto.gpsLatitude ?? existingActiveIncident.gpsLatitude,
          gpsLongitude: createIncidentDto.gpsLongitude ?? existingActiveIncident.gpsLongitude,
          aiSummary: aiSummary,
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
    const highRiskClasses = ['VANDAL', 'CLIMBING', 'CUTTING_WIRES', 'OPENING_BOX', 'THIEF'];
    if (highRiskClasses.includes(sanitizedAiClass as string)) {
      alertStatus = true;
    } else if (sanitizedAiClass === 'SUSPICIOUS') {
      alertStatus = false;
    } else if (sanitizedAiClass === 'AUTHORIZED_TECH') {
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
        alertType: createIncidentDto.alertType,
        pirSensor: createIncidentDto.pirSensor,
        servoPosition: createIncidentDto.servoPosition,
        gpsLatitude: createIncidentDto.gpsLatitude,
        gpsLongitude: createIncidentDto.gpsLongitude,
        aiSummary: aiSummary,
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

  private generateAiSummary(dto: CreateIncidentDto): string {
    const timeStr = new Date().toLocaleTimeString();
    const confidence = dto.aiConfidence ? Math.round(dto.aiConfidence) : 95;
    const aiClass = dto.aiClass || 'SUSPICIOUS';
    const deviceId = dto.deviceId;
    
    let summary = `Detection Analysis: At ${timeStr}, AI Unit ${deviceId} identified high-probability ${aiClass} behavior. `;
    
    if (dto.alertType === 'THIEF') {
      summary += `The pattern matches known THIEF signatures with ${confidence}% confidence. Immediate intervention is recommended. `;
    } else {
      summary += `The activity is classified as ${aiClass} with ${confidence}% confidence. `;
    }

    if (dto.pirSensor) {
      summary += `Physical sensor (PIR ${dto.pirSensor}) confirmed localized motion at the unit. `;
    }

    summary += `System automatically flagged this event based on physical tampering sensors and computer vision analysis.`;
    
    return summary;
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
