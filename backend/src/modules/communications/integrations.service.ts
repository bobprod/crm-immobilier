import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import * as crypto from 'crypto';

/**
 * 🔐 Service de gestion des intégrations API utilisateur
 *
 * Permet à chaque utilisateur de configurer ses propres clés API pour:
 * - Email (Resend, SendGrid)
 * - SMS/WhatsApp (Twilio)
 * - Push (Firebase)
 *
 * Multi-tenant: Chaque user/agence a ses propres credentials
 * Sécurité: Clés chiffrées en base de données
 */

export interface IntegrationConfig {
  // Resend
  resendApiKey?: string;

  // SendGrid
  sendgridApiKey?: string;

  // Twilio
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  twilioWhatsappNumber?: string;

  // Firebase (Push)
  firebaseServerKey?: string;
  firebaseProjectId?: string;
}

export interface CreateIntegrationDto {
  provider: 'resend' | 'sendgrid' | 'twilio' | 'firebase';
  config: IntegrationConfig;
  label?: string;
  monthlyQuota?: number;
}

export interface UpdateIntegrationDto {
  config?: IntegrationConfig;
  label?: string;
  monthlyQuota?: number;
  isActive?: boolean;
}

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);
  private readonly encryptionKey: string;

  constructor(private prisma: PrismaService) {
    // Clé de chiffrement (doit être dans .env en production)
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'your-32-char-secret-key-change-me!!!';

    if (this.encryptionKey.length !== 32) {
      this.logger.warn('⚠️ ENCRYPTION_KEY should be exactly 32 characters');
    }
  }

  /**
   * 🔐 Chiffrer la configuration
   */
  private encryptConfig(config: IntegrationConfig): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.encryptionKey), iv);

      let encrypted = cipher.update(JSON.stringify(config), 'utf8', 'hex');
      encrypted += cipher.final('hex');

      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      this.logger.error(`Encryption error: ${error.message}`);
      throw new Error('Failed to encrypt configuration');
    }
  }

  /**
   * 🔓 Déchiffrer la configuration
   */
  private decryptConfig(encryptedConfig: string): IntegrationConfig {
    try {
      const parts = encryptedConfig.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];

      const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.encryptionKey), iv);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      this.logger.error(`Decryption error: ${error.message}`);
      throw new Error('Failed to decrypt configuration');
    }
  }

  /**
   * ➕ Créer une intégration
   */
  async createIntegration(userId: string, data: CreateIntegrationDto) {
    try {
      // Chiffrer la config
      const encryptedConfig = this.encryptConfig(data.config);

      const integration = await this.prisma.userIntegration.create({
        data: {
          userId,
          provider: data.provider,
          config: encryptedConfig as any,
          label: data.label,
          monthlyQuota: data.monthlyQuota,
          isActive: true,
        },
      });

      this.logger.log(`✅ Integration ${data.provider} created for user ${userId}`);

      // Retourner sans les clés sensibles
      return this.sanitizeIntegration(integration);
    } catch (error) {
      this.logger.error(`Failed to create integration: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📝 Mettre à jour une intégration
   */
  async updateIntegration(userId: string, provider: string, data: UpdateIntegrationDto) {
    const existing = await this.prisma.userIntegration.findUnique({
      where: { userId_provider: { userId, provider } },
    });

    if (!existing) {
      throw new NotFoundException(`Integration ${provider} not found`);
    }

    const updateData: any = {};

    // Mise à jour de la config (chiffrement)
    if (data.config) {
      updateData.config = this.encryptConfig(data.config);
    }

    if (data.label !== undefined) updateData.label = data.label;
    if (data.monthlyQuota !== undefined) updateData.monthlyQuota = data.monthlyQuota;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await this.prisma.userIntegration.update({
      where: { userId_provider: { userId, provider } },
      data: updateData,
    });

    this.logger.log(`✅ Integration ${provider} updated for user ${userId}`);

    return this.sanitizeIntegration(updated);
  }

  /**
   * 🗑️ Supprimer une intégration
   */
  async deleteIntegration(userId: string, provider: string) {
    await this.prisma.userIntegration.delete({
      where: { userId_provider: { userId, provider } },
    });

    this.logger.log(`✅ Integration ${provider} deleted for user ${userId}`);
  }

  /**
   * 📋 Lister les intégrations d'un utilisateur
   */
  async getUserIntegrations(userId: string) {
    const integrations = await this.prisma.userIntegration.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return integrations.map((i) => this.sanitizeIntegration(i));
  }

  /**
   * 🔍 Récupérer une intégration spécifique
   */
  async getUserIntegration(userId: string, provider: string) {
    const integration = await this.prisma.userIntegration.findUnique({
      where: { userId_provider: { userId, provider } },
    });

    if (!integration) {
      throw new NotFoundException(`Integration ${provider} not found`);
    }

    return this.sanitizeIntegration(integration);
  }

  /**
   * 🔑 Récupérer la config déchiffrée (usage interne uniquement)
   */
  async getDecryptedConfig(userId: string, provider: string): Promise<IntegrationConfig> {
    const integration = await this.prisma.userIntegration.findUnique({
      where: { userId_provider: { userId, provider } },
    });

    if (!integration || !integration.isActive) {
      throw new NotFoundException(`Active integration ${provider} not found`);
    }

    return this.decryptConfig(integration.config as string);
  }

  /**
   * 🧪 Tester une intégration
   */
  async testIntegration(userId: string, provider: string): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      const config = await this.getDecryptedConfig(userId, provider);

      let testResult: { success: boolean; message?: string; error?: string };

      switch (provider) {
        case 'resend':
          testResult = await this.testResend(config);
          break;

        case 'sendgrid':
          testResult = await this.testSendGrid(config);
          break;

        case 'twilio':
          testResult = await this.testTwilio(config);
          break;

        case 'firebase':
          testResult = { success: false, error: 'Firebase testing not implemented' };
          break;

        default:
          testResult = { success: false, error: 'Unknown provider' };
      }

      // Mettre à jour le statut du test
      await this.prisma.userIntegration.update({
        where: { userId_provider: { userId, provider } },
        data: {
          lastTestedAt: new Date(),
          lastTestStatus: testResult.success ? 'success' : 'failed',
          lastTestError: testResult.error || null,
        },
      });

      return testResult as any;
    } catch (error) {
      this.logger.error(`Test integration failed: ${error.message}`);
      return {
        success: false,
        message: 'Test failed',
        error: error.message,
      };
    }
  }

  /**
   * 🧪 Tester Resend
   */
  private async testResend(config: IntegrationConfig): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!config.resendApiKey) {
      return { success: false, error: 'Resend API key not configured' };
    }

    try {
      // Appel minimal à l'API Resend pour tester la clé
      const response = await fetch('https://api.resend.com/emails', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.resendApiKey}`,
        },
      });

      if (response.status === 401) {
        return { success: false, error: 'Invalid API key' };
      }

      return {
        success: true,
        message: '✅ Resend API key is valid',
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 🧪 Tester SendGrid
   */
  private async testSendGrid(config: IntegrationConfig): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!config.sendgridApiKey) {
      return { success: false, error: 'SendGrid API key not configured' };
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/scopes', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.sendgridApiKey}`,
        },
      });

      if (response.status === 401) {
        return { success: false, error: 'Invalid API key' };
      }

      return {
        success: true,
        message: '✅ SendGrid API key is valid',
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 🧪 Tester Twilio
   */
  private async testTwilio(config: IntegrationConfig): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!config.twilioAccountSid || !config.twilioAuthToken) {
      return { success: false, error: 'Twilio credentials not configured' };
    }

    try {
      const credentials = Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString('base64');

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}.json`, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });

      if (response.status === 401) {
        return { success: false, error: 'Invalid credentials' };
      }

      const data = await response.json();

      return {
        success: true,
        message: `✅ Twilio account ${data.friendly_name} is valid`,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 🧹 Nettoyer les données sensibles avant de retourner
   */
  private sanitizeIntegration(integration: any) {
    return {
      id: integration.id,
      provider: integration.provider,
      label: integration.label,
      isActive: integration.isActive,
      monthlyQuota: integration.monthlyQuota,
      currentUsage: integration.currentUsage,
      lastResetAt: integration.lastResetAt,
      lastTestedAt: integration.lastTestedAt,
      lastTestStatus: integration.lastTestStatus,
      lastTestError: integration.lastTestError,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
      // Ne PAS retourner config (contient les clés)
      hasConfig: !!integration.config,
    };
  }

  /**
   * 📊 Incrémenter l'usage
   */
  async incrementUsage(userId: string, provider: string, count: number = 1) {
    await this.prisma.userIntegration.update({
      where: { userId_provider: { userId, provider } },
      data: {
        currentUsage: {
          increment: count,
        },
      },
    });
  }

  /**
   * 🔄 Réinitialiser l'usage mensuel
   */
  async resetMonthlyUsage() {
    const now = new Date();
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const result = await this.prisma.userIntegration.updateMany({
      where: {
        lastResetAt: {
          lt: lastMonth,
        },
      },
      data: {
        currentUsage: 0,
        lastResetAt: now,
      },
    });

    this.logger.log(`🔄 Reset monthly usage for ${result.count} integrations`);
    return result;
  }
}
