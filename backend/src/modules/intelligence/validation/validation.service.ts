import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  // Liste de domaines jetables (disposable email)
  private disposableDomains = new Set([
    'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'mailinator.com',
    'trashmail.com', 'throwaway.email', 'temp-mail.org', 'yopmail.com',
    'maildrop.cc', 'fakeinbox.com', 'sharklasers.com', 'spam4.me',
  ]);

  // Mots-clés de spam
  private spamKeywords = [
    'test', 'spam', 'fake', 'no-reply', 'noreply', 'donotreply',
    'info@', 'admin@', 'webmaster@', 'postmaster@',
  ];

  constructor(private prisma: PrismaService) {
    this.loadDisposableDomains();
  }

  /**
   * Charger les domaines jetables depuis la DB
   */
  private async loadDisposableDomains() {
    try {
      const domains = await this.prisma.disposable_domains.findMany({
        where: { isActive: true },
      });
      domains.forEach((d) => this.disposableDomains.add(d.domain));
      this.logger.log(`Loaded ${this.disposableDomains.size} disposable domains`);
    } catch (error) {
      this.logger.error('Failed to load disposable domains');
    }
  }

  // ============================================
  // VALIDATION EMAIL
  // ============================================

  /**
   * Valider un email (complet)
   */
  async validateEmail(
    userId: string,
    email: string,
    prospectId?: string,
  ): Promise<any> {
    this.logger.log(`Validating email: ${email}`);

    const result = {
      email,
      isValid: false,
      score: 0,
      isSpam: false,
      isDisposable: false,
      isCatchAll: false,
      provider: null as string | null,
      reason: '' as string,
      validationMethod: '',
      metadata: {} as any,
    };

    // 1. Vérifier blacklist
    const blacklisted = await this.isBlacklisted('email', email);
    if (blacklisted) {
      result.reason = 'Email blacklisté';
      result.isSpam = true;
      await this.saveValidation(userId, 'email', email, result, prospectId);
      return result;
    }

    // 2. Vérifier whitelist
    const whitelisted = await this.isWhitelisted('email', email);
    if (whitelisted) {
      result.isValid = true;
      result.score = 100;
      result.validationMethod = 'whitelist';
      await this.saveValidation(userId, 'email', email, result, prospectId);
      return result;
    }

    // 3. Validation syntaxe
    const syntaxValid = this.isValidEmailSyntax(email);
    if (!syntaxValid) {
      result.reason = 'Format email invalide';
      result.validationMethod = 'syntax';
      await this.saveValidation(userId, 'email', email, result, prospectId);
      return result;
    }
    result.score += 20;

    // 4. Extraire domaine
    const domain = email.split('@')[1];
    result.metadata.domain = domain;

    // 5. Vérifier domaine jetable
    const isDisposable = this.disposableDomains.has(domain.toLowerCase());
    result.isDisposable = isDisposable;
    if (isDisposable) {
      result.reason = 'Email jetable (disposable)';
      result.isSpam = true;
      result.validationMethod = 'disposable_check';
      await this.saveValidation(userId, 'email', email, result, prospectId);
      return result;
    }
    result.score += 20;

    // 6. Détecter spam keywords
    const hasSpamKeyword = this.spamKeywords.some((keyword) =>
      email.toLowerCase().includes(keyword),
    );
    if (hasSpamKeyword) {
      result.isSpam = true;
      result.reason = 'Contient des mots-clés de spam';
      result.score = Math.max(0, result.score - 30);
    } else {
      result.score += 15;
    }

    // 7. Détecter provider
    result.provider = this.detectEmailProvider(domain);
    if (result.provider) {
      result.score += 15;
    }

    // 8. Vérification DNS/MX (optionnel - peut être lent)
    try {
      const mxRecords = await this.checkMxRecords(domain);
      if (mxRecords && mxRecords.length > 0) {
        result.isValid = true;
        result.score += 30;
        result.validationMethod = 'dns_mx';
        result.metadata.mxRecords = mxRecords.map((r) => r.exchange);
      } else {
        result.reason = 'Aucun enregistrement MX trouvé';
        result.validationMethod = 'dns_mx';
      }
    } catch (error) {
      result.reason = 'Erreur vérification DNS';
      result.validationMethod = 'dns_error';
    }

    // Score final
    result.score = Math.min(result.score, 100);
    result.isValid = result.score >= 50 && !result.isSpam;

    // Sauvegarder
    await this.saveValidation(userId, 'email', email, result, prospectId);

    return result;
  }

  /**
   * Valider plusieurs emails
   */
  async validateEmails(
    userId: string,
    emails: string[],
  ): Promise<any> {
    const results = await Promise.all(
      emails.map((email) => this.validateEmail(userId, email)),
    );

    const summary = {
      total: results.length,
      valid: results.filter((r) => r.isValid).length,
      invalid: results.filter((r) => !r.isValid).length,
      spam: results.filter((r) => r.isSpam).length,
      disposable: results.filter((r) => r.isDisposable).length,
      results,
    };

    return summary;
  }

  /**
   * Vérifier syntaxe email
   */
  private isValidEmailSyntax(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Vérifier les enregistrements MX
   */
  private async checkMxRecords(domain: string): Promise<any[]> {
    try {
      const records = await resolveMx(domain);
      return records;
    } catch (error) {
      return [];
    }
  }

  /**
   * Détecter le provider email
   */
  private detectEmailProvider(domain: string): string | null {
    const providers: Record<string, string> = {
      'gmail.com': 'Gmail',
      'googlemail.com': 'Gmail',
      'outlook.com': 'Outlook',
      'hotmail.com': 'Hotmail',
      'yahoo.com': 'Yahoo',
      'icloud.com': 'iCloud',
      'protonmail.com': 'ProtonMail',
      'aol.com': 'AOL',
      'mail.ru': 'Mail.ru',
      'yandex.com': 'Yandex',
    };

    return providers[domain.toLowerCase()] || null;
  }

  // ============================================
  // VALIDATION TÉLÉPHONE
  // ============================================

  /**
   * Valider un téléphone
   */
  async validatePhone(
    userId: string,
    phone: string,
    prospectId?: string,
  ): Promise<any> {
    this.logger.log(`Validating phone: ${phone}`);

    const result = {
      phone,
      isValid: false,
      score: 0,
      isSpam: false,
      reason: '',
      validationMethod: '',
      metadata: {} as any,
    };

    // 1. Vérifier blacklist
    const blacklisted = await this.isBlacklisted('phone', phone);
    if (blacklisted) {
      result.reason = 'Téléphone blacklisté';
      result.isSpam = true;
      await this.saveValidation(userId, 'phone', phone, result, prospectId);
      return result;
    }

    // 2. Vérifier whitelist
    const whitelisted = await this.isWhitelisted('phone', phone);
    if (whitelisted) {
      result.isValid = true;
      result.score = 100;
      result.validationMethod = 'whitelist';
      await this.saveValidation(userId, 'phone', phone, result, prospectId);
      return result;
    }

    // 3. Nettoyer le téléphone
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    result.metadata.cleanPhone = cleanPhone;

    // 4. Validation format
    const isValidFormat = this.isValidPhoneFormat(cleanPhone);
    if (!isValidFormat) {
      result.reason = 'Format téléphone invalide';
      result.validationMethod = 'format';
      await this.saveValidation(userId, 'phone', phone, result, prospectId);
      return result;
    }
    result.score += 30;

    // 5. Détecter pays
    const country = this.detectPhoneCountry(cleanPhone);
    if (country) {
      result.metadata.country = country;
      result.score += 20;
    }

    // 6. Vérifier longueur
    if (cleanPhone.length >= 10 && cleanPhone.length <= 15) {
      result.score += 30;
    }

    // 7. Vérifier patterns suspects
    const isSuspicious = this.isSuspiciousPhone(cleanPhone);
    if (isSuspicious) {
      result.isSpam = true;
      result.reason = 'Pattern suspect détecté';
      result.score = Math.max(0, result.score - 40);
    } else {
      result.score += 20;
    }

    // Score final
    result.score = Math.min(result.score, 100);
    result.isValid = result.score >= 60 && !result.isSpam;
    result.validationMethod = 'format_check';

    // Sauvegarder
    await this.saveValidation(userId, 'phone', phone, result, prospectId);

    return result;
  }

  /**
   * Vérifier format téléphone
   */
  private isValidPhoneFormat(phone: string): boolean {
    // Format international: +XXX... ou 00XXX...
    // Format local: 0XXXXXXXXX
    const regex = /^(\+|00)?[1-9]\d{7,14}$/;
    return regex.test(phone);
  }

  /**
   * Détecter le pays du téléphone
   */
  private detectPhoneCountry(phone: string): string | null {
    if (phone.startsWith('+216') || phone.startsWith('00216')) {
      return 'Tunisia';
    }
    if (phone.startsWith('+33') || phone.startsWith('0033')) {
      return 'France';
    }
    if (phone.startsWith('+1')) {
      return 'USA/Canada';
    }
    if (phone.startsWith('+44')) {
      return 'UK';
    }
    return null;
  }

  /**
   * Détecter patterns suspects
   */
  private isSuspiciousPhone(phone: string): boolean {
    // Numéros avec tous les mêmes chiffres
    if (/^(\d)\1+$/.test(phone.replace(/^\+/, ''))) {
      return true;
    }

    // Numéros séquentiels
    if (/01234|12345|23456|34567|45678|56789/.test(phone)) {
      return true;
    }

    return false;
  }

  // ============================================
  // BLACKLIST / WHITELIST
  // ============================================

  /**
   * Vérifier si une valeur est blacklistée
   */
  async isBlacklisted(type: string, value: string): Promise<boolean> {
    const count = await this.prisma.validation_blacklist.count({
      where: {
        type,
        value: value.toLowerCase(),
        isActive: true,
      },
    });
    return count > 0;
  }

  /**
   * Vérifier si une valeur est whitelistée
   */
  async isWhitelisted(type: string, value: string): Promise<boolean> {
    const count = await this.prisma.validation_whitelist.count({
      where: {
        type,
        value: value.toLowerCase(),
        isActive: true,
      },
    });
    return count > 0;
  }

  /**
   * Ajouter à la blacklist
   */
  async addToBlacklist(
    type: string,
    value: string,
    reason?: string,
    addedBy?: string,
  ) {
    return this.prisma.validation_blacklist.create({
      data: {
        type,
        value: value.toLowerCase(),
        reason,
        addedBy,
      },
    });
  }

  /**
   * Ajouter à la whitelist
   */
  async addToWhitelist(type: string, value: string, addedBy?: string) {
    return this.prisma.validation_whitelist.create({
      data: {
        type,
        value: value.toLowerCase(),
        addedBy,
      },
    });
  }

  /**
   * Retirer de la blacklist
   */
  async removeFromBlacklist(id: string) {
    return this.prisma.validation_blacklist.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Obtenir la blacklist
   */
  async getBlacklist(type?: string) {
    const where: any = { isActive: true };
    if (type) where.type = type;

    return this.prisma.validation_blacklist.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtenir la whitelist
   */
  async getWhitelist(type?: string) {
    const where: any = { isActive: true };
    if (type) where.type = type;

    return this.prisma.validation_whitelist.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================
  // HISTORIQUE
  // ============================================

  /**
   * Sauvegarder une validation
   */
  private async saveValidation(
    userId: string,
    contactType: string,
    contactValue: string,
    result: any,
    prospectId?: string,
  ) {
    try {
      await this.prisma.contact_validations.create({
        data: {
          userId,
          contactType,
          contactValue: contactValue.toLowerCase(),
          isValid: result.isValid,
          score: result.score,
          validationMethod: result.validationMethod,
          reason: result.reason,
          isSpam: result.isSpam,
          isDisposable: result.isDisposable || false,
          isCatchAll: result.isCatchAll || false,
          provider: result.provider,
          metadata: result.metadata || {},
          prospectId,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to save validation: ${error.message}`);
    }
  }

  /**
   * Obtenir l'historique de validation
   */
  async getValidationHistory(userId: string, filters?: any) {
    const where: any = { userId };

    if (filters?.contactType) where.contactType = filters.contactType;
    if (filters?.isValid !== undefined) where.isValid = filters.isValid === 'true';
    if (filters?.isSpam !== undefined) where.isSpam = filters.isSpam === 'true';

    return this.prisma.contact_validations.findMany({
      where,
      orderBy: { verifiedAt: 'desc' },
      take: filters?.limit ? parseInt(filters.limit) : 100,
      include: {
        prospects: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Obtenir les statistiques de validation
   */
  async getValidationStats(userId: string) {
    const [total, valid, invalid, spam, disposable] = await Promise.all([
      this.prisma.contact_validations.count({ where: { userId } }),
      this.prisma.contact_validations.count({
        where: { userId, isValid: true },
      }),
      this.prisma.contact_validations.count({
        where: { userId, isValid: false },
      }),
      this.prisma.contact_validations.count({
        where: { userId, isSpam: true },
      }),
      this.prisma.contact_validations.count({
        where: { userId, isDisposable: true },
      }),
    ]);

    const avgScore = await this.prisma.contact_validations.aggregate({
      where: { userId },
      _avg: { score: true },
    });

    return {
      total,
      valid,
      invalid,
      spam,
      disposable,
      avgScore: Math.round(avgScore._avg.score || 0),
      validRate: total > 0 ? Math.round((valid / total) * 100) : 0,
    };
  }

  // ============================================
  // NETTOYAGE AUTOMATIQUE
  // ============================================

  /**
   * Nettoyer les anciennes validations (CRON)
   */
  @Cron(CronExpression.EVERY_WEEK)
  async cleanOldValidations() {
    this.logger.log('Cleaning old validations...');

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const deleted = await this.prisma.contact_validations.deleteMany({
      where: {
        createdAt: {
          lt: sixMonthsAgo,
        },
      },
    });

    this.logger.log(`Deleted ${deleted.count} old validations`);
  }
}
