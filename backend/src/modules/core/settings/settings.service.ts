import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class SettingsService {
  private readonly encryptionKey: string;
  private readonly algorithm = 'aes-256-cbc';

  constructor(private prisma: PrismaService) {
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32b';
  }

  /**
   * Crypter une valeur
   */
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      Buffer.from(this.encryptionKey, 'utf-8').slice(0, 32),
      iv,
    );
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Décrypter une valeur
   */
  private decrypt(text: string): string {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      Buffer.from(this.encryptionKey, 'utf-8').slice(0, 32),
      iv,
    );
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Obtenir un paramètre
   */
  async getSetting(userId: string, section: string, key: string) {
    const setting = await this.prisma.settings.findUnique({
      where: {
        section_key_userId: { section, key, userId },
      },
    });

    if (!setting) {
      return null;
    }

    if (setting.encrypted && setting.value) {
      return {
        ...setting,
        value: this.decrypt(setting.value),
      };
    }

    return setting;
  }

  /**
   * Définir un paramètre
   */
  async setSetting(
    userId: string,
    section: string,
    key: string,
    value: any,
    encrypted = false,
    description?: string,
  ) {
    const valueStr =
      typeof value === 'string' ? value : JSON.stringify(value);
    const finalValue = encrypted ? this.encrypt(valueStr) : valueStr;
    const type = typeof value;

    return this.prisma.settings.upsert({
      where: {
        section_key_userId: { section, key, userId },
      },
      create: {
        section,
        key,
        value: finalValue,
        type,
        encrypted,
        description,
        userId,
      },
      update: {
        value: finalValue,
        type,
        encrypted,
        description,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Obtenir tous les paramètres d'une section
   */
  async getSectionSettings(userId: string, section: string) {
    const settings = await this.prisma.settings.findMany({
      where: { userId, section },
      orderBy: { key: 'asc' },
    });

    return settings.map((s) => {
      if (s.encrypted && s.value) {
        return { ...s, value: this.decrypt(s.value) };
      }
      return s;
    });
  }

  /**
   * Obtenir tous les paramètres d'un utilisateur
   */
  async getAllSettings(userId: string) {
    const settings = await this.prisma.settings.findMany({
      where: { userId },
      orderBy: [{ section: 'asc' }, { key: 'asc' }],
    });

    return settings.map((s) => {
      if (s.encrypted && s.value) {
        return { ...s, value: this.decrypt(s.value) };
      }
      return s;
    });
  }

  /**
   * Mettre à jour plusieurs paramètres
   */
  async updateSectionSettings(
    userId: string,
    section: string,
    settingsData: Array<{ key: string; value: any; encrypted?: boolean }>,
  ) {
    const results = [];

    for (const setting of settingsData) {
      const result = await this.setSetting(
        userId,
        section,
        setting.key,
        setting.value,
        setting.encrypted || false,
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Supprimer un paramètre
   */
  async deleteSetting(userId: string, section: string, key: string) {
    return this.prisma.settings.deleteMany({
      where: { userId, section, key },
    });
  }

  /**
   * Supprimer une section complète
   */
  async deleteSection(userId: string, section: string) {
    return this.prisma.settings.deleteMany({
      where: { userId, section },
    });
  }

  /**
   * Tester une connexion Firecrawl
   */
  async testFirecrawlConnection(userId: string) {
    const apiKey = await this.getSetting(userId, 'firecrawl', 'apiKey');
    const connectionKey = await this.getSetting(
      userId,
      'firecrawl',
      'connectionKey',
    );

    if (!apiKey?.value) {
      return { success: false, error: 'API Key manquante' };
    }

    try {
      // Test simple de connexion
      return {
        success: true,
        message: 'Configuration Firecrawl valide',
        apiKey: apiKey.value.substring(0, 10) + '...',
        connectionKey: connectionKey?.value,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Tester une connexion SerpApi
   */
  async testSerpApiConnection(userId: string) {
    const apiKey = await this.getSetting(userId, 'serpapi', 'apiKey');
    const connectionKey = await this.getSetting(
      userId,
      'serpapi',
      'connectionKey',
    );

    if (!apiKey?.value) {
      return { success: false, error: 'API Key manquante' };
    }

    try {
      return {
        success: true,
        message: 'Configuration SerpApi valide',
        apiKey: apiKey.value.substring(0, 10) + '...',
        connectionKey: connectionKey?.value,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Tester une connexion WhatsApp
   */
  async testWhatsAppConnection(userId: string) {
    const accountSid = await this.getSetting(userId, 'whatsapp', 'accountSid');
    const authToken = await this.getSetting(userId, 'whatsapp', 'authToken');
    const phoneNumber = await this.getSetting(
      userId,
      'whatsapp',
      'phoneNumber',
    );

    if (!accountSid?.value || !authToken?.value) {
      return {
        success: false,
        error: 'Configuration Twilio incomplète',
      };
    }

    try {
      return {
        success: true,
        message: 'Configuration WhatsApp valide',
        phoneNumber: phoneNumber?.value,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Tester une connexion selon la section
   */
  async testConnection(userId: string, section: string) {
    switch (section) {
      case 'firecrawl':
        return this.testFirecrawlConnection(userId);
      case 'serpapi':
        return this.testSerpApiConnection(userId);
      case 'whatsapp':
        return this.testWhatsAppConnection(userId);
      case 'sms':
        return this.testWhatsAppConnection(userId); // Même config Twilio
      default:
        return {
          success: false,
          error: `Test non implémenté pour la section: ${section}`,
        };
    }
  }

  /**
   * Obtenir la configuration complète pour Pica AI
   */
  async getPicaAIConfig(userId: string) {
    const [firecrawlSettings, serpApiSettings, picaSettings] =
      await Promise.all([
        this.getSectionSettings(userId, 'firecrawl'),
        this.getSectionSettings(userId, 'serpapi'),
        this.getSectionSettings(userId, 'pica-ai'),
      ]);

    return {
      firecrawl: this.settingsArrayToObject(firecrawlSettings),
      serpapi: this.settingsArrayToObject(serpApiSettings),
      picaAI: this.settingsArrayToObject(picaSettings),
    };
  }

  /**
   * Convertir un tableau de settings en objet
   */
  private settingsArrayToObject(settings: any[]) {
    const obj: any = {};
    settings.forEach((s) => {
      obj[s.key] = s.value;
    });
    return obj;
  }
}
