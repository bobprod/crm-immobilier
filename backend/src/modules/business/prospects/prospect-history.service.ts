import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';

@Injectable()
export class ProspectHistoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Log a change to prospect history
   */
  async logChange(
    prospectId: string,
    userId: string,
    action: string,
    changes: any,
    metadata?: any,
  ) {
    return this.prisma.prospectHistory.create({
      data: {
        prospectId,
        userId,
        action,
        changes,
        metadata,
      },
    });
  }

  /**
   * Get history for a specific prospect
   */
  async getHistory(prospectId: string) {
    return this.prisma.prospectHistory.findMany({
      where: { prospectId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get user activity history
   */
  async getUserActivity(userId: string, limit = 50) {
    return this.prisma.prospectHistory.findMany({
      where: { userId },
      include: {
        prospect: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
