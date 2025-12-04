import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import {
  ProspectingMetricsQueryDto,
  ProspectingOverviewResponse,
  BySourceResponse,
  ByCampaignResponse,
  QualityMetricsResponse,
  ScoreDistributionResponse,
  TimelineResponse,
  TopPerformersResponse,
  InsightsResponse,
  InsightItem,
} from './dto/prospecting-metrics.dto';

@Injectable()
export class ProspectingMetricsService {
  constructor(private prisma: PrismaService) {}

  private getDateRange(query: ProspectingMetricsQueryDto) {
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from
      ? new Date(query.from)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000); // Default 30 days
    return { from, to };
  }

  private buildWhereClause(query: ProspectingMetricsQueryDto, userId: string) {
    const { from, to } = this.getDateRange(query);
    return {
      userId: query.userId || userId,
      createdAt: { gte: from, lte: to },
      ...(query.campaignId && { campaignId: query.campaignId }),
    };
  }

  /**
   * GET /ai-metrics/prospecting/overview
   * Global KPIs for AI prospecting
   */
  async getOverview(
    userId: string,
    query: ProspectingMetricsQueryDto,
  ): Promise<ProspectingOverviewResponse> {
    const { from, to } = this.getDateRange(query);
    const where = this.buildWhereClause(query, userId);

    // Get all leads with their stats
    const [leads, matches, campaigns] = await Promise.all([
      this.prisma.prospecting_leads.findMany({
        where,
        select: {
          id: true,
          validationStatus: true,
          status: true,
          seriousnessScore: true,
          convertedAt: true,
        },
      }),
      this.prisma.prospecting_matches.findMany({
        where: {
          createdAt: { gte: from, lte: to },
          lead: where,
        },
        select: { id: true, score: true, status: true },
      }),
      this.prisma.prospecting_campaigns.count({
        where: { userId: query.userId || userId, createdAt: { gte: from, lte: to } },
      }),
    ]);

    const leadsCreated = leads.length;
    const leadsValid = leads.filter((l) => l.validationStatus === 'valid').length;
    const leadsSuspicious = leads.filter((l) => l.validationStatus === 'suspicious').length;
    const leadsSpam = leads.filter((l) => l.validationStatus === 'spam').length;
    const leadsContacted = leads.filter((l) => l.status === 'contacted').length;
    const leadsQualified = leads.filter((l) => l.status === 'qualified').length;
    const leadsConverted = leads.filter((l) => l.status === 'converted' || l.convertedAt).length;

    const avgSeriousnessScore =
      leads.length > 0
        ? leads.reduce((sum, l) => sum + (l.seriousnessScore || 0), 0) / leads.length
        : 0;

    const avgMatchScore =
      matches.length > 0
        ? matches.reduce((sum, m) => sum + (m.score || 0), 0) / matches.length
        : 0;

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      totals: {
        rawItemsScraped: leadsCreated, // Approximation - leads created equals items processed
        leadsCreated,
        leadsValid,
        leadsSuspicious,
        leadsSpam,
        matchesCreated: matches.length,
        leadsContacted,
        leadsQualified,
        leadsConverted,
      },
      rates: {
        leadConversionRate: leadsCreated > 0 ? (leadsConverted / leadsCreated) * 100 : 0,
        spamRate: leadsCreated > 0 ? (leadsSpam / leadsCreated) * 100 : 0,
        contactRate: leadsCreated > 0 ? (leadsContacted / leadsCreated) * 100 : 0,
        qualificationRate: leadsContacted > 0 ? (leadsQualified / leadsContacted) * 100 : 0,
        conversionRate: leadsQualified > 0 ? (leadsConverted / leadsQualified) * 100 : 0,
      },
      averages: {
        avgSeriousnessScore: Math.round(avgSeriousnessScore * 10) / 10,
        avgMatchScore: Math.round(avgMatchScore * 10) / 10,
        avgLeadsPerCampaign: campaigns > 0 ? Math.round((leadsCreated / campaigns) * 10) / 10 : 0,
      },
    };
  }

  /**
   * GET /ai-metrics/prospecting/by-source
   * Stats aggregated by scraping source
   */
  async getBySource(userId: string, query: ProspectingMetricsQueryDto): Promise<BySourceResponse> {
    const where = this.buildWhereClause(query, userId);

    const leads = await this.prisma.prospecting_leads.findMany({
      where,
      include: {
        prospecting_matches: { select: { score: true } },
      },
    });

    // Group by source
    const sourceMap = new Map<string, any>();

    for (const lead of leads) {
      const source = lead.source || 'unknown';
      if (!sourceMap.has(source)) {
        sourceMap.set(source, {
          source,
          rawItemsScraped: 0,
          leadsCreated: 0,
          leadsValid: 0,
          leadsSuspicious: 0,
          leadsSpam: 0,
          matchesCreated: 0,
          leadsContacted: 0,
          leadsConverted: 0,
          seriousnessScores: [],
          matchScores: [],
        });
      }

      const stats = sourceMap.get(source);
      stats.rawItemsScraped++;
      stats.leadsCreated++;

      if (lead.validationStatus === 'valid') stats.leadsValid++;
      if (lead.validationStatus === 'suspicious') stats.leadsSuspicious++;
      if (lead.validationStatus === 'spam') stats.leadsSpam++;
      if (lead.status === 'contacted') stats.leadsContacted++;
      if (lead.status === 'converted' || lead.convertedAt) stats.leadsConverted++;

      if (lead.seriousnessScore) stats.seriousnessScores.push(lead.seriousnessScore);
      stats.matchesCreated += lead.prospecting_matches.length;
      for (const match of lead.prospecting_matches) {
        if (match.score) stats.matchScores.push(match.score);
      }
    }

    const sources = Array.from(sourceMap.values()).map((s) => ({
      source: s.source,
      rawItemsScraped: s.rawItemsScraped,
      leadsCreated: s.leadsCreated,
      leadsValid: s.leadsValid,
      leadsSuspicious: s.leadsSuspicious,
      leadsSpam: s.leadsSpam,
      spamRate: s.leadsCreated > 0 ? Math.round((s.leadsSpam / s.leadsCreated) * 1000) / 10 : 0,
      matchesCreated: s.matchesCreated,
      leadsContacted: s.leadsContacted,
      leadsConverted: s.leadsConverted,
      conversionRate:
        s.leadsCreated > 0 ? Math.round((s.leadsConverted / s.leadsCreated) * 1000) / 10 : 0,
      avgSeriousnessScore:
        s.seriousnessScores.length > 0
          ? Math.round(
              (s.seriousnessScores.reduce((a: number, b: number) => a + b, 0) /
                s.seriousnessScores.length) *
                10,
            ) / 10
          : 0,
      avgMatchScore:
        s.matchScores.length > 0
          ? Math.round(
              (s.matchScores.reduce((a: number, b: number) => a + b, 0) / s.matchScores.length) *
                10,
            ) / 10
          : 0,
    }));

    return { sources };
  }

  /**
   * GET /ai-metrics/prospecting/by-campaign
   * Stats aggregated by campaign
   */
  async getByCampaign(
    userId: string,
    query: ProspectingMetricsQueryDto,
  ): Promise<ByCampaignResponse> {
    const { from, to } = this.getDateRange(query);

    const campaigns = await this.prisma.prospecting_campaigns.findMany({
      where: {
        userId: query.userId || userId,
        createdAt: { gte: from, lte: to },
      },
      include: {
        leads: {
          include: {
            prospecting_matches: { select: { score: true } },
          },
        },
      },
    });

    const result = campaigns.map((campaign) => {
      const leads = campaign.leads;
      const leadsCreated = leads.length;
      const leadsValid = leads.filter((l) => l.validationStatus === 'valid').length;
      const leadsSpam = leads.filter((l) => l.validationStatus === 'spam').length;
      const leadsContacted = leads.filter((l) => l.status === 'contacted').length;
      const leadsConverted = leads.filter((l) => l.status === 'converted' || l.convertedAt).length;

      const allMatches = leads.flatMap((l) => l.prospecting_matches);
      const matchScores = allMatches.map((m) => m.score).filter((s) => s != null);
      const seriousnessScores = leads
        .map((l) => l.seriousnessScore)
        .filter((s) => s != null) as number[];

      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        campaignType: campaign.type,
        createdAt: campaign.createdAt.toISOString(),
        status: campaign.status,
        leadsCreated,
        leadsValid,
        leadsSpam,
        spamRate: leadsCreated > 0 ? Math.round((leadsSpam / leadsCreated) * 1000) / 10 : 0,
        matchesCreated: allMatches.length,
        avgMatchScore:
          matchScores.length > 0
            ? Math.round(
                (matchScores.reduce((a, b) => a + b, 0) / matchScores.length) * 10,
              ) / 10
            : 0,
        leadsContacted,
        leadsConverted,
        conversionRate:
          leadsCreated > 0 ? Math.round((leadsConverted / leadsCreated) * 1000) / 10 : 0,
        avgSeriousnessScore:
          seriousnessScores.length > 0
            ? Math.round(
                (seriousnessScores.reduce((a, b) => a + b, 0) / seriousnessScores.length) * 10,
              ) / 10
            : 0,
      };
    });

    return { campaigns: result };
  }

  /**
   * GET /ai-metrics/prospecting/quality
   * AI accuracy metrics (spam detection, lead validation)
   */
  async getQuality(
    userId: string,
    query: ProspectingMetricsQueryDto,
  ): Promise<QualityMetricsResponse> {
    const where = this.buildWhereClause(query, userId);

    const [leads, matches] = await Promise.all([
      this.prisma.prospecting_leads.findMany({
        where,
        select: {
          validationStatus: true,
          status: true,
        },
      }),
      this.prisma.prospecting_matches.findMany({
        where: { lead: where },
        select: { score: true, status: true },
      }),
    ]);

    // Valid leads accuracy
    const validLeads = leads.filter((l) => l.validationStatus === 'valid');
    const validContacted = validLeads.filter((l) => l.status === 'contacted').length;
    const validRejected = validLeads.filter((l) => l.status === 'rejected').length;
    const validPending = validLeads.filter(
      (l) => l.status === 'new' || l.status === 'pending',
    ).length;

    // Spam leads accuracy
    const spamLeads = leads.filter((l) => l.validationStatus === 'spam');
    const spamRecovered = spamLeads.filter(
      (l) => l.status === 'contacted' || l.status === 'qualified' || l.status === 'converted',
    ).length;
    const spamIgnored = spamLeads.length - spamRecovered;

    // Suspicious leads
    const suspiciousLeads = leads.filter((l) => l.validationStatus === 'suspicious');
    const suspiciousValidated = suspiciousLeads.filter(
      (l) => l.status === 'qualified' || l.status === 'converted',
    ).length;
    const suspiciousRejected = suspiciousLeads.filter((l) => l.status === 'rejected').length;
    const suspiciousPending = suspiciousLeads.length - suspiciousValidated - suspiciousRejected;

    // Match accuracy by score
    const highScoreMatches = matches.filter((m) => m.score >= 80);
    const mediumScoreMatches = matches.filter((m) => m.score >= 60 && m.score < 80);
    const lowScoreMatches = matches.filter((m) => m.score >= 50 && m.score < 60);

    const highConverted = highScoreMatches.filter((m) => m.status === 'converted').length;
    const mediumConverted = mediumScoreMatches.filter((m) => m.status === 'converted').length;
    const lowConverted = lowScoreMatches.filter((m) => m.status === 'converted').length;

    return {
      aiAccuracy: {
        validLeads: {
          total: validLeads.length,
          contacted: validContacted,
          rejected: validRejected,
          pending: validPending,
          accuracyRate:
            validContacted + validRejected > 0
              ? Math.round((validContacted / (validContacted + validRejected)) * 1000) / 10
              : 0,
        },
        spamLeads: {
          total: spamLeads.length,
          recovered: spamRecovered,
          ignored: spamIgnored,
          accuracyRate:
            spamLeads.length > 0 ? Math.round((spamIgnored / spamLeads.length) * 1000) / 10 : 0,
        },
        suspiciousLeads: {
          total: suspiciousLeads.length,
          validated: suspiciousValidated,
          rejected: suspiciousRejected,
          pending: suspiciousPending,
        },
      },
      matchingAccuracy: {
        highScoreMatches: {
          total: highScoreMatches.length,
          converted: highConverted,
          conversionRate:
            highScoreMatches.length > 0
              ? Math.round((highConverted / highScoreMatches.length) * 1000) / 10
              : 0,
        },
        mediumScoreMatches: {
          total: mediumScoreMatches.length,
          converted: mediumConverted,
          conversionRate:
            mediumScoreMatches.length > 0
              ? Math.round((mediumConverted / mediumScoreMatches.length) * 1000) / 10
              : 0,
        },
        lowScoreMatches: {
          total: lowScoreMatches.length,
          converted: lowConverted,
          conversionRate:
            lowScoreMatches.length > 0
              ? Math.round((lowConverted / lowScoreMatches.length) * 1000) / 10
              : 0,
        },
      },
    };
  }

  /**
   * GET /ai-metrics/prospecting/score-distribution
   * Distribution of seriousness and match scores
   */
  async getScoreDistribution(
    userId: string,
    query: ProspectingMetricsQueryDto,
  ): Promise<ScoreDistributionResponse> {
    const where = this.buildWhereClause(query, userId);

    const [leads, matches] = await Promise.all([
      this.prisma.prospecting_leads.findMany({
        where,
        select: { seriousnessScore: true },
      }),
      this.prisma.prospecting_matches.findMany({
        where: { lead: where },
        select: { score: true },
      }),
    ]);

    const seriousnessScores = leads
      .map((l) => l.seriousnessScore)
      .filter((s) => s != null) as number[];
    const matchScores = matches.map((m) => m.score).filter((s) => s != null);

    return {
      seriousnessScore: this.calculateScoreDistribution(seriousnessScores, [
        { range: '0-20', min: 0, max: 20 },
        { range: '21-40', min: 21, max: 40 },
        { range: '41-60', min: 41, max: 60 },
        { range: '61-80', min: 61, max: 80 },
        { range: '81-100', min: 81, max: 100 },
      ]),
      matchScore: this.calculateScoreDistribution(matchScores, [
        { range: '50-59', min: 50, max: 59 },
        { range: '60-69', min: 60, max: 69 },
        { range: '70-79', min: 70, max: 79 },
        { range: '80-89', min: 80, max: 89 },
        { range: '90-100', min: 90, max: 100 },
      ]),
    };
  }

  private calculateScoreDistribution(
    scores: number[],
    ranges: { range: string; min: number; max: number }[],
  ) {
    const total = scores.length;
    const rangeResults = ranges.map((r) => {
      const count = scores.filter((s) => s >= r.min && s <= r.max).length;
      return {
        range: r.range,
        count,
        percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      };
    });

    const avg = total > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / total) * 10) / 10 : 0;
    const sorted = [...scores].sort((a, b) => a - b);
    const median = total > 0 ? sorted[Math.floor(total / 2)] : 0;

    return { ranges: rangeResults, avg, median };
  }

  /**
   * GET /ai-metrics/prospecting/timeline
   * Temporal evolution of metrics
   */
  async getTimeline(
    userId: string,
    query: ProspectingMetricsQueryDto,
    granularity: 'day' | 'week' | 'month' = 'day',
  ): Promise<TimelineResponse> {
    const where = this.buildWhereClause(query, userId);

    const leads = await this.prisma.prospecting_leads.findMany({
      where,
      include: {
        prospecting_matches: { select: { score: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by period
    const periodMap = new Map<string, any>();

    for (const lead of leads) {
      const periodKey = this.getPeriodKey(lead.createdAt, granularity);

      if (!periodMap.has(periodKey)) {
        periodMap.set(periodKey, {
          date: periodKey,
          leadsCreated: 0,
          leadsValid: 0,
          leadsSpam: 0,
          matchesCreated: 0,
          leadsContacted: 0,
          leadsConverted: 0,
          seriousnessScores: [],
          matchScores: [],
        });
      }

      const stats = periodMap.get(periodKey);
      stats.leadsCreated++;

      if (lead.validationStatus === 'valid') stats.leadsValid++;
      if (lead.validationStatus === 'spam') stats.leadsSpam++;
      if (lead.status === 'contacted') stats.leadsContacted++;
      if (lead.status === 'converted' || lead.convertedAt) stats.leadsConverted++;

      if (lead.seriousnessScore) stats.seriousnessScores.push(lead.seriousnessScore);
      stats.matchesCreated += lead.prospecting_matches.length;
      for (const match of lead.prospecting_matches) {
        if (match.score) stats.matchScores.push(match.score);
      }
    }

    const dataPoints = Array.from(periodMap.values())
      .map((p) => ({
        date: p.date,
        leadsCreated: p.leadsCreated,
        leadsValid: p.leadsValid,
        leadsSpam: p.leadsSpam,
        matchesCreated: p.matchesCreated,
        leadsContacted: p.leadsContacted,
        leadsConverted: p.leadsConverted,
        avgSeriousnessScore:
          p.seriousnessScores.length > 0
            ? Math.round(
                (p.seriousnessScores.reduce((a: number, b: number) => a + b, 0) /
                  p.seriousnessScores.length) *
                  10,
              ) / 10
            : 0,
        avgMatchScore:
          p.matchScores.length > 0
            ? Math.round(
                (p.matchScores.reduce((a: number, b: number) => a + b, 0) / p.matchScores.length) *
                  10,
              ) / 10
            : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { granularity, dataPoints };
  }

  private getPeriodKey(date: Date, granularity: 'day' | 'week' | 'month'): string {
    const d = new Date(date);
    switch (granularity) {
      case 'day':
        return d.toISOString().split('T')[0];
      case 'week':
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        return weekStart.toISOString().split('T')[0];
      case 'month':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    }
  }

  /**
   * GET /ai-metrics/prospecting/top-performers
   * Top campaigns, sources, and cities
   */
  async getTopPerformers(
    userId: string,
    query: ProspectingMetricsQueryDto,
    limit: number = 5,
  ): Promise<TopPerformersResponse> {
    const where = this.buildWhereClause(query, userId);

    const leads = await this.prisma.prospecting_leads.findMany({
      where,
      include: { campaigns: { select: { id: true, name: true } } },
    });

    // Group by campaign
    const campaignMap = new Map<string, any>();
    const sourceMap = new Map<string, any>();
    const cityMap = new Map<string, any>();

    for (const lead of leads) {
      const isConverted = lead.status === 'converted' || !!lead.convertedAt;

      // Campaign stats
      const campaignId = lead.campaignId;
      if (!campaignMap.has(campaignId)) {
        campaignMap.set(campaignId, {
          campaignId,
          campaignName: lead.campaigns.name,
          leadsCreated: 0,
          leadsConverted: 0,
        });
      }
      const campStats = campaignMap.get(campaignId);
      campStats.leadsCreated++;
      if (isConverted) campStats.leadsConverted++;

      // Source stats
      const source = lead.source || 'unknown';
      if (!sourceMap.has(source)) {
        sourceMap.set(source, { source, leadsCreated: 0, leadsConverted: 0 });
      }
      const srcStats = sourceMap.get(source);
      srcStats.leadsCreated++;
      if (isConverted) srcStats.leadsConverted++;

      // City stats
      const city = lead.city || 'unknown';
      if (!cityMap.has(city)) {
        cityMap.set(city, { city, leadsCreated: 0, leadsConverted: 0 });
      }
      const cityStats = cityMap.get(city);
      cityStats.leadsCreated++;
      if (isConverted) cityStats.leadsConverted++;
    }

    const calculateRate = (item: any) => ({
      ...item,
      conversionRate:
        item.leadsCreated > 0
          ? Math.round((item.leadsConverted / item.leadsCreated) * 1000) / 10
          : 0,
    });

    const topCampaigns = Array.from(campaignMap.values())
      .map(calculateRate)
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, limit);

    const topSources = Array.from(sourceMap.values())
      .map(calculateRate)
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, limit);

    const topCities = Array.from(cityMap.values())
      .map(calculateRate)
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, limit);

    return { topCampaigns, topSources, topCities };
  }

  /**
   * GET /ai-metrics/prospecting/insights
   * Auto-generated insights and recommendations
   */
  async getInsights(userId: string, query: ProspectingMetricsQueryDto): Promise<InsightsResponse> {
    const [overview, bySource, quality] = await Promise.all([
      this.getOverview(userId, query),
      this.getBySource(userId, query),
      this.getQuality(userId, query),
    ]);

    const insights: InsightItem[] = [];

    // Check spam rates by source
    for (const source of bySource.sources) {
      if (source.spamRate > 30 && source.leadsCreated >= 10) {
        insights.push({
          type: 'warning',
          category: 'spam',
          title: `Taux de spam élevé sur ${source.source}`,
          description: `${source.spamRate}% des leads de ${source.source} sont marqués spam, vs ${overview.rates.spamRate.toFixed(1)}% en moyenne.`,
          metric: source.spamRate,
          recommendation: `Affiner les critères de ciblage sur ${source.source} ou réduire le volume de scraping.`,
        });
      }

      if (source.conversionRate > overview.rates.leadConversionRate * 1.5 && source.leadsCreated >= 5) {
        insights.push({
          type: 'success',
          category: 'conversion',
          title: `Excellente performance ${source.source}`,
          description: `Les leads ${source.source} ont un taux de conversion de ${source.conversionRate}%, soit ${(source.conversionRate / overview.rates.leadConversionRate).toFixed(1)}x la moyenne.`,
          metric: source.conversionRate,
          recommendation: `Augmenter le budget scraping sur ${source.source}.`,
        });
      }
    }

    // Check AI accuracy
    const validAccuracy = quality.aiAccuracy.validLeads.accuracyRate;
    if (validAccuracy > 0 && validAccuracy < 60) {
      insights.push({
        type: 'warning',
        category: 'matching',
        title: "Précision IA à améliorer",
        description: `Seulement ${validAccuracy}% des leads marqués "valid" par l'IA sont effectivement contactés.`,
        metric: validAccuracy,
        recommendation: "Ajuster les seuils de scoring ou revoir les critères de validation IA.",
      });
    }

    // Check high score matches not contacted
    const highMatches = quality.matchingAccuracy.highScoreMatches;
    if (highMatches.total > 0) {
      const notContacted = highMatches.total - highMatches.converted;
      const notContactedRate = (notContacted / highMatches.total) * 100;
      if (notContactedRate > 40) {
        insights.push({
          type: 'info',
          category: 'matching',
          title: "Matches haute qualité peu exploités",
          description: `${Math.round(notContactedRate)}% des matches avec score > 80 ne sont pas encore convertis.`,
          metric: Math.round(notContactedRate),
          recommendation: "Prioriser le contact des matches à score élevé.",
        });
      }
    }

    // Check overall conversion rate
    if (overview.rates.leadConversionRate > 20) {
      insights.push({
        type: 'success',
        category: 'conversion',
        title: "Excellent taux de conversion global",
        description: `Votre taux de conversion de ${overview.rates.leadConversionRate.toFixed(1)}% est au-dessus de la moyenne du secteur.`,
        metric: overview.rates.leadConversionRate,
      });
    }

    // Check low contact rate
    if (overview.rates.contactRate < 30 && overview.totals.leadsCreated > 20) {
      insights.push({
        type: 'warning',
        category: 'conversion',
        title: "Taux de contact faible",
        description: `Seulement ${overview.rates.contactRate.toFixed(1)}% des leads ont été contactés.`,
        metric: overview.rates.contactRate,
        recommendation: "Augmenter la capacité de l'équipe commerciale ou automatiser les premiers contacts.",
      });
    }

    return { insights };
  }

  /**
   * GET /ai-metrics/prospecting/export
   * Export metrics as CSV
   */
  async exportData(
    userId: string,
    query: ProspectingMetricsQueryDto,
  ): Promise<{ filename: string; content: string; mimeType: string }> {
    const byCampaign = await this.getByCampaign(userId, query);

    // Generate CSV content
    const headers = [
      'campaignId',
      'campaignName',
      'source',
      'leadsCreated',
      'leadsValid',
      'leadsSpam',
      'spamRate',
      'matchesCreated',
      'avgMatchScore',
      'leadsContacted',
      'leadsConverted',
      'conversionRate',
    ];

    const rows = byCampaign.campaigns.map((c) => [
      c.campaignId,
      `"${c.campaignName}"`,
      c.campaignType,
      c.leadsCreated,
      c.leadsValid,
      c.leadsSpam,
      c.spamRate,
      c.matchesCreated,
      c.avgMatchScore,
      c.leadsContacted,
      c.leadsConverted,
      c.conversionRate,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return {
      filename: `ai-metrics-export-${new Date().toISOString().split('T')[0]}.csv`,
      content: csvContent,
      mimeType: 'text/csv',
    };
  }
}
