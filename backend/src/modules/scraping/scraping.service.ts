import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Get scraping configuration for a user
   */
  async getScrapingConfig(userId: string) {
    try {
      this.logger.log(`Fetching scraping config for user ${userId}`);
      
      // Get configuration from database
      const config = await this.prisma.settings.findFirst({
        where: {
          userId: userId,
          key: 'scraping_config',
        },
      });

      return config?.value || {
        pica: { enabled: false, apiKey: '', rateLimit: 100 },
        serpApi: { enabled: false, apiKey: '', rateLimit: 100 },
        scrapingBee: { enabled: false, apiKey: '', rateLimit: 50 },
        browserless: { enabled: false, apiKey: '', endpoint: 'https://chrome.browserless.io' },
      };
    } catch (error) {
      this.logger.error(`Error fetching scraping config: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update scraping configuration for a user
   */
  async updateScrapingConfig(userId: string, config: any) {
    try {
      this.logger.log(`Updating scraping config for user ${userId}`);
      
      // Upsert configuration in database
      const result = await this.prisma.settings.upsert({
        where: {
          userId_key: {
            userId: userId,
            key: 'scraping_config',
          },
        },
        update: {
          value: config,
        },
        create: {
          userId: userId,
          key: 'scraping_config',
          value: config,
        },
      });

      return result;
    } catch (error) {
      this.logger.error(`Error updating scraping config: ${error.message}`);
      throw error;
    }
  }

  /**
   * Test a scraping provider connection
   */
  async testProvider(userId: string, provider: string) {
    try {
      this.logger.log(`Testing provider ${provider} for user ${userId}`);
      
      // Get provider configuration
      const config = await this.getScrapingConfig(userId);
      const providerConfig = config[provider];

      if (!providerConfig || !providerConfig.enabled) {
        return { success: false, message: 'Provider not configured or not enabled' };
      }

      // Test basic connectivity (simplified for now)
      return { success: true, message: `Provider ${provider} is configured` };
    } catch (error) {
      this.logger.error(`Error testing provider: ${error.message}`);
      return { success: false, message: error.message };
    }
  }
}
