import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { AIMetricsService } from '../../intelligence/ai-metrics/ai-metrics.service';

/**
 * Service pour tracker les conversions et attribuer la valeur aux agents IA
 */
@Injectable()
export class ProspectsConversionTrackerService {
  constructor(
    private prisma: PrismaService,
    private aiMetricsService: AIMetricsService,
  ) {}

  /**
   * Récupérer toutes les conversions avec filtres
   */
  async getAllConversions(
    userId: string,
    filters?: {
      prospectId?: string;
      eventType?: string;
      startDate?: string;
      endDate?: string;
      minValue?: number;
    },
  ) {
    const where: any = { userId };

    if (filters?.prospectId) {
      where.prospectId = filters.prospectId;
    }
    if (filters?.eventType) {
      where.eventType = filters.eventType;
    }
    if (filters?.startDate || filters?.endDate) {
      where.eventDate = {};
      if (filters.startDate) {
        where.eventDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.eventDate.lte = new Date(filters.endDate);
      }
    }
    if (filters?.minValue) {
      where.eventValue = { gte: filters.minValue };
    }

    return this.prisma.conversion_events.findMany({
      where,
      orderBy: { eventDate: 'desc' },
      include: {
        prospects: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Tracker quand un prospect est qualifié
   */
  async trackProspectQualified(prospectId: string, userId: string, metadata?: any) {
    return this.aiMetricsService.trackConversion({
      userId,
      prospectId,
      eventType: 'prospect_qualified',
      value: 20,
      metadata: {
        ...metadata,
        commission: 0,
        aiAssisted: true,
        assistingAgents: ['prospection', 'analysis'],
      },
    });
  }

  /**
   * Tracker quand un RDV est confirmé
   */
  async trackMeetingBooked(
    prospectId: string,
    userId: string,
    appointmentId?: string,
    metadata?: any,
  ) {
    return this.aiMetricsService.trackConversion({
      userId,
      prospectId,
      eventType: 'meeting_booked',
      value: 50,
      metadata: {
        ...metadata,
        appointmentId,
        commission: 0,
        aiAssisted: true,
        assistingAgents: ['matching', 'nurturing'],
      },
    });
  }

  /**
   * Tracker quand une visite est effectuée
   */
  async trackVisitCompleted(
    prospectId: string,
    propertyId: string,
    userId: string,
    feedback?: any,
  ) {
    return this.aiMetricsService.trackConversion({
      userId,
      prospectId,
      propertyId,
      eventType: 'visit_completed',
      value: 75,
      metadata: {
        feedback,
        interestLevel: feedback?.interestLevel,
        commission: 0,
        aiAssisted: true,
        assistingAgents: ['matching', 'nurturing'],
      },
    });
  }

  /**
   * Tracker quand une offre est faite
   */
  async trackOfferMade(
    prospectId: string,
    propertyId: string,
    userId: string,
    offerAmount: number,
    metadata?: any,
  ) {
    return this.aiMetricsService.trackConversion({
      userId,
      prospectId,
      propertyId,
      eventType: 'offer_made',
      value: 150,
      metadata: {
        ...metadata,
        offerAmount,
        commission: 0,
        aiAssisted: true,
        assistingAgents: ['matching', 'closing'],
      },
    });
  }

  /**
   * Tracker quand un contrat est signé
   */
  async trackContractSigned(
    prospectId: string,
    propertyId: string,
    userId: string,
    contractValue: number,
    commission: number,
    metadata?: any,
  ) {
    return this.aiMetricsService.trackConversion({
      userId,
      prospectId,
      propertyId,
      eventType: 'contract_signed',
      value: contractValue,
      metadata: {
        ...metadata,
        commission,
        aiAssisted: true,
        assistingAgents: ['prospection', 'matching', 'nurturing', 'closing'],
      },
    });
  }

  /**
   * Détecter automatiquement les conversions
   */
  async detectAndTrackConversions(prospectId: string, userId: string) {
    const prospect = await this.prisma.prospects.findFirst({
      where: { id: prospectId, userId },
      include: {
        interactions: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        propertiesShown: {
          orderBy: { shownDate: 'desc' },
          take: 5,
        },
        timelineStages: {
          orderBy: { enteredAt: 'desc' },
        },
      },
    });

    if (!prospect) return;

    const conversions: any[] = [];

    if (['qualified', 'searching', 'visiting', 'negotiating', 'signed'].includes(prospect.status)) {
      conversions.push({
        type: 'prospect_qualified',
        detected: true,
      });
    }

    const hasMeeting = prospect.interactions.some(
      (i) => i.type === 'meeting' || i.type === 'visit',
    );
    if (hasMeeting) {
      conversions.push({
        type: 'meeting_booked',
        detected: true,
      });
    }

    if (prospect.propertiesShown.length > 0) {
      conversions.push({
        type: 'visit_completed',
        count: prospect.propertiesShown.length,
        detected: true,
      });
    }

    if (prospect.status === 'signed') {
      conversions.push({
        type: 'contract_signed',
        detected: true,
      });
    }

    return {
      prospectId,
      conversions,
      totalConversions: conversions.length,
    };
  }

  /**
   * Calculer la contribution des agents IA
   */
  async calculateAgentContribution(prospectId: string, userId: string) {
    const usages = await this.prisma.$queryRaw`
      SELECT 
        agentType,
        COUNT(*) as action_count,
        SUM(resultValue) as total_value,
        MAX(timestamp) as last_used
      FROM ai_usage_metrics
      WHERE prospectId = ${prospectId}
        AND userId = ${userId}
      GROUP BY agentType
      ORDER BY total_value DESC
    `;

    const conversions = await this.prisma.$queryRaw`
      SELECT 
        eventType,
        eventValue,
        assistingAgents,
        eventDate
      FROM conversion_events
      WHERE prospectId = ${prospectId}
        AND userId = ${userId}
      ORDER BY eventDate DESC
    `;

    return {
      prospectId,
      agentUsage: usages,
      conversions,
      summary: {
        totalAgentsUsed: (usages as any[]).length,
        mostActiveAgent: (usages as any[])[0]?.agentType,
        totalValueGenerated: (usages as any[]).reduce(
          (sum, u: any) => sum + parseFloat(u.total_value || 0),
          0,
        ),
        totalConversions: (conversions as any[]).length,
        totalConversionValue: (conversions as any[]).reduce(
          (sum, c: any) => sum + parseFloat(c.eventValue || 0),
          0,
        ),
      },
    };
  }

  /**
   * Obtenir les prospects à fort ROI
   */
  async getHighROIProspects(userId: string, limit = 10) {
    const prospects = await this.prisma.$queryRaw`
      SELECT 
        p.id,
        p.firstName,
        p.lastName,
        p.status,
        COUNT(DISTINCT aim.id) as ai_actions,
        SUM(aim.resultValue) as ai_value_generated,
        SUM(aim.inputCost + aim.outputCost) as ai_cost,
        COUNT(DISTINCT ce.id) as conversions,
        SUM(ce.eventValue) as conversion_value,
        CASE 
          WHEN SUM(aim.inputCost + aim.outputCost) > 0
          THEN (SUM(ce.eventValue) / SUM(aim.inputCost + aim.outputCost) - 1) * 100
          ELSE 0
        END as roi_percentage
      FROM prospects p
      LEFT JOIN ai_usage_metrics aim ON aim.prospectId = p.id
      LEFT JOIN conversion_events ce ON ce.prospectId = p.id
      WHERE p.userId = ${userId}
      GROUP BY p.id, p.firstName, p.lastName, p.status
      HAVING COUNT(DISTINCT aim.id) > 0
      ORDER BY roi_percentage DESC
      LIMIT ${limit}
    `;

    return prospects;
  }

  /**
   * Rapport de performance pour un prospect
   */
  async getProspectPerformanceReport(prospectId: string, userId: string) {
    const [contribution, conversions, aiUsage] = await Promise.all([
      this.calculateAgentContribution(prospectId, userId),
      this.prisma.$queryRaw`
        SELECT * FROM conversion_events
        WHERE prospectId = ${prospectId} AND userId = ${userId}
        ORDER BY eventDate DESC
      `,
      this.prisma.$queryRaw`
        SELECT 
          actionType,
          agentType,
          timestamp,
          resultValue,
          inputCost + outputCost as cost
        FROM ai_usage_metrics
        WHERE prospectId = ${prospectId} AND userId = ${userId}
        ORDER BY timestamp DESC
        LIMIT 20
      `,
    ]);

    return {
      prospectId,
      contribution,
      conversions,
      recentAIActions: aiUsage,
      report: {
        totalAICost: contribution.summary.totalValueGenerated,
        totalConversionValue: contribution.summary.totalConversionValue,
        roi:
          contribution.summary.totalValueGenerated > 0
            ? (
                (contribution.summary.totalConversionValue /
                  contribution.summary.totalValueGenerated -
                  1) *
                100
              ).toFixed(1)
            : 0,
        agentCount: contribution.summary.totalAgentsUsed,
        conversionCount: contribution.summary.totalConversions,
      },
    };
  }
}
