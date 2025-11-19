import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer une tâche
   */
  async create(userId: string, data: any) {
    return this.prisma.tasks.create({
      data: {
        userId,
        ...data,
      },
      include: {
        prospects: true,
        properties: true,
        appointments: true,
      },
    });
  }

  /**
   * Obtenir toutes les tâches
   */
  async findAll(userId: string, filters?: any) {
    const where: any = { userId };

    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.prospectId) where.prospectId = filters.prospectId;

    return this.prisma.tasks.findMany({
      where,
      include: {
        prospects: { select: { id: true, firstName: true, lastName: true } },
        properties: { select: { id: true, title: true, reference: true } },
        appointments: { select: { id: true, title: true, startTime: true } },
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });
  }

  /**
   * Obtenir une tâche
   */
  async findOne(id: string, userId: string) {
    return this.prisma.tasks.findFirst({
      where: { id, userId },
      include: {
        prospects: true,
        properties: true,
        appointments: true,
      },
    });
  }

  /**
   * Mettre à jour
   */
  async update(id: string, userId: string, data: any) {
    return this.prisma.tasks.update({
      where: { id },
      data,
      include: {
        prospects: true,
        properties: true,
        appointments: true,
      },
    });
  }

  /**
   * Supprimer
   */
  async remove(id: string, userId: string) {
    return this.prisma.tasks.delete({
      where: { id },
    });
  }

  /**
   * Marquer comme terminée
   */
  async complete(id: string, userId: string) {
    return this.prisma.tasks.update({
      where: { id },
      data: {
        status: 'done',
        completedAt: new Date(),
      },
    });
  }

  /**
   * Obtenir statistiques
   */
  async getStats(userId: string) {
    const [total, todo, inProgress, done, overdue] = await Promise.all([
      this.prisma.tasks.count({ where: { userId } }),
      this.prisma.tasks.count({ where: { userId, status: 'todo' } }),
      this.prisma.tasks.count({ where: { userId, status: 'in_progress' } }),
      this.prisma.tasks.count({ where: { userId, status: 'done' } }),
      this.prisma.tasks.count({
        where: {
          userId,
          status: { in: ['todo', 'in_progress'] },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    return {
      total,
      todo,
      inProgress,
      done,
      overdue,
      completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  }

  /**
   * Tâches du jour
   */
  async getToday(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.tasks.findMany({
      where: {
        userId,
        status: { in: ['todo', 'in_progress'] },
        dueDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        prospects: { select: { firstName: true, lastName: true } },
        properties: { select: { title: true } },
      },
      orderBy: { priority: 'desc' },
    });
  }

  /**
   * Tâches en retard
   */
  async getOverdue(userId: string) {
    return this.prisma.tasks.findMany({
      where: {
        userId,
        status: { in: ['todo', 'in_progress'] },
        dueDate: { lt: new Date() },
      },
      include: {
        prospects: { select: { firstName: true, lastName: true } },
        properties: { select: { title: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  /**
   * CRON: Rappels tâches à venir
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendDailyReminders() {
    // Logique d'envoi de rappels
    console.log('Sending daily task reminders...');
  }
}
