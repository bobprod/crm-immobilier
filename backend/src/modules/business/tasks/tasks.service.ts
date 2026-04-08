import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../shared/database/prisma.service';
import { CommunicationsService } from '../../communications/communications.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  TaskCreatedEvent,
  TaskCompletedEvent,
} from '../shared/events/business.events';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private prisma: PrismaService,
    private communicationsService: CommunicationsService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Créer une tâche
   */
  async create(userId: string, data: any) {
    const task = await this.prisma.tasks.create({
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

    this.eventEmitter.emit('task.created', new TaskCreatedEvent(userId, task));

    return task;
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
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { dueDate: 'asc' }],
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
    const task = await this.prisma.tasks.update({
      where: { id },
      data: {
        status: 'done',
        completedAt: new Date(),
      },
    });

    this.eventEmitter.emit('task.completed', new TaskCompletedEvent(userId, task));

    return task;
  }

  /**
   * Obtenir statistiques
   */
  async getStats(userId: string) {
    try {
      const [total, todo, inProgress, done, overdue] = await Promise.all([
        this.prisma.tasks.count({ where: { userId } }).catch(() => 0),
        this.prisma.tasks.count({ where: { userId, status: 'todo' } }).catch(() => 0),
        this.prisma.tasks.count({ where: { userId, status: 'in_progress' } }).catch(() => 0),
        this.prisma.tasks.count({ where: { userId, status: 'done' } }).catch(() => 0),
        this.prisma.tasks
          .count({
            where: {
              userId,
              status: { in: ['todo', 'in_progress'] },
              dueDate: { lt: new Date() },
            },
          })
          .catch(() => 0),
      ]);

      return {
        total,
        todo,
        inProgress,
        done,
        overdue,
        completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    } catch (error) {
      this.logger.error('Error fetching tasks stats:', error);
      // Retourner des valeurs par défaut en cas d'erreur
      return {
        total: 0,
        todo: 0,
        inProgress: 0,
        done: 0,
        overdue: 0,
        completionRate: 0,
      };
    }
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
    this.logger.log('Starting daily task reminders job...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // 1. Récupérer les tâches dues aujourd'hui avec les infos utilisateur
      const tasksDueToday = await this.prisma.tasks.findMany({
        where: {
          status: { in: ['todo', 'in_progress'] },
          dueDate: { gte: today, lt: tomorrow },
        },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          prospects: { select: { firstName: true, lastName: true } },
          properties: { select: { title: true } },
        },
      });

      if (tasksDueToday.length === 0) {
        this.logger.log('No tasks due today, skipping reminders.');
        return;
      }

      // 2. Grouper les tâches par utilisateur
      const tasksByUser: Record<string, (typeof tasksDueToday)[number][]> = {};
      for (const task of tasksDueToday) {
        if (!tasksByUser[task.userId]) tasksByUser[task.userId] = [];
        tasksByUser[task.userId].push(task);
      }

      // 3. Envoyer une notification par email par utilisateur
      let sentCount = 0;
      for (const [userId, tasks] of Object.entries(tasksByUser)) {
        const user = tasks[0].user;
        if (!user?.email) continue;

        const taskList = tasks
          .map((t) => {
            const related = t.prospects
              ? `${t.prospects.firstName} ${t.prospects.lastName}`
              : t.properties?.title || '';
            return `• ${t.title}${related ? ` (${related})` : ''} [${t.priority}]`;
          })
          .join('\n');

        const subject = `📋 Rappel : ${tasks.length} tâche${tasks.length > 1 ? 's' : ''} à faire aujourd'hui`;
        const body = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Bonjour ${user.firstName || ''} 👋</h2>
            <p>Vous avez <strong>${tasks.length} tâche${tasks.length > 1 ? 's' : ''}</strong> à traiter aujourd'hui :</p>
            <pre style="background:#f5f5f5;padding:12px;border-radius:4px;white-space:pre-wrap;">${taskList}</pre>
            <p style="margin-top:20px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3003'}/tasks"
                 style="background-color:#4CAF50;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
                Voir mes tâches
              </a>
            </p>
            <p style="color:#999;font-size:12px;">L'équipe CRM Immobilier</p>
          </div>
        `;

        try {
          await this.communicationsService.sendEmail(userId, { to: user.email, subject, body });
          sentCount++;
        } catch (emailError) {
          this.logger.error(`Failed to send reminder to ${user.email}:`, emailError);
        }
      }

      this.logger.log(`Daily task reminders sent: ${sentCount} emails for ${tasksDueToday.length} tasks`);
    } catch (error) {
      this.logger.error('Failed to send daily task reminders', error);
    }
  }
}
