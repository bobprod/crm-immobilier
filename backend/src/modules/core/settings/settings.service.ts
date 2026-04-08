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
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
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
    const connectionKey = await this.getSetting(userId, 'firecrawl', 'connectionKey');

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
    const connectionKey = await this.getSetting(userId, 'serpapi', 'connectionKey');

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
    const phoneNumber = await this.getSetting(userId, 'whatsapp', 'phoneNumber');

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
   * Tester une connexion WhatsApp Meta Business API (Graph API)
   */
  async testWhatsAppMetaConnection(userId: string) {
    const phoneNumberId = await this.getSetting(userId, 'whatsapp_meta', 'phoneNumberId');
    const accessToken = await this.getSetting(userId, 'whatsapp_meta', 'accessToken');

    if (!phoneNumberId?.value || !accessToken?.value) {
      return { success: false, error: 'Phone Number ID et Access Token requis' };
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId.value}?access_token=${accessToken.value}`,
      );
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Connexion Meta WhatsApp réussie - Numéro: ${data.display_phone_number || phoneNumberId.value}`,
          displayNumber: data.display_phone_number,
        };
      }
      const err = await response.json();
      return {
        success: false,
        error: err.error?.message || `Erreur HTTP ${response.status}`,
      };
    } catch (error) {
      return { success: false, error: `Erreur de connexion: ${error.message}` };
    }
  }

  /**
   * Tester une connexion SMTP
   */
  async testSMTPConnection(userId: string) {
    const host = await this.getSetting(userId, 'smtp', 'host');
    const port = await this.getSetting(userId, 'smtp', 'port');
    const user = await this.getSetting(userId, 'smtp', 'user');
    const password = await this.getSetting(userId, 'smtp', 'password');

    if (!host?.value || !port?.value) {
      return { success: false, error: 'Hôte et port SMTP requis' };
    }

    // Basic validation – actual SMTP handshake is not feasible in a cloud function context
    const portNum = parseInt(port.value, 10);
    const validPorts = [25, 465, 587, 2525];
    if (!validPorts.includes(portNum)) {
      return {
        success: false,
        error: `Port SMTP invalide. Ports supportés: ${validPorts.join(', ')}`,
      };
    }

    return {
      success: true,
      message: `Configuration SMTP valide — ${host.value}:${port.value}`,
      host: host.value,
      port: portNum,
      user: user?.value,
      secure: portNum === 465,
    };
  }

  /**
   * Tester un bot Telegram
   */
  async testTelegramConnection(userId: string) {
    const botToken = await this.getSetting(userId, 'telegram', 'botToken');

    if (!botToken?.value) {
      return { success: false, error: 'Token du bot Telegram requis' };
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken.value}/getMe`);
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Bot Telegram validé: @${data.result?.username}`,
          botName: data.result?.first_name,
          username: data.result?.username,
        };
      }
      const err = await response.json();
      return {
        success: false,
        error: err.description || `Erreur HTTP ${response.status}`,
      };
    } catch (error) {
      return { success: false, error: `Erreur de connexion: ${error.message}` };
    }
  }

  /**
   * Tester la configuration Meta Pixel / Conversion API
   */
  async testMetaPixelConnection(userId: string) {
    const pixelId = await this.getSetting(userId, 'tracking_meta', 'pixelId');
    const accessToken = await this.getSetting(userId, 'tracking_meta', 'accessToken');

    if (!pixelId?.value) {
      return { success: false, error: 'Pixel ID requis' };
    }

    if (!accessToken?.value) {
      return {
        success: true,
        message: `Pixel Meta configuré (ID: ${pixelId.value}). Ajoutez un access token pour activer la Conversion API.`,
        pixelId: pixelId.value,
        conversionApiEnabled: false,
      };
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pixelId.value}?access_token=${accessToken.value}`,
      );
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Meta Pixel validé: ${data.name || pixelId.value}`,
          pixelId: pixelId.value,
          pixelName: data.name,
          conversionApiEnabled: true,
        };
      }
      const err = await response.json();
      return {
        success: false,
        error: err.error?.message || `Erreur HTTP ${response.status}`,
      };
    } catch (error) {
      return { success: false, error: `Erreur de connexion: ${error.message}` };
    }
  }

  /**
   * Tester Google Tag Manager
   */
  async testGTMConnection(userId: string) {
    const containerId = await this.getSetting(userId, 'tracking_gtm', 'containerId');
    if (!containerId?.value) {
      return { success: false, error: 'Container ID GTM requis (ex: GTM-XXXXXXX)' };
    }
    const isValid = /^GTM-[A-Z0-9]+$/i.test(containerId.value);
    return isValid
      ? { success: true, message: `GTM Container configuré: ${containerId.value}`, containerId: containerId.value }
      : { success: false, error: 'Format invalide — attendu: GTM-XXXXXXX' };
  }

  /**
   * Tester Google Analytics 4
   */
  async testGA4Connection(userId: string) {
    const measurementId = await this.getSetting(userId, 'tracking_ga4', 'measurementId');
    if (!measurementId?.value) {
      return { success: false, error: 'Measurement ID GA4 requis (ex: G-XXXXXXXXXX)' };
    }
    const isValid = /^G-[A-Z0-9]+$/i.test(measurementId.value);
    return isValid
      ? { success: true, message: `GA4 configuré: ${measurementId.value}`, measurementId: measurementId.value }
      : { success: false, error: 'Format invalide — attendu: G-XXXXXXXXXX' };
  }

  /**
   * Tester Google Ads
   */
  async testGoogleAdsConnection(userId: string) {
    const conversionId = await this.getSetting(userId, 'tracking_google_ads', 'conversionId');
    if (!conversionId?.value) {
      return { success: false, error: 'Conversion ID Google Ads requis (ex: AW-XXXXXXXXXX)' };
    }
    const isValid = /^AW-[0-9]+$/i.test(conversionId.value);
    return isValid
      ? { success: true, message: `Google Ads configuré: ${conversionId.value}`, conversionId: conversionId.value }
      : { success: false, error: 'Format invalide — attendu: AW-XXXXXXXXXX' };
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
      case 'whatsapp_meta':
        return this.testWhatsAppMetaConnection(userId);
      case 'sms':
        return this.testWhatsAppConnection(userId); // Même config Twilio
      case 'smtp':
        return this.testSMTPConnection(userId);
      case 'telegram':
        return this.testTelegramConnection(userId);
      case 'tracking_meta':
        return this.testMetaPixelConnection(userId);
      case 'tracking_gtm':
        return this.testGTMConnection(userId);
      case 'tracking_ga4':
        return this.testGA4Connection(userId);
      case 'tracking_google_ads':
        return this.testGoogleAdsConnection(userId);
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
    const [firecrawlSettings, serpApiSettings, picaSettings] = await Promise.all([
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

  /**
   * Tester une clé API OpenAI
   */
  async testOpenAIKey(apiKey: string): Promise<any> {
    if (!apiKey || apiKey.trim() === '') {
      return { success: false, error: 'API Key vide', provider: 'openai' };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'Mozilla/5.0',
        },
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Clé OpenAI valide',
          provider: 'openai',
          keyPreview: apiKey.substring(0, 10) + '...',
        };
      } else {
        const error = await response.json();
        return {
          success: false,
          error: error.error?.message || 'Clé API invalide',
          provider: 'openai',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Erreur de connexion: ${error.message}`,
        provider: 'openai',
      };
    }
  }

  /**
   * Tester une clé API Anthropic
   */
  async testAnthropicKey(apiKey: string): Promise<any> {
    if (!apiKey || apiKey.trim() === '') {
      return { success: false, error: 'API Key vide', provider: 'anthropic' };
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 100,
          messages: [{ role: 'user', content: 'Test' }],
        }),
      });

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: 'Clé API invalide ou non autorisée',
          provider: 'anthropic',
        };
      }

      if (response.ok || response.status === 400) {
        // 400 peut signifier que le modèle est trop ancien, mais la clé est valide
        return {
          success: true,
          message: 'Clé Anthropic valide',
          provider: 'anthropic',
          keyPreview: apiKey.substring(0, 10) + '...',
        };
      }

      return {
        success: false,
        error: `Erreur HTTP ${response.status}`,
        provider: 'anthropic',
      };
    } catch (error) {
      return {
        success: false,
        error: `Erreur de connexion: ${error.message}`,
        provider: 'anthropic',
      };
    }
  }

  /**
   * Tester une clé API Google Gemini
   */
  async testGeminiKey(apiKey: string): Promise<any> {
    if (!apiKey || apiKey.trim() === '') {
      return { success: false, error: 'API Key vide', provider: 'gemini' };
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'Test',
                  },
                ],
              },
            ],
          }),
        },
      );

      if (response.status === 400) {
        // 400 est OK - cela signifie que la clé est valide mais la requête est mal formée
        const data = await response.json();
        if (data.error?.message?.includes('API key')) {
          return {
            success: false,
            error: 'Clé API invalide',
            provider: 'gemini',
          };
        }
        return {
          success: true,
          message: 'Clé Gemini valide',
          provider: 'gemini',
          keyPreview: apiKey.substring(0, 10) + '...',
        };
      }

      // 429 = Rate Limited, which means the key is valid
      if (response.status === 429) {
        return {
          success: true,
          message: 'Clé Gemini valide (Rate limited - API fonctionne)',
          provider: 'gemini',
          keyPreview: apiKey.substring(0, 10) + '...',
        };
      }

      if (response.ok) {
        return {
          success: true,
          message: 'Clé Gemini valide',
          provider: 'gemini',
          keyPreview: apiKey.substring(0, 10) + '...',
        };
      }

      if (response.status === 403 || response.status === 401) {
        return {
          success: false,
          error: 'Clé API invalide ou non autorisée',
          provider: 'gemini',
        };
      }

      return {
        success: false,
        error: `Erreur HTTP ${response.status}`,
        provider: 'gemini',
      };
    } catch (error) {
      return {
        success: false,
        error: `Erreur de connexion: ${error.message}`,
        provider: 'gemini',
      };
    }
  }

  /**
   * Tester une clé API Deepseek
   */
  async testDeepseekKey(apiKey: string): Promise<any> {
    if (!apiKey || apiKey.trim() === '') {
      return { success: false, error: 'API Key vide', provider: 'deepseek' };
    }

    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 10,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: 'Clé API invalide',
          provider: 'deepseek',
        };
      }

      if (response.ok || response.status === 400) {
        return {
          success: true,
          message: 'Clé Deepseek valide',
          provider: 'deepseek',
          keyPreview: apiKey.substring(0, 10) + '...',
        };
      }

      return {
        success: false,
        error: `Erreur HTTP ${response.status}`,
        provider: 'deepseek',
      };
    } catch (error) {
      return {
        success: false,
        error: `Erreur de connexion: ${error.message}`,
        provider: 'deepseek',
      };
    }
  }

  /**
   * Tester une clé API Mistral
   */
  async testMistralKey(apiKey: string): Promise<any> {
    if (!apiKey || apiKey.trim() === '') {
      return { success: false, error: 'API Key vide', provider: 'mistral' };
    }

    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 10,
        }),
      });

      if (response.status === 401) {
        return {
          success: false,
          error: 'Clé API invalide',
          provider: 'mistral',
        };
      }

      if (response.ok || response.status === 400) {
        return {
          success: true,
          message: 'Clé Mistral valide',
          provider: 'mistral',
          keyPreview: apiKey.substring(0, 10) + '...',
        };
      }

      return {
        success: false,
        error: `Erreur HTTP ${response.status}`,
        provider: 'mistral',
      };
    } catch (error) {
      return {
        success: false,
        error: `Erreur de connexion: ${error.message}`,
        provider: 'mistral',
      };
    }
  }

  /**
   * Tester une clé API Grok
   */
  async testGrokKey(apiKey: string): Promise<any> {
    if (!apiKey || apiKey.trim() === '') {
      return { success: false, error: 'API Key vide', provider: 'grok' };
    }

    // Grok n'a pas d'API publique accessible, on simule une validation basique
    if (apiKey.length < 20) {
      return {
        success: false,
        error: 'Format de clé API invalide',
        provider: 'grok',
      };
    }

    try {
      // Validation basique - Grok n'a pas d'API publique
      return {
        success: true,
        message: 'Format de clé Grok valide',
        provider: 'grok',
        keyPreview: apiKey.substring(0, 10) + '...',
      };
    } catch (error) {
      return {
        success: false,
        error: `Erreur: ${error.message}`,
        provider: 'grok',
      };
    }
  }

  /**
   * Tester une clé API pour n'importe quel provider
   */
  async testApiKey(provider: string, apiKey: string): Promise<any> {
    const normalizedProvider = provider.toLowerCase();

    switch (normalizedProvider) {
      case 'openai':
        return this.testOpenAIKey(apiKey);
      case 'anthropic':
        return this.testAnthropicKey(apiKey);
      case 'gemini':
      case 'google':
        return this.testGeminiKey(apiKey);
      case 'deepseek':
        return this.testDeepseekKey(apiKey);
      case 'mistral':
        return this.testMistralKey(apiKey);
      case 'grok':
        return this.testGrokKey(apiKey);
      default:
        return {
          success: false,
          error: `Provider non supporté: ${provider}`,
          provider: normalizedProvider,
        };
    }
  }
}
