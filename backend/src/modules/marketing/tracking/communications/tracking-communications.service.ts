import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';

/**
 * Service pour gérer les communications automatiques déclenchées par le tracking
 *
 * Envoie des emails et SMS personnalisés basés sur le comportement des visiteurs :
 * - Visiteur revient 3+ fois → Email personnalisé du commercial
 * - Abandon après clic contact → Relance automatique
 * - Temps passé > 5min → "Besoin d'aide ?"
 * - Hot lead détecté → SMS immédiat au commercial
 */
@Injectable()
export class TrackingCommunicationsService {
  private readonly logger = new Logger(TrackingCommunicationsService.name);

  // Services externes injectés dynamiquement
  private emailService: any;
  private smsService: any;
  private unifiedCommunicationService: any;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Injecter les services de communication
   */
  setEmailService(emailService: any) {
    this.emailService = emailService;
  }

  setSmsService(smsService: any) {
    this.smsService = smsService;
  }

  setUnifiedCommunicationService(unifiedCommunicationService: any) {
    this.unifiedCommunicationService = unifiedCommunicationService;
  }

  /**
   * Traiter un événement de tracking et déclencher les communications appropriées
   */
  async processTrackingEvent(userId: string, event: any): Promise<void> {
    try {
      const sessionId = event.sessionId;
      if (!sessionId) return;

      // Récupérer l'historique de la session
      const sessionEvents = await this.getSessionEvents(userId, sessionId);

      // Analyser le comportement
      const behavior = this.analyzeBehavior(sessionEvents);

      // Déclencher les communications appropriées
      if (behavior.isReturningVisitor && behavior.visitCount >= 3) {
        await this.sendPersonalizedOutreach(userId, sessionId, behavior);
      }

      if (behavior.hasClickedContact && !behavior.hasConverted) {
        await this.sendAbandonmentFollowUp(userId, sessionId, behavior);
      }

      if (behavior.totalTimeSpent > 300 && !behavior.hasConverted) {
        await this.sendHelpOffer(userId, sessionId, behavior);
      }

      if (behavior.isHotLead) {
        await this.sendHotLeadAlert(userId, sessionId, behavior);
      }
    } catch (error) {
      this.logger.error('Failed to process tracking communications:', error);
    }
  }

  /**
   * Récupérer les événements d'une session
   */
  private async getSessionEvents(
    userId: string,
    sessionId: string,
  ): Promise<any[]> {
    return this.prisma.trackingEvent.findMany({
      where: {
        userId,
        sessionId,
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  /**
   * Analyser le comportement d'une session
   */
  private analyzeBehavior(events: any[]): any {
    const behavior: any = {
      visitCount: 1,
      isReturningVisitor: false,
      hasClickedContact: false,
      hasConverted: false,
      totalTimeSpent: 0,
      propertiesViewed: new Set(),
      isHotLead: false,
      prospectEmail: null,
      prospectPhone: null,
      topProperty: null,
    };

    // Compter les visites uniques (par jour)
    const visitDates = new Set<string>();
    events.forEach((event: any) => {
      const date = event.timestamp.toISOString().split('T')[0];
      visitDates.add(date);
    });
    behavior.visitCount = visitDates.size;
    behavior.isReturningVisitor = visitDates.size >= 2;

    // Analyser les événements
    events.forEach((event: any) => {
      const eventData = event.eventData || event.data || {};

      // PropertyImpression avec temps passé
      if (event.eventName === 'PropertyImpression' && eventData.timeSpent) {
        behavior.totalTimeSpent += eventData.timeSpent;
      }

      // Propriétés vues
      if (eventData.propertyId) {
        behavior.propertiesViewed.add(eventData.propertyId);
      }

      // Clic contact
      if (
        event.eventName === 'PropertyButtonClick' &&
        ['contact', 'call', 'schedule_visit'].includes(eventData.buttonType)
      ) {
        behavior.hasClickedContact = true;
        behavior.topProperty = eventData.propertyId;
      }

      // Lead converti
      if (event.eventName === 'Lead') {
        behavior.hasConverted = true;
        behavior.prospectEmail = eventData.email;
        behavior.prospectPhone = eventData.phone;
      }
    });

    // Hot lead : 3+ biens, 2+ clics contact, ou 5+ minutes
    const contactClicks = events.filter(
      (e: any) =>
        e.eventName === 'PropertyButtonClick' &&
        ['contact', 'call', 'schedule_visit'].includes(
          e.eventData?.buttonType || e.data?.buttonType,
        ),
    ).length;

    behavior.isHotLead =
      behavior.propertiesViewed.size >= 3 ||
      contactClicks >= 2 ||
      behavior.totalTimeSpent >= 300;

    // Propriété la plus consultée
    if (!behavior.topProperty && behavior.propertiesViewed.size > 0) {
      behavior.topProperty = Array.from(behavior.propertiesViewed)[0];
    }

    return behavior;
  }

  /**
   * Envoyer un email personnalisé pour visiteur récurrent
   */
  private async sendPersonalizedOutreach(
    userId: string,
    sessionId: string,
    behavior: any,
  ): Promise<void> {
    // Vérifier si déjà envoyé
    const alreadySent = await this.hasBeenSent(
      userId,
      sessionId,
      'personalized_outreach',
    );
    if (alreadySent) return;

    this.logger.log(
      `Sending personalized outreach for session ${sessionId} (${behavior.visitCount} visits)`,
    );

    // TODO: Implémenter l'envoi d'email via EmailService
    // await this.emailService.sendTemplateEmail({
    //   to: behavior.prospectEmail,
    //   template: 'returning_visitor',
    //   data: {
    //     visitCount: behavior.visitCount,
    //     propertiesViewed: behavior.propertiesViewed.size,
    //     topProperty: behavior.topProperty
    //   }
    // });

    await this.markAsSent(userId, sessionId, 'personalized_outreach');
  }

  /**
   * Envoyer un email de relance après abandon
   */
  private async sendAbandonmentFollowUp(
    userId: string,
    sessionId: string,
    behavior: any,
  ): Promise<void> {
    // Vérifier si déjà envoyé
    const alreadySent = await this.hasBeenSent(
      userId,
      sessionId,
      'abandonment_followup',
    );
    if (alreadySent) return;

    // Attendre 30 minutes avant d'envoyer
    const lastEvent = await this.prisma.trackingEvent.findFirst({
      where: { userId, sessionId },
      orderBy: { timestamp: 'desc' },
    });

    if (!lastEvent) return;

    const timeSinceLastEvent = Date.now() - lastEvent.timestamp.getTime();
    if (timeSinceLastEvent < 30 * 60 * 1000) return; // Moins de 30 minutes

    this.logger.log(
      `Sending abandonment follow-up for session ${sessionId}`,
    );

    // TODO: Implémenter l'envoi d'email via EmailService
    // await this.emailService.sendTemplateEmail({
    //   to: behavior.prospectEmail,
    //   template: 'abandonment_followup',
    //   data: {
    //     topProperty: behavior.topProperty,
    //     message: "Vous avez des questions sur ce bien ?"
    //   }
    // });

    await this.markAsSent(userId, sessionId, 'abandonment_followup');
  }

  /**
   * Envoyer une offre d'aide
   */
  private async sendHelpOffer(
    userId: string,
    sessionId: string,
    behavior: any,
  ): Promise<void> {
    // Vérifier si déjà envoyé
    const alreadySent = await this.hasBeenSent(
      userId,
      sessionId,
      'help_offer',
    );
    if (alreadySent) return;

    this.logger.log(`Sending help offer for session ${sessionId}`);

    // TODO: Implémenter l'envoi d'email via EmailService
    // await this.emailService.sendTemplateEmail({
    //   to: behavior.prospectEmail,
    //   template: 'help_offer',
    //   data: {
    //     timeSpent: Math.round(behavior.totalTimeSpent / 60),
    //     propertiesViewed: behavior.propertiesViewed.size
    //   }
    // });

    await this.markAsSent(userId, sessionId, 'help_offer');
  }

  /**
   * Envoyer une alerte SMS au commercial pour hot lead
   */
  private async sendHotLeadAlert(
    userId: string,
    sessionId: string,
    behavior: any,
  ): Promise<void> {
    // Vérifier si déjà envoyé
    const alreadySent = await this.hasBeenSent(
      userId,
      sessionId,
      'hot_lead_alert',
    );
    if (alreadySent) return;

    this.logger.log(`Sending hot lead alert for session ${sessionId}`);

    // Récupérer le commercial assigné
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, email: true },
    });

    if (!user) return;

    // TODO: Implémenter l'envoi de SMS via SmsService
    // if (user.phone && this.smsService) {
    //   await this.smsService.sendSms({
    //     to: user.phone,
    //     message: `🔥 HOT LEAD détecté ! ${behavior.propertiesViewed.size} biens vus, ${Math.round(behavior.totalTimeSpent / 60)} min passées. Session: ${sessionId}`
    //   });
    // }

    await this.markAsSent(userId, sessionId, 'hot_lead_alert');
  }

  /**
   * Créer une séquence de nurturing basée sur le comportement
   */
  async createNurturingSequence(
    userId: string,
    prospectId: string,
    behaviorPattern: string,
  ): Promise<any> {
    // Définir les templates de séquence selon le pattern
    const sequences: Record<string, any> = {
      highly_engaged: {
        name: 'Highly Engaged Nurturing',
        emails: [
          { day: 0, template: 'welcome_engaged', subject: 'Merci pour votre intérêt !' },
          { day: 2, template: 'property_recommendations', subject: 'Biens qui pourraient vous intéresser' },
          { day: 5, template: 'appointment_invitation', subject: 'Planifions une visite' },
        ],
      },
      interested: {
        name: 'Interested Nurturing',
        emails: [
          { day: 0, template: 'welcome', subject: 'Bienvenue !' },
          { day: 3, template: 'educational_content', subject: 'Guide d\'achat immobilier' },
          { day: 7, template: 'new_listings', subject: 'Nouvelles opportunités' },
        ],
      },
      explorer: {
        name: 'Explorer Nurturing',
        emails: [
          { day: 0, template: 'welcome_explorer', subject: 'Découvrez nos biens' },
          { day: 5, template: 'neighborhood_guide', subject: 'Vivre à [ville]' },
          { day: 10, template: 'market_insights', subject: 'Tendances du marché' },
        ],
      },
    };

    const sequence = sequences[behaviorPattern] || sequences.explorer;

    // Enregistrer la séquence en base
    const nurturingSequence = await this.prisma.nurturingSequence.create({
      data: {
        userId,
        prospectId,
        name: sequence.name,
        behaviorPattern,
        emails: JSON.stringify(sequence.emails),
        currentStep: 0,
        status: 'active',
      },
    });

    this.logger.log(
      `Created nurturing sequence ${nurturingSequence.id} for prospect ${prospectId}`,
    );

    return nurturingSequence;
  }

  /**
   * Vérifier si une communication a déjà été envoyée
   */
  private async hasBeenSent(
    userId: string,
    sessionId: string,
    communicationType: string,
  ): Promise<boolean> {
    const existing = await this.prisma.trackingCommunication.findFirst({
      where: {
        userId,
        sessionId,
        communicationType,
      },
    });

    return !!existing;
  }

  /**
   * Marquer une communication comme envoyée
   */
  private async markAsSent(
    userId: string,
    sessionId: string,
    communicationType: string,
  ): Promise<void> {
    await this.prisma.trackingCommunication.create({
      data: {
        userId,
        sessionId,
        communicationType,
        sentAt: new Date(),
      },
    });
  }

  /**
   * Envoyer un email de bienvenue après premier lead
   */
  async sendWelcomeEmail(
    userId: string,
    prospectEmail: string,
    prospectData: any,
  ): Promise<void> {
    this.logger.log(`Sending welcome email to ${prospectEmail}`);

    // TODO: Implémenter l'envoi d'email via EmailService
    // await this.emailService.sendTemplateEmail({
    //   to: prospectEmail,
    //   template: 'welcome_new_lead',
    //   data: {
    //     name: prospectData.name,
    //     property: prospectData.property
    //   }
    // });
  }

  /**
   * Envoyer un rappel de rendez-vous
   */
  async sendAppointmentReminder(
    userId: string,
    prospectContact: string,
    appointmentData: any,
  ): Promise<void> {
    this.logger.log(`Sending appointment reminder to ${prospectContact}`);

    // Déterminer si c'est un email ou un téléphone
    const isEmail = prospectContact.includes('@');

    if (isEmail && this.emailService) {
      // TODO: Implémenter l'envoi d'email
      // await this.emailService.sendTemplateEmail({
      //   to: prospectContact,
      //   template: 'appointment_reminder',
      //   data: appointmentData
      // });
    } else if (this.smsService) {
      // TODO: Implémenter l'envoi de SMS
      // await this.smsService.sendSms({
      //   to: prospectContact,
      //   message: `Rappel : RDV visite le ${appointmentData.date} à ${appointmentData.time}`
      // });
    }
  }

  /**
   * Obtenir les statistiques des communications tracking
   */
  async getCommunicationsStats(
    userId: string,
    period: 'day' | 'week' | 'month' = 'week',
  ): Promise<any> {
    const startDate = this.getStartDate(period);

    const communications = await this.prisma.trackingCommunication.groupBy({
      by: ['communicationType'],
      where: {
        userId,
        sentAt: { gte: startDate },
      },
      _count: true,
    });

    const total = communications.reduce(
      (sum, comm) => sum + comm._count,
      0,
    );

    return {
      period,
      total,
      byType: communications.map((comm) => ({
        type: comm.communicationType,
        count: comm._count,
      })),
    };
  }

  /**
   * Calculer la date de début selon la période
   */
  private getStartDate(period: 'day' | 'week' | 'month'): Date {
    const now = new Date();
    switch (period) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}
