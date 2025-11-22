import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly cache = new Map<string, CacheEntry<any>>();

  // TODO: Intégrer Redis pour production
  // constructor(private redis: Redis) {}

  constructor(private prisma: PrismaService) {}

  /**
   * Récupérer une valeur du cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // TODO: Utiliser Redis en production
      // const value = await this.redis.get(key);
      // return value ? JSON.parse(value) : null;

      const entry = this.cache.get(key);

      if (!entry) {
        return null;
      }

      // Vérifier si le cache est expiré
      if (Date.now() > entry.expiresAt) {
        this.cache.delete(key);
        return null;
      }

      this.logger.debug(`Cache hit for key: ${key}`);
      return entry.data as T;
    } catch (error) {
      this.logger.error(`Error getting cache for key ${key}: ${error.message}`);
      return null;
    }
  }

  /**
   * Stocker une valeur dans le cache
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    try {
      // TODO: Utiliser Redis en production
      // await this.redis.setex(key, ttlSeconds, JSON.stringify(value));

      const expiresAt = Date.now() + (ttlSeconds * 1000);
      this.cache.set(key, {
        data: value,
        expiresAt,
      });

      this.logger.debug(`Cached key: ${key} for ${ttlSeconds}s`);
    } catch (error) {
      this.logger.error(`Error setting cache for key ${key}: ${error.message}`);
    }
  }

  /**
   * Supprimer une clé du cache
   */
  async del(key: string): Promise<void> {
    try {
      // TODO: Utiliser Redis en production
      // await this.redis.del(key);

      this.cache.delete(key);
      this.logger.debug(`Deleted cache key: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting cache for key ${key}: ${error.message}`);
    }
  }

  /**
   * Supprimer plusieurs clés par pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      // TODO: Utiliser Redis SCAN en production
      // const keys = await this.redis.keys(pattern);
      // if (keys.length > 0) {
      //   await this.redis.del(...keys);
      // }

      const keysToDelete: string[] = [];
      for (const key of this.cache.keys()) {
        if (key.includes(pattern.replace('*', ''))) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach(key => this.cache.delete(key));
      this.logger.debug(`Deleted ${keysToDelete.length} cache keys matching pattern: ${pattern}`);
    } catch (error) {
      this.logger.error(`Error deleting cache pattern ${pattern}: ${error.message}`);
    }
  }

  /**
   * Vider tout le cache
   */
  async flush(): Promise<void> {
    try {
      // TODO: Utiliser Redis en production
      // await this.redis.flushall();

      this.cache.clear();
      this.logger.log('Cache flushed');
    } catch (error) {
      this.logger.error(`Error flushing cache: ${error.message}`);
    }
  }

  /**
   * Récupérer les statistiques du dashboard avec cache
   */
  async getDashboardStats(userId: string) {
    const cacheKey = `dashboard:stats:${userId}`;

    // Essayer de récupérer du cache
    const cached = await this.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Si pas en cache, calculer les stats
    const stats = await this.calculateDashboardStats(userId);

    // Mettre en cache pour 5 minutes (300 secondes)
    await this.set(cacheKey, stats, 300);

    return stats;
  }

  /**
   * Calculer les statistiques du dashboard
   */
  private async calculateDashboardStats(userId: string) {
    try {
      const [
        activeProspects,
        availableProperties,
        todayAppointments,
        totalMatches,
        activeCampaigns,
        recentActivities,
      ] = await Promise.all([
        // Prospects actifs
        this.prisma.prospect.count({
          where: {
            userId,
            status: { in: ['new', 'contacted', 'qualified'] },
          },
        }),

        // Propriétés disponibles
        this.prisma.property.count({
          where: {
            userId,
            status: 'available',
          },
        }),

        // Rendez-vous aujourd'hui
        this.prisma.appointment.count({
          where: {
            userId,
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        }),

        // Matchings actifs
        this.prisma.matching.count({
          where: {
            userId,
            status: 'active',
          },
        }),

        // Campagnes actives
        this.prisma.campaign.count({
          where: {
            userId,
            status: 'active',
          },
        }),

        // Activités récentes
        this.getRecentActivities(userId),
      ]);

      return {
        activeProspects,
        availableProperties,
        todayAppointments,
        totalMatches,
        activeCampaigns,
        recentActivities,
      };
    } catch (error) {
      this.logger.error(`Error calculating dashboard stats: ${error.message}`);

      // Retourner des valeurs par défaut en cas d'erreur
      return {
        activeProspects: 0,
        availableProperties: 0,
        todayAppointments: 0,
        totalMatches: 0,
        activeCampaigns: 0,
        recentActivities: [],
      };
    }
  }

  /**
   * Récupérer les activités récentes
   */
  private async getRecentActivities(userId: string) {
    try {
      // Récupérer les dernières activités (appointments, prospects, etc.)
      const activities = await this.prisma.activity.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return activities;
    } catch (error) {
      this.logger.error(`Error getting recent activities: ${error.message}`);
      return [];
    }
  }

  /**
   * Invalider le cache du dashboard pour un utilisateur
   */
  async invalidateDashboardCache(userId: string): Promise<void> {
    await this.del(`dashboard:stats:${userId}`);
  }

  /**
   * Récupérer les analytics avec cache
   */
  async getAnalytics(userId: string) {
    const cacheKey = `analytics:${userId}`;

    const cached = await this.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const analytics = await this.calculateAnalytics(userId);
    await this.set(cacheKey, analytics, 600); // Cache 10 minutes

    return analytics;
  }

  /**
   * Calculer les analytics
   */
  private async calculateAnalytics(userId: string) {
    try {
      const [
        totalProspects,
        totalProperties,
        totalRevenue,
        prospectsByStatus,
        propertiesByType,
      ] = await Promise.all([
        this.prisma.prospect.count({ where: { userId } }),
        this.prisma.property.count({ where: { userId } }),
        this.calculateTotalRevenue(userId),
        this.getProspectsByStatus(userId),
        this.getPropertiesByType(userId),
      ]);

      const conversionRate = totalProspects > 0
        ? (prospectsByStatus.converted || 0) / totalProspects * 100
        : 0;

      return {
        totalProspects,
        totalProperties,
        totalRevenue,
        conversionRate,
        prospectsByStatus,
        propertiesByType,
      };
    } catch (error) {
      this.logger.error(`Error calculating analytics: ${error.message}`);
      return {
        totalProspects: 0,
        totalProperties: 0,
        totalRevenue: 0,
        conversionRate: 0,
        prospectsByStatus: {},
        propertiesByType: {},
      };
    }
  }

  private async calculateTotalRevenue(userId: string): Promise<number> {
    try {
      const result = await this.prisma.transaction.aggregate({
        where: { userId, status: 'completed' },
        _sum: { amount: true },
      });
      return result._sum.amount || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getProspectsByStatus(userId: string) {
    try {
      const prospects = await this.prisma.prospect.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      });

      return prospects.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>);
    } catch (error) {
      return {};
    }
  }

  private async getPropertiesByType(userId: string) {
    try {
      const properties = await this.prisma.property.groupBy({
        by: ['type'],
        where: { userId },
        _count: true,
      });

      return properties.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {} as Record<string, number>);
    } catch (error) {
      return {};
    }
  }

  /**
   * Nettoyer les entrées expirées du cache (en mémoire)
   */
  async cleanExpiredEntries(): Promise<void> {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned ${cleaned} expired cache entries`);
    }
  }
}
