import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface LogErrorDto {
  userId?: string | null;
  agencyId?: string | null;
  actionCode: string;
  provider: string;
  errorType: string;
  errorMessage: string;
  statusCode?: number;
  endpoint?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorLogEntry {
  id: string;
  userId: string | null;
  agencyId: string | null;
  actionCode: string;
  provider: string;
  errorType: string;
  errorMessage: string;
  statusCode: number | null;
  endpoint: string | null;
  entityType: string | null;
  entityId: string | null;
  metadata: any;
  createdAt: Date;
}

export interface ErrorStats {
  totalErrors: number;
  byProvider: Array<{ provider: string; count: number }>;
  byErrorType: Array<{ errorType: string; count: number }>;
  byStatusCode: Array<{ statusCode: number; count: number }>;
  recentErrors: ErrorLogEntry[];
}

@Injectable()
export class AiErrorLogService {
  constructor(private prisma: PrismaService) {}

  /**
   * ═══════════════════════════════════════════════════════════
   * ENREGISTREMENT DES ERREURS
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Enregistre une erreur AI dans la base de données
   *
   * Cette méthode doit être appelée chaque fois qu'une erreur se produit
   * lors d'un appel à un provider AI ou scraping.
   */
  async logError(data: LogErrorDto): Promise<ErrorLogEntry> {
    const errorLog = await this.prisma.aiErrorLog.create({
      data: {
        userId: data.userId || null,
        agencyId: data.agencyId || null,
        actionCode: data.actionCode,
        provider: data.provider,
        errorType: data.errorType,
        errorMessage: data.errorMessage,
        statusCode: data.statusCode || null,
        endpoint: data.endpoint || null,
        entityType: data.entityType || null,
        entityId: data.entityId || null,
        metadata: data.metadata || null,
      },
    });

    return {
      id: errorLog.id,
      userId: errorLog.userId,
      agencyId: errorLog.agencyId,
      actionCode: errorLog.actionCode,
      provider: errorLog.provider,
      errorType: errorLog.errorType,
      errorMessage: errorLog.errorMessage,
      statusCode: errorLog.statusCode,
      endpoint: errorLog.endpoint,
      entityType: errorLog.entityType,
      entityId: errorLog.entityId,
      metadata: errorLog.metadata,
      createdAt: errorLog.createdAt,
    };
  }

  /**
   * Helper pour logger les erreurs de clé API manquante
   */
  async logMissingApiKey(
    userId: string,
    provider: string,
    actionCode: string,
    agencyId?: string | null,
  ) {
    return this.logError({
      userId,
      agencyId,
      actionCode,
      provider,
      errorType: 'MISSING_API_KEY',
      errorMessage: `Clé API manquante pour le provider "${provider}".`,
      statusCode: 401,
    });
  }

  /**
   * Helper pour logger les erreurs d'API (4xx/5xx)
   */
  async logApiError(
    userId: string,
    provider: string,
    actionCode: string,
    statusCode: number,
    errorMessage: string,
    endpoint?: string,
    agencyId?: string | null,
    metadata?: Record<string, any>,
  ) {
    return this.logError({
      userId,
      agencyId,
      actionCode,
      provider,
      errorType: statusCode >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR',
      errorMessage,
      statusCode,
      endpoint,
      metadata,
    });
  }

  /**
   * Helper pour logger les erreurs de crédits insuffisants
   */
  async logInsufficientCredits(
    userId: string,
    actionCode: string,
    creditsRequired: number,
    creditsAvailable: number,
    agencyId?: string | null,
  ) {
    return this.logError({
      userId,
      agencyId,
      actionCode,
      provider: 'system',
      errorType: 'INSUFFICIENT_CREDITS',
      errorMessage: `Crédits insuffisants. Requis: ${creditsRequired}, Disponible: ${creditsAvailable}.`,
      metadata: {
        creditsRequired,
        creditsAvailable,
      },
    });
  }

  /**
   * Helper pour logger les timeouts
   */
  async logTimeout(
    userId: string,
    provider: string,
    actionCode: string,
    endpoint?: string,
    agencyId?: string | null,
  ) {
    return this.logError({
      userId,
      agencyId,
      actionCode,
      provider,
      errorType: 'TIMEOUT',
      errorMessage: `Timeout lors de l'appel au provider "${provider}".`,
      statusCode: 408,
      endpoint,
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * RÉCUPÉRATION DES ERREURS
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Récupère les erreurs pour un utilisateur
   */
  async getUserErrors(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ErrorLogEntry[]> {
    const errors = await this.prisma.aiErrorLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return errors.map(e => this.mapToErrorLogEntry(e));
  }

  /**
   * Récupère les erreurs pour une agence
   */
  async getAgencyErrors(
    agencyId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ErrorLogEntry[]> {
    const errors = await this.prisma.aiErrorLog.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return errors.map(e => this.mapToErrorLogEntry(e));
  }

  /**
   * Récupère les erreurs par provider
   */
  async getErrorsByProvider(
    provider: string,
    limit: number = 50,
  ): Promise<ErrorLogEntry[]> {
    const errors = await this.prisma.aiErrorLog.findMany({
      where: { provider },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return errors.map(e => this.mapToErrorLogEntry(e));
  }

  /**
   * Récupère les erreurs récentes (24h) pour monitoring
   */
  async getRecentErrors(limit: number = 100): Promise<ErrorLogEntry[]> {
    const last24h = new Date();
    last24h.setHours(last24h.getHours() - 24);

    const errors = await this.prisma.aiErrorLog.findMany({
      where: {
        createdAt: { gte: last24h },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return errors.map(e => this.mapToErrorLogEntry(e));
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * STATISTIQUES
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Statistiques globales des erreurs
   */
  async getGlobalErrorStats(
    startDate?: Date,
    endDate?: Date,
  ): Promise<ErrorStats> {
    const whereClause: any = {};

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    // Total des erreurs
    const totalErrors = await this.prisma.aiErrorLog.count({ where: whereClause });

    // Erreurs par provider
    const byProvider = await this.prisma.aiErrorLog.groupBy({
      by: ['provider'],
      _count: true,
      where: whereClause,
      orderBy: { _count: { provider: 'desc' } },
      take: 10,
    });

    // Erreurs par type
    const byErrorType = await this.prisma.aiErrorLog.groupBy({
      by: ['errorType'],
      _count: true,
      where: whereClause,
      orderBy: { _count: { errorType: 'desc' } },
      take: 10,
    });

    // Erreurs par status code
    const byStatusCode = await this.prisma.aiErrorLog.groupBy({
      by: ['statusCode'],
      _count: true,
      where: {
        ...whereClause,
        statusCode: { not: null },
      },
      orderBy: { _count: { statusCode: 'desc' } },
      take: 10,
    });

    // Erreurs récentes
    const recentErrors = await this.prisma.aiErrorLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      totalErrors,
      byProvider: byProvider.map(p => ({
        provider: p.provider,
        count: p._count,
      })),
      byErrorType: byErrorType.map(e => ({
        errorType: e.errorType,
        count: e._count,
      })),
      byStatusCode: byStatusCode.map(s => ({
        statusCode: s.statusCode!,
        count: s._count,
      })),
      recentErrors: recentErrors.map(e => this.mapToErrorLogEntry(e)),
    };
  }

  /**
   * Statistiques des erreurs pour un utilisateur
   */
  async getUserErrorStats(userId: string, days: number = 30): Promise<ErrorStats> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const whereClause = {
      userId,
      createdAt: { gte: startDate },
    };

    const totalErrors = await this.prisma.aiErrorLog.count({ where: whereClause });

    const byProvider = await this.prisma.aiErrorLog.groupBy({
      by: ['provider'],
      _count: true,
      where: whereClause,
      orderBy: { _count: { provider: 'desc' } },
    });

    const byErrorType = await this.prisma.aiErrorLog.groupBy({
      by: ['errorType'],
      _count: true,
      where: whereClause,
      orderBy: { _count: { errorType: 'desc' } },
    });

    const byStatusCode = await this.prisma.aiErrorLog.groupBy({
      by: ['statusCode'],
      _count: true,
      where: {
        ...whereClause,
        statusCode: { not: null },
      },
      orderBy: { _count: { statusCode: 'desc' } },
    });

    const recentErrors = await this.prisma.aiErrorLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      totalErrors,
      byProvider: byProvider.map(p => ({
        provider: p.provider,
        count: p._count,
      })),
      byErrorType: byErrorType.map(e => ({
        errorType: e.errorType,
        count: e._count,
      })),
      byStatusCode: byStatusCode.map(s => ({
        statusCode: s.statusCode!,
        count: s._count,
      })),
      recentErrors: recentErrors.map(e => this.mapToErrorLogEntry(e)),
    };
  }

  /**
   * Statistiques des erreurs pour une agence
   */
  async getAgencyErrorStats(agencyId: string, days: number = 30): Promise<ErrorStats> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const whereClause = {
      agencyId,
      createdAt: { gte: startDate },
    };

    const totalErrors = await this.prisma.aiErrorLog.count({ where: whereClause });

    const byProvider = await this.prisma.aiErrorLog.groupBy({
      by: ['provider'],
      _count: true,
      where: whereClause,
      orderBy: { _count: { provider: 'desc' } },
    });

    const byErrorType = await this.prisma.aiErrorLog.groupBy({
      by: ['errorType'],
      _count: true,
      where: whereClause,
      orderBy: { _count: { errorType: 'desc' } },
    });

    const byStatusCode = await this.prisma.aiErrorLog.groupBy({
      by: ['statusCode'],
      _count: true,
      where: {
        ...whereClause,
        statusCode: { not: null },
      },
      orderBy: { _count: { statusCode: 'desc' } },
    });

    const recentErrors = await this.prisma.aiErrorLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      totalErrors,
      byProvider: byProvider.map(p => ({
        provider: p.provider,
        count: p._count,
      })),
      byErrorType: byErrorType.map(e => ({
        errorType: e.errorType,
        count: e._count,
      })),
      byStatusCode: byStatusCode.map(s => ({
        statusCode: s.statusCode!,
        count: s._count,
      })),
      recentErrors: recentErrors.map(e => this.mapToErrorLogEntry(e)),
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * NETTOYAGE
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Supprime les erreurs plus anciennes que X jours (CRON job)
   */
  async cleanupOldErrors(daysToKeep: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.aiErrorLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return {
      deleted: result.count,
      cutoffDate,
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * HELPERS PRIVÉS
   * ═══════════════════════════════════════════════════════════
   */

  private mapToErrorLogEntry(error: any): ErrorLogEntry {
    return {
      id: error.id,
      userId: error.userId,
      agencyId: error.agencyId,
      actionCode: error.actionCode,
      provider: error.provider,
      errorType: error.errorType,
      errorMessage: error.errorMessage,
      statusCode: error.statusCode,
      endpoint: error.endpoint,
      entityType: error.entityType,
      entityId: error.entityId,
      metadata: error.metadata,
      createdAt: error.createdAt,
    };
  }
}
