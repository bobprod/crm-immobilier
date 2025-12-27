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
    this.iv = Buffer.alloc(16, 0); // IV fixe (en prod, utiliser un IV aléatoire stocké avec les données)
  }

  /**
   * Récupérer les clés d'intégration pour un tenant
   */
  async getKeys(tenantId: string) {
    const keys = await this.prisma.integrationKeys.findUnique({
      where: { tenantId },
    });

    if (!keys) {
      return null;
    }

    // Décrypter les clés sensibles
    return {
      ...keys,
      serpApiKey: keys.serpApiKey ? this.decrypt(keys.serpApiKey) : null,
      firecrawlKey: keys.firecrawlKey ? this.decrypt(keys.firecrawlKey) : null,
      picaAiKey: keys.picaAiKey ? this.decrypt(keys.picaAiKey) : null,
      googleApiKey: keys.googleApiKey ? this.decrypt(keys.googleApiKey) : null,
    };
  }

  /**
   * Récupérer une clé spécifique
   */
  async getKey(tenantId: string, keyName: 'serpApiKey' | 'firecrawlKey' | 'picaAiKey' | 'googleApiKey'): Promise<string | null> {
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
  }

  /**
   * Définir ou mettre à jour les clés d'intégration
   */
  async setKeys(
    tenantId: string,
    keys: {
      serpApiKey?: string;
      firecrawlKey?: string;
      picaAiKey?: string;
      googleApiKey?: string;
      customKeys?: Record<string, any>;
    },
  ) {
    const existing = await this.prisma.integrationKeys.findUnique({
      where: { tenantId },
    });

    // Encrypter les clés sensibles
    const encryptedKeys = {
      serpApiKey: keys.serpApiKey ? this.encrypt(keys.serpApiKey) : undefined,
      firecrawlKey: keys.firecrawlKey ? this.encrypt(keys.firecrawlKey) : undefined,
      picaAiKey: keys.picaAiKey ? this.encrypt(keys.picaAiKey) : undefined,
      googleApiKey: keys.googleApiKey ? this.encrypt(keys.googleApiKey) : undefined,
      customKeys: keys.customKeys,
    };

    if (existing) {
      return this.prisma.integrationKeys.update({
        where: { tenantId },
        data: encryptedKeys,
      });
    }

    return this.prisma.integrationKeys.create({
      data: {
        tenantId,
        ...encryptedKeys,
      },
    });
  }

  /**
   * Supprimer une clé spécifique
   */
  async deleteKey(tenantId: string, keyName: 'serpApiKey' | 'firecrawlKey' | 'picaAiKey' | 'googleApiKey') {
    return this.prisma.integrationKeys.update({
      where: { tenantId },
      data: {
        [keyName]: null,
      },
    });
  }

  /**
   * Supprimer toutes les clés d'un tenant
   */
  async deleteAllKeys(tenantId: string) {
    return this.prisma.integrationKeys.delete({
      where: { tenantId },
    });
  }

  /**
   * Vérifier si une clé existe et est valide
   */
  async hasValidKey(tenantId: string, keyName: 'serpApiKey' | 'firecrawlKey' | 'picaAiKey' | 'googleApiKey'): Promise<boolean> {
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
      firecrawlKey: 'FIRECRAWL_API_KEY',
      picaAiKey: 'PICA_AI_KEY',
      googleApiKey: 'GOOGLE_API_KEY',
    };

    const envVarName = envMap[keyName];
    return envVarName ? process.env[envVarName] || null : null;
  }
}
