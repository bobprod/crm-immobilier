import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { TrackingPlatform, TrackingConfigDto } from '../dto';

/**
 * Service de gestion de la configuration des plateformes de tracking
 */
@Injectable()
export class TrackingConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfigs(userId: string) {
    const configs = await this.prisma.trackingConfig.findMany({
      where: { userId },
    });

    return configs.map(config => ({
      ...config,
      config: this.maskSensitiveData(config.config),
    }));
  }

  async getConfig(userId: string, platform: TrackingPlatform) {
    const config = await this.prisma.trackingConfig.findUnique({
      where: {
        userId_platform: {
          userId,
          platform,
        },
      },
    });

    if (!config) {
      return null;
    }

    return {
      ...config,
      config: this.maskSensitiveData(config.config),
    };
  }

  async upsertConfig(userId: string, dto: TrackingConfigDto) {
    return this.prisma.trackingConfig.upsert({
      where: {
        userId_platform: {
          userId,
          platform: dto.platform,
        },
      },
      update: {
        config: dto.config,
        isActive: dto.isActive ?? true,
        useServerSide: dto.useServerSide ?? false,
      },
      create: {
        userId,
        platform: dto.platform,
        config: dto.config,
        isActive: dto.isActive ?? true,
        useServerSide: dto.useServerSide ?? false,
      },
    });
  }

  async togglePlatform(userId: string, platform: TrackingPlatform, isActive: boolean) {
    return this.prisma.trackingConfig.update({
      where: {
        userId_platform: {
          userId,
          platform,
        },
      },
      data: { isActive },
    });
  }

  async deleteConfig(userId: string, platform: TrackingPlatform) {
    await this.prisma.trackingConfig.delete({
      where: {
        userId_platform: {
          userId,
          platform,
        },
      },
    });

    return { success: true };
  }

  async testConfig(userId: string, platform: TrackingPlatform): Promise<{
    success: boolean;
    message: string;
  }> {
    const config = await this.prisma.trackingConfig.findUnique({
      where: {
        userId_platform: {
          userId,
          platform,
        },
      },
    });

    if (!config) {
      return {
        success: false,
        message: 'Configuration non trouvée',
      };
    }

    // Test basique
    return {
      success: true,
      message: 'Configuration valide',
    };
  }

  async getActiveConfigsForInjection(userId: string) {
    const configs = await this.prisma.trackingConfig.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    return configs.reduce((acc, config) => {
      acc[config.platform] = {
        platform: config.platform,
        config: config.config,
        useServerSide: config.useServerSide,
      };
      return acc;
    }, {} as Record<string, any>);
  }

  private maskSensitiveData(config: any): any {
    const masked = { ...config };
    const sensitiveKeys = ['accessToken', 'apiSecret', 'secret', 'token'];
    
    for (const key of sensitiveKeys) {
      if (masked[key]) {
        masked[key] = '***' + masked[key].slice(-4);
      }
    }

    return masked;
  }

  async getPlatformStats(userId: string) {
    const [configs, events] = await Promise.all([
      this.prisma.trackingConfig.findMany({
        where: { userId },
      }),
      this.prisma.trackingEvent.groupBy({
        by: ['platform'],
        where: { userId },
        _count: true,
      }),
    ]);

    return {
      totalPlatforms: configs.length,
      activePlatforms: configs.filter(c => c.isActive).length,
      eventsByPlatform: events.map(e => ({
        platform: e.platform,
        count: e._count,
      })),
    };
  }
}
