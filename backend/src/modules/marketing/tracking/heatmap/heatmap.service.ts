import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';

interface HeatmapDataPoint {
  x: number; // Position X en pixels ou %
  y: number; // Position Y en pixels ou %
  value: number; // Intensité (nombre de clics/hovers)
  type: 'click' | 'move' | 'scroll';
}

interface HeatmapSession {
  pageUrl: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
  sessionId: string;
}

/**
 * Service pour gérer les heatmaps de tracking
 *
 * Permet de visualiser où les utilisateurs cliquent, scrollent et déplacent
 * leur souris sur les pages vitrines.
 */
@Injectable()
export class HeatmapService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enregistrer un événement de heatmap (click, move, scroll)
   */
  async recordHeatmapEvent(
    userId: string,
    data: {
      pageUrl: string;
      x: number;
      y: number;
      type: 'click' | 'move' | 'scroll';
      sessionId: string;
      deviceType?: string;
      screenWidth?: number;
      screenHeight?: number;
      userAgent?: string;
      element?: string; // Sélecteur CSS de l'élément cliqué
      timestamp?: Date;
    },
  ) {
    return this.prisma.heatmapEvent.create({
      data: {
        userId,
        pageUrl: data.pageUrl,
        x: data.x,
        y: data.y,
        type: data.type,
        sessionId: data.sessionId,
        deviceType: data.deviceType || 'desktop',
        screenWidth: data.screenWidth || 1920,
        screenHeight: data.screenHeight || 1080,
        userAgent: data.userAgent,
        element: data.element,
        timestamp: data.timestamp || new Date(),
      },
    });
  }

  /**
   * Enregistrer un batch d'événements heatmap
   * (pour optimiser les requêtes depuis le frontend)
   */
  async recordBatchHeatmapEvents(
    userId: string,
    events: Array<{
      pageUrl: string;
      x: number;
      y: number;
      type: 'click' | 'move' | 'scroll';
      sessionId: string;
      deviceType?: string;
      screenWidth?: number;
      screenHeight?: number;
      element?: string;
      timestamp?: Date;
    }>,
  ) {
    return this.prisma.heatmapEvent.createMany({
      data: events.map((event) => ({
        userId,
        pageUrl: event.pageUrl,
        x: event.x,
        y: event.y,
        type: event.type,
        sessionId: event.sessionId,
        deviceType: event.deviceType || 'desktop',
        screenWidth: event.screenWidth || 1920,
        screenHeight: event.screenHeight || 1080,
        element: event.element,
        timestamp: event.timestamp || new Date(),
      })),
    });
  }

  /**
   * Récupérer les données de heatmap pour une page spécifique
   */
  async getHeatmapData(
    userId: string,
    pageUrl: string,
    filters?: {
      type?: 'click' | 'move' | 'scroll';
      deviceType?: 'desktop' | 'mobile' | 'tablet';
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<HeatmapDataPoint[]> {
    const events = await this.prisma.heatmapEvent.findMany({
      where: {
        userId,
        pageUrl,
        type: filters?.type,
        deviceType: filters?.deviceType,
        timestamp: {
          gte: filters?.startDate,
          lte: filters?.endDate,
        },
      },
      select: {
        x: true,
        y: true,
        type: true,
      },
    });

    // Agréger les points pour créer des zones de chaleur
    const pointsMap = new Map<string, HeatmapDataPoint>();

    events.forEach((event) => {
      // Arrondir les coordonnées pour grouper les points proches
      const gridSize = 20; // Taille de la grille en pixels
      const gridX = Math.floor(event.x / gridSize) * gridSize;
      const gridY = Math.floor(event.y / gridSize) * gridSize;
      const key = `${gridX},${gridY},${event.type}`;

      if (pointsMap.has(key)) {
        const existing = pointsMap.get(key)!;
        existing.value += 1;
      } else {
        pointsMap.set(key, {
          x: gridX,
          y: gridY,
          value: 1,
          type: event.type as 'click' | 'move' | 'scroll',
        });
      }
    });

    return Array.from(pointsMap.values());
  }

  /**
   * Obtenir les statistiques de heatmap pour une page
   */
  async getHeatmapStats(userId: string, pageUrl: string) {
    const [totalClicks, totalMoves, totalScrolls, uniqueSessions, deviceBreakdown] =
      await Promise.all([
        this.prisma.heatmapEvent.count({
          where: { userId, pageUrl, type: 'click' },
        }),
        this.prisma.heatmapEvent.count({
          where: { userId, pageUrl, type: 'move' },
        }),
        this.prisma.heatmapEvent.count({
          where: { userId, pageUrl, type: 'scroll' },
        }),
        this.prisma.heatmapEvent.findMany({
          where: { userId, pageUrl },
          distinct: ['sessionId'],
          select: { sessionId: true },
        }),
        this.prisma.heatmapEvent.groupBy({
          by: ['deviceType'],
          where: { userId, pageUrl },
          _count: true,
        }),
      ]);

    // Calculer les zones les plus cliquées
    const topElements = await this.prisma.heatmapEvent.groupBy({
      by: ['element'],
      where: {
        userId,
        pageUrl,
        type: 'click',
        element: { not: null },
      },
      _count: true,
      orderBy: {
        _count: {
          element: 'desc',
        },
      },
      take: 10,
    });

    return {
      totalClicks,
      totalMoves,
      totalScrolls,
      totalEvents: totalClicks + totalMoves + totalScrolls,
      uniqueSessions: uniqueSessions.length,
      deviceBreakdown: deviceBreakdown.map((d) => ({
        deviceType: d.deviceType,
        count: d._count,
      })),
      topClickedElements: topElements.map((e) => ({
        element: e.element,
        clicks: e._count,
      })),
    };
  }

  /**
   * Obtenir toutes les pages avec heatmap data pour un utilisateur
   */
  async getHeatmapPages(userId: string) {
    const pages = await this.prisma.heatmapEvent.findMany({
      where: { userId },
      distinct: ['pageUrl'],
      select: {
        pageUrl: true,
        _count: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return pages.map((p) => ({
      url: p.pageUrl,
      eventsCount: (p._count as any).id || 0,
    }));
  }

  /**
   * Supprimer les anciennes données de heatmap (cleanup)
   */
  async cleanupOldHeatmapData(daysToKeep: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.heatmapEvent.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return {
      deleted: result.count,
      cutoffDate,
    };
  }

  /**
   * Obtenir la profondeur de scroll moyenne pour une page
   */
  async getScrollDepth(userId: string, pageUrl: string) {
    const scrollEvents = await this.prisma.heatmapEvent.findMany({
      where: {
        userId,
        pageUrl,
        type: 'scroll',
      },
      select: {
        y: true,
        screenHeight: true,
        sessionId: true,
      },
    });

    if (scrollEvents.length === 0) {
      return {
        averageScrollDepth: 0,
        maxScrollDepth: 0,
        scrollReachPercentages: {
          '25%': 0,
          '50%': 0,
          '75%': 0,
          '100%': 0,
        },
      };
    }

    // Calculer par session
    const sessionScrolls = new Map<string, number>();

    scrollEvents.forEach((event) => {
      const depth = (event.y / event.screenHeight) * 100;
      const current = sessionScrolls.get(event.sessionId) || 0;
      sessionScrolls.set(event.sessionId, Math.max(current, depth));
    });

    const depths = Array.from(sessionScrolls.values());
    const avgDepth = depths.reduce((a, b) => a + b, 0) / depths.length;
    const maxDepth = Math.max(...depths);

    // Calculer le % d'utilisateurs qui ont atteint chaque niveau
    const totalSessions = depths.length;
    const reach25 = depths.filter((d) => d >= 25).length / totalSessions;
    const reach50 = depths.filter((d) => d >= 50).length / totalSessions;
    const reach75 = depths.filter((d) => d >= 75).length / totalSessions;
    const reach100 = depths.filter((d) => d >= 100).length / totalSessions;

    return {
      averageScrollDepth: Math.round(avgDepth),
      maxScrollDepth: Math.round(maxDepth),
      scrollReachPercentages: {
        '25%': Math.round(reach25 * 100),
        '50%': Math.round(reach50 * 100),
        '75%': Math.round(reach75 * 100),
        '100%': Math.round(reach100 * 100),
      },
    };
  }
}
