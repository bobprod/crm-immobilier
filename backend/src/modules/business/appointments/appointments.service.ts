import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Créer un rendez-vous
   */
  async create(userId: string, data: any) {
    this.logger.log(`Creating appointment for user ${userId}`);

    // Vérifier les conflits
    const conflicts = await this.checkConflicts(
      userId,
      new Date(data.startTime),
      new Date(data.endTime),
    );

    if (conflicts.length > 0) {
      throw new BadRequestException(
        `Conflit détecté: vous avez déjà ${conflicts.length} rendez-vous à cette heure`,
      );
    }

    return this.prisma.appointments.create({
      data: {
        ...data,
        userId,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
      },
      include: {
        prospects: true,
        properties: true,
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Récupérer tous les rendez-vous avec filtres
   */
  async findAll(userId: string, filters?: any) {
    const where: any = { userId };

    // Filtre par date
    if (filters?.date) {
      const date = new Date(filters.date);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      where.startTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    // Filtre par plage de dates
    if (filters?.startDate && filters?.endDate) {
      where.startTime = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    // Filtre par statut
    if (filters?.status) {
      where.status = filters.status;
    }

    // Filtre par type
    if (filters?.type) {
      where.type = filters.type;
    }

    // Filtre par prospect
    if (filters?.prospectId) {
      where.prospectId = filters.prospectId;
    }

    // Filtre par propriété
    if (filters?.propertyId) {
      where.propertyId = filters.propertyId;
    }

    // Filtre par priorité
    if (filters?.priority) {
      where.priority = filters.priority;
    }

    return this.prisma.appointments.findMany({
      where,
      include: {
        prospects: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        properties: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            price: true,
            type: true,
          },
        },
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
      take: filters?.limit ? parseInt(filters.limit) : 100,
      skip: filters?.skip ? parseInt(filters.skip) : 0,
    });
  }

  /**
   * Récupérer un rendez-vous par ID
   */
  async findOne(id: string, userId: string) {
    const appointment = await this.prisma.appointments.findFirst({
      where: { id, userId },
      include: {
        prospects: true,
        properties: true,
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Rendez-vous non trouvé');
    }

    return appointment;
  }

  /**
   * Mettre à jour un rendez-vous
   */
  async update(id: string, userId: string, data: any) {
    await this.findOne(id, userId); // Vérifier l'existence

    const updateData: any = { ...data };

    if (data.startTime) {
      updateData.startTime = new Date(data.startTime);
    }
    if (data.endTime) {
      updateData.endTime = new Date(data.endTime);
    }

    // Vérifier les conflits si les dates changent
    if (data.startTime && data.endTime) {
      const conflicts = await this.checkConflicts(
        userId,
        new Date(data.startTime),
        new Date(data.endTime),
        id, // Exclure le RDV actuel
      );

      if (conflicts.length > 0) {
        throw new BadRequestException(
          `Conflit détecté: vous avez déjà ${conflicts.length} rendez-vous à cette heure`,
        );
      }
    }

    return this.prisma.appointments.update({
      where: { id },
      data: updateData,
      include: {
        prospects: true,
        properties: true,
      },
    });
  }

  /**
   * Supprimer un rendez-vous
   */
  async delete(id: string, userId: string) {
    await this.findOne(id, userId); // Vérifier l'existence

    await this.prisma.appointments.delete({
      where: { id },
    });

    return { success: true, message: 'Rendez-vous supprimé avec succès' };
  }

  /**
   * Vérifier les conflits de rendez-vous
   */
  async checkConflicts(userId: string, startTime: Date, endTime: Date, excludeId?: string) {
    const where: any = {
      userId,
      status: {
        notIn: ['cancelled'],
      },
      OR: [
        // Le nouveau RDV commence pendant un RDV existant
        {
          AND: [{ startTime: { lte: startTime } }, { endTime: { gte: startTime } }],
        },
        // Le nouveau RDV se termine pendant un RDV existant
        {
          AND: [{ startTime: { lte: endTime } }, { endTime: { gte: endTime } }],
        },
        // Le nouveau RDV englobe un RDV existant
        {
          AND: [{ startTime: { gte: startTime } }, { endTime: { lte: endTime } }],
        },
      ],
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    return this.prisma.appointments.findMany({
      where,
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
      },
    });
  }

  /**
   * Obtenir les disponibilités d'un agent
   */
  async getAvailability(
    userId: string,
    date: string,
    duration: number = 60, // minutes
  ) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(8, 0, 0, 0)); // 8h
    const endOfDay = new Date(targetDate.setHours(18, 0, 0, 0)); // 18h

    // Récupérer tous les RDV du jour
    const appointments = await this.prisma.appointments.findMany({
      where: {
        userId,
        startTime: {
          gte: startOfDay,
          lt: endOfDay,
        },
        status: {
          notIn: ['cancelled'],
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
      orderBy: { startTime: 'asc' },
    });

    // Générer les créneaux disponibles
    const slots = [];
    let currentTime = new Date(startOfDay);

    while (currentTime < endOfDay) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60000);

      // Vérifier si le créneau est libre
      const isAvailable = !appointments.some(
        (apt) =>
          (currentTime >= apt.startTime && currentTime < apt.endTime) ||
          (slotEnd > apt.startTime && slotEnd <= apt.endTime) ||
          (currentTime <= apt.startTime && slotEnd >= apt.endTime),
      );

      if (isAvailable && slotEnd <= endOfDay) {
        slots.push({
          start: currentTime.toISOString(),
          end: slotEnd.toISOString(),
        });
      }

      // Passer au créneau suivant (par intervalles de 30min)
      currentTime = new Date(currentTime.getTime() + 30 * 60000);
    }

    return slots;
  }

  /**
   * Obtenir les rendez-vous à venir
   */
  async getUpcoming(userId: string, limit: number = 10) {
    return this.prisma.appointments.findMany({
      where: {
        userId,
        startTime: {
          gte: new Date(),
        },
        status: {
          in: ['scheduled', 'confirmed'],
        },
      },
      include: {
        prospects: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        properties: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
      take: limit,
    });
  }

  /**
   * Obtenir les rendez-vous d'aujourd'hui
   */
  async getToday(userId: string) {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    return this.prisma.appointments.findMany({
      where: {
        userId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        prospects: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        properties: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  /**
   * Marquer comme terminé
   */
  async complete(id: string, userId: string, outcome?: string, rating?: number) {
    await this.findOne(id, userId);

    return this.prisma.appointments.update({
      where: { id },
      data: {
        status: 'completed',
        outcome,
        rating,
      },
    });
  }

  /**
   * Annuler un rendez-vous
   */
  async cancel(id: string, userId: string, reason?: string) {
    const appointment = await this.findOne(id, userId);

    return this.prisma.appointments.update({
      where: { id },
      data: {
        status: 'cancelled',
        notes: reason
          ? `${appointment.notes || ''}\n\nAnnulé: ${reason}`.trim()
          : appointment.notes,
      },
    });
  }

  /**
   * Reprogrammer un rendez-vous
   */
  async reschedule(id: string, userId: string, newStartTime: string, newEndTime: string) {
    await this.findOne(id, userId);

    // Vérifier les conflits
    const conflicts = await this.checkConflicts(
      userId,
      new Date(newStartTime),
      new Date(newEndTime),
      id,
    );

    if (conflicts.length > 0) {
      throw new BadRequestException('Conflit avec un autre rendez-vous');
    }

    return this.prisma.appointments.update({
      where: { id },
      data: {
        startTime: new Date(newStartTime),
        endTime: new Date(newEndTime),
        status: 'rescheduled',
      },
    });
  }

  /**
   * Statistiques des rendez-vous
   */
  async getStats(userId: string, startDate?: string, endDate?: string) {
    const where: any = { userId };

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [total, byStatus, byType, byPriority] = await Promise.all([
      this.prisma.appointments.count({ where }),
      this.prisma.appointments.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.prisma.appointments.groupBy({
        by: ['type'],
        where,
        _count: true,
      }),
      this.prisma.appointments.groupBy({
        by: ['priority'],
        where,
        _count: true,
      }),
    ]);

    // Taux de présence
    const completed = await this.prisma.appointments.count({
      where: { ...where, status: 'completed' },
    });
    const noShow = await this.prisma.appointments.count({
      where: { ...where, status: 'no_show' },
    });
    const attendanceRate = completed + noShow > 0 ? (completed / (completed + noShow)) * 100 : 0;

    // Rating moyen
    const ratings = await this.prisma.appointments.aggregate({
      where: { ...where, rating: { not: null } },
      _avg: { rating: true },
    });

    return {
      total,
      byStatus,
      byType,
      byPriority,
      attendanceRate: Math.round(attendanceRate),
      averageRating: ratings._avg.rating || 0,
    };
  }

  /**
   * Tâche CRON: Envoyer les rappels automatiques
   * S'exécute toutes les heures
   */
  @Cron(CronExpression.EVERY_HOUR)
  async sendReminders() {
    this.logger.log('Checking for appointments needing reminders...');

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const appointments = await this.prisma.appointments.findMany({
      where: {
        reminder: true,
        reminderSent: false,
        status: {
          in: ['scheduled', 'confirmed'],
        },
        startTime: {
          gte: now,
          lte: oneHourFromNow,
        },
      },
      include: {
        prospects: true,
        users: true,
      },
    });

    this.logger.log(`Found ${appointments.length} appointments needing reminders`);

    for (const appointment of appointments) {
      try {
        // TODO: Intégrer avec le module Communications pour envoyer Email/SMS
        // await this.communicationsService.sendEmail(...)
        // await this.communicationsService.sendSms(...)

        // Marquer le rappel comme envoyé
        await this.prisma.appointments.update({
          where: { id: appointment.id },
          data: { reminderSent: true },
        });

        this.logger.log(`Reminder sent for appointment ${appointment.id}`);
      } catch (error) {
        this.logger.error(
          `Failed to send reminder for appointment ${appointment.id}: ${error.message}`,
        );
      }
    }
  }
}
