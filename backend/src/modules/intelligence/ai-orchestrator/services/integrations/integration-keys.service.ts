import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/database/prisma.service';
import * as crypto from 'crypto';

/**
 * Service de gestion des clés d'intégration externes
 *
 * Gère les clés API pour SerpAPI, Firecrawl, Pica.AI, Google, etc.
 * avec encryption/decryption pour la sécurité
 */
@Injectable()
export class IntegrationKeysService {
  private readonly logger = new Logger(IntegrationKeysService.name);
  private readonly algorithm = 'aes-256-cbc';
  private readonly encryptionKey: Buffer;
  private readonly iv: Buffer;

  constructor(private readonly prisma: PrismaService) {
    // Clé de chiffrement depuis l'environnement (DOIT être en .env)
    const key = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-me-32chars';

    // Créer une clé de 32 bytes pour AES-256
    this.encryptionKey = crypto.scryptSync(key, 'salt', 32);
    this.iv = Buffer.alloc(16, 0);

    this.logger.log('IntegrationKeysService initialized');
    this.logger.log(`Prisma instance: ${prisma ? 'OK' : 'UNDEFINED'}`);
    if (prisma) {
      this.logger.log(`Prisma.users: ${prisma.users ? 'OK' : 'UNDEFINED'}`);
    }
  }

  /**
   * Récupérer les clés d'intégration pour un tenant
   */
  async getKeys(tenantId: string) {
    try {
      this.logger.debug(`Getting keys for tenant: ${tenantId}`);

      // Chercher l'agence du tenant
      const user = await this.prisma.users.findUnique({
        where: { id: tenantId },
        select: { agencyId: true },
      });

      if (!user) {
        this.logger.warn(`User ${tenantId} not found`);
        return null;
      }

      if (!user.agencyId) {
        this.logger.warn(`User ${tenantId} has no agency`);
        return null;
      }

      const keys = await this.prisma.agencyApiKeys.findUnique({
        where: { agencyId: user.agencyId },
      });

      if (!keys) {
        this.logger.warn(`No API keys found for agency ${user.agencyId}`);
        return null;
      }

      // Décrypter les clés sensibles
      return {
        ...keys,
        serpApiKey: keys.serpApiKey ? this.decrypt(keys.serpApiKey) : null,
        firecrawlApiKey: keys.firecrawlApiKey ? this.decrypt(keys.firecrawlApiKey) : null,
        picaApiKey: keys.picaApiKey ? this.decrypt(keys.picaApiKey) : null,
        geminiApiKey: keys.geminiApiKey ? this.decrypt(keys.geminiApiKey) : null,
      };
    } catch (error) {
      this.logger.error('Failed to get keys:', error.message);
      this.logger.error('Stack:', error.stack);
      return null;
    }
  }

  /**
   * Récupérer une clé spécifique (avec fallback sur l'environnement)
   */
  async getKey(tenantId: string, keyName: 'serpApiKey' | 'firecrawlApiKey' | 'picaApiKey' | 'geminiApiKey'): Promise<string | null> {
    try {
      const keys = await this.getKeys(tenantId);
      if (!keys) {
        // Fallback : essayer les variables d'environnement
        return this.getFallbackKey(keyName);
      }

      const key = keys[keyName];

      // Si pas de clé pour le tenant, essayer l'env
      if (!key) {
        return this.getFallbackKey(keyName);
      }

      return key;
    } catch (error) {
      this.logger.error(`Failed to get key ${keyName}:`, error.message);
      // Fallback absolu en cas d'erreur
      return this.getFallbackKey(keyName);
    }
  }

  /**
   * Définir ou mettre à jour les clés d'intégration
   */
  async setKeys(
    tenantId: string,
    keys: {
      serpApiKey?: string;
      firecrawlApiKey?: string;
      picaApiKey?: string;
      geminiApiKey?: string;
      customKeys?: Record<string, any>;
    },
  ) {
    try {
      // Chercher les clés de l'agence du tenant
      const user = await this.prisma.users.findUnique({
        where: { id: tenantId },
        select: { agencyId: true },
      });

      if (!user || !user.agencyId) {
        throw new Error('User or agency not found');
      }

      const existing = await this.prisma.agencyApiKeys.findUnique({
        where: { agencyId: user.agencyId },
      });

      // Encrypter les clés sensibles
      const encryptedKeys = {
        serpApiKey: keys.serpApiKey ? this.encrypt(keys.serpApiKey) : undefined,
        firecrawlApiKey: keys.firecrawlApiKey ? this.encrypt(keys.firecrawlApiKey) : undefined,
        picaApiKey: keys.picaApiKey ? this.encrypt(keys.picaApiKey) : undefined,
        geminiApiKey: keys.geminiApiKey ? this.encrypt(keys.geminiApiKey) : undefined,
        customKeys: keys.customKeys,
      };

      if (existing) {
        return this.prisma.agencyApiKeys.update({
          where: { agencyId: user.agencyId },
          data: encryptedKeys,
        });
      }

      return this.prisma.agencyApiKeys.create({
        data: {
          agencyId: user.agencyId,
          ...encryptedKeys,
        },
      });
    } catch (error) {
      this.logger.error('Failed to set keys:', error);
      throw error;
    }
  }

  /**
   * Supprimer une clé spécifique
   */
  async deleteKey(tenantId: string, keyName: 'serpApiKey' | 'firecrawlApiKey' | 'picaApiKey' | 'geminiApiKey') {
    try {
      const user = await this.prisma.users.findUnique({
        where: { id: tenantId },
        select: { agencyId: true },
      });

      if (!user || !user.agencyId) {
        throw new Error('User or agency not found');
      }

      return this.prisma.agencyApiKeys.update({
        where: { agencyId: user.agencyId },
        data: {
          [keyName]: null,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to delete key ${keyName}:`, error);
      throw error;
    }
  }

  /**
   * Supprimer toutes les clés d'un tenant
   */
  async deleteAllKeys(tenantId: string) {
    try {
      const user = await this.prisma.users.findUnique({
        where: { id: tenantId },
        select: { agencyId: true },
      });

      if (!user || !user.agencyId) {
        throw new Error('User or agency not found');
      }

      return this.prisma.agencyApiKeys.delete({
        where: { agencyId: user.agencyId },
      });
    } catch (error) {
      this.logger.error('Failed to delete all keys:', error);
      throw error;
    }
  }

  /**
   * Vérifier si une clé existe et est valide
   */
  async hasValidKey(tenantId: string, keyName: 'serpApiKey' | 'firecrawlApiKey' | 'picaApiKey' | 'geminiApiKey'): Promise<boolean> {
    const key = await this.getKey(tenantId, keyName);
    return key !== null && key.length > 0;
  }

  // ========================================
  // ENCRYPTION / DECRYPTION
  // ========================================

  /**
   * Encrypter une clé API
   */
  private encrypt(text: string): string {
    try {
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, this.iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      this.logger.error('Encryption failed:', error);
      throw new Error('Failed to encrypt key');
    }
  }

  /**
   * Décrypter une clé API
   */
  private decrypt(encrypted: string): string {
    try {
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, this.iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed:', error);
      throw new Error('Failed to decrypt key');
    }
  }

  /**
   * Fallback sur les variables d'environnement
   */
  private getFallbackKey(keyName: string): string | null {
    const envMap: Record<string, string> = {
      serpApiKey: 'SERPAPI_KEY',
      firecrawlApiKey: 'FIRECRAWL_API_KEY',
      picaApiKey: 'PICA_AI_KEY',
      geminiApiKey: 'GEMINI_API_KEY',
    };

    const envVarName = envMap[keyName];
    if (!envVarName) {
      this.logger.warn(`No fallback mapping for key: ${keyName}`);
      return null;
    }

    const value = process.env[envVarName];
    if (value) {
      this.logger.debug(`Using fallback for ${keyName} from ${envVarName}`);
    }
    return value || null;
  }
}
