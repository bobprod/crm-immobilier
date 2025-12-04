import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import {
  ProspectingMetricsQueryDto,
  TimeSeriesQueryDto,
  ProspectingOverviewDto,
  LLMQualityMetricsDto,
  MatchingPerformanceDto,
  TimeSeriesDataPointDto,
  SourcePerformanceDto,
  CampaignPerformanceDto,
  ContactValidationMetricsDto,
  LocationPerformanceDto,
  BudgetAnalysisDto,
  TopPerformersDto,
} from './dto';

// Type aliases for where inputs (using Record for flexibility with Prisma)
type WhereInput = Record<string, unknown>;

@Injectable()
export class AIMetricsProspectingService {
  private readonly logger = new Logger(AIMetricsProspectingService.name);

  constructor(private prisma: PrismaService) {}

  // ============================================
  // HELPERS - Construction des filtres
  // ============================================

  private buildDateRange(from?: string, to?: string): { gte?: Date; lte?: Date } {
    const range: { gte?: Date; lte?: Date } = {};
    if (from) range.gte = new Date(from);
    if (to) range.lte = new Date(to);
    return range;
  }

  private buildLeadsWhere(
    userId: string,
    query: ProspectingMetricsQueryDto,
  ): WhereInput {
    const where: WhereInput = { userId };

    if (query.campaignId) {
      where.campaignId = query.campaignId;
    }

    const dateRange = this.buildDateRange(query.from, query.to);
    if (Object.keys(dateRange).length > 0) {
      where.createdAt = dateRange;
    }

    return where;
  }

  private buildMatchesWhere(
    userId: string,
    query: ProspectingMetricsQueryDto,
  ): WhereInput {
    const leadWhere: WhereInput = { userId };

    if (query.campaignId) {
      leadWhere.campaignId = query.campaignId;
    }

    const where: WhereInput = {
      lead: leadWhere,
    };

    const dateRange = this.buildDateRange(query.from, query.to);
    if (Object.keys(dateRange).length > 0) {
      where.createdAt = dateRange;
    }

    return where;
  }

  private buildCampaignsWhere(
    userId: string,
    query: ProspectingMetricsQueryDto,
  ): WhereInput {
    const where: WhereInput = { userId };

    if (query.campaignId) {
      where.id = query.campaignId;
    }

    const dateRange = this.buildDateRange(query.from, query.to);
    if (Object.keys(dateRange).length > 0) {
      where.createdAt = dateRange;
    }

    return where;
  }

  private buildValidationsWhere(
    userId: string,
    query: ProspectingMetricsQueryDto,
  ): WhereInput {
    const where: WhereInput = { userId };

    const dateRange = this.buildDateRange(query.from, query.to);
    if (Object.keys(dateRange).length > 0) {
      where.createdAt = dateRange;
    }

    return where;
  }

  private calculatePercentage(part: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((part / total) * 10000) / 100;
  }

  private getDateFormat(granularity: 'day' | 'week' | 'month'): string {
    switch (granularity) {
      case 'week':
        return 'YYYY-IW';
      case 'month':
        return 'YYYY-MM';
      default:
        return 'YYYY-MM-DD';
    }
  }

  // ============================================
  // 1. OVERVIEW - Vue d'ensemble
  // ============================================

  async getOverview(
    userId: string,
    query: ProspectingMetricsQueryDto,
  ): Promise<ProspectingOverviewDto> {
    this.logger.log(`Getting prospecting overview for user ${userId}`);

    const leadsWhere = this.buildLeadsWhere(userId, query);
    const matchesWhere = this.buildMatchesWhere(userId, query);

    const [
      totalLeads,
      leadsWithLLM,
      totalMatches,
      qualifiedMatches,
      seriousnessStats,
      matchScoreStats,
      convertedLeads,
    ] = await Promise.all([
      this.prisma.prospecting_leads.count({ where: leadsWhere }),
      this.prisma.prospecting_leads.count({
        where: { ...leadsWhere, seriousnessScore: { not: null } },
      }),
      this.prisma.prospecting_matches.count({ where: matchesWhere }),
      this.prisma.prospecting_matches.count({
        where: { ...matchesWhere, isQualified: true },
      }),
      this.prisma.prospecting_leads.aggregate({
        where: { ...leadsWhere, seriousnessScore: { not: null } },
        _avg: { seriousnessScore: true },
      }),
      this.prisma.prospecting_matches.aggregate({
        where: matchesWhere,
        _avg: { score: true },
      }),
      this.prisma.prospecting_leads.count({
        where: { ...leadsWhere, convertedProspectId: { not: null } },
      }),
    ]);

    return {
      totalLeadsProcessed: totalLeads,
      leadsWithLLMAnalysis: leadsWithLLM,
      llmCoverageRate: this.calculatePercentage(leadsWithLLM, totalLeads),
      totalMatches,
      qualifiedMatches,
      matchQualificationRate: this.calculatePercentage(qualifiedMatches, totalMatches),
      avgSeriousnessScore: Math.round((seriousnessStats._avg.seriousnessScore || 0) * 100) / 100,
      avgMatchScore: Math.round((matchScoreStats._avg.score || 0) * 100) / 100,
      convertedLeads,
      conversionRate: this.calculatePercentage(convertedLeads, totalLeads),
      period: {
        from: query.from || 'all-time',
        to: query.to || 'now',
      },
    };
  }

  // ============================================
  // 2. LEAD TYPE DISTRIBUTION
  // ============================================

  async getLeadTypeDistribution(userId: string, query: ProspectingMetricsQueryDto) {
    const leadsWhere = this.buildLeadsWhere(userId, query);

    const distribution = await this.prisma.prospecting_leads.groupBy({
      by: ['leadType'],
      where: leadsWhere,
      _count: true,
    });

    const total = distribution.reduce((sum, item) => sum + item._count, 0);

    return distribution.map((item) => ({
      leadType: item.leadType,
      count: item._count,
      percentage: this.calculatePercentage(item._count, total),
    }));
  }

  // ============================================
  // 3. INTENTION DISTRIBUTION
  // ============================================

  async getIntentionDistribution(userId: string, query: ProspectingMetricsQueryDto) {
    const leadsWhere = this.buildLeadsWhere(userId, query);

    const distribution = await this.prisma.prospecting_leads.groupBy({
      by: ['intention'],
      where: leadsWhere,
      _count: true,
    });

    const total = distribution.reduce((sum, item) => sum + item._count, 0);

    return distribution.map((item) => ({
      intention: item.intention || 'inconnu',
      count: item._count,
      percentage: this.calculatePercentage(item._count, total),
    }));
  }

  // ============================================
  // 4. URGENCY DISTRIBUTION
  // ============================================

  async getUrgencyDistribution(userId: string, query: ProspectingMetricsQueryDto) {
    const leadsWhere = this.buildLeadsWhere(userId, query);

    const distribution = await this.prisma.prospecting_leads.groupBy({
      by: ['urgency'],
      where: leadsWhere,
      _count: true,
    });

    const total = distribution.reduce((sum, item) => sum + item._count, 0);

    return distribution.map((item) => ({
      urgency: item.urgency || 'inconnu',
      count: item._count,
      percentage: this.calculatePercentage(item._count, total),
    }));
  }

  // ============================================
  // 5. VALIDATION STATUS DISTRIBUTION
  // ============================================

  async getValidationStatusDistribution(userId: string, query: ProspectingMetricsQueryDto) {
    const leadsWhere = this.buildLeadsWhere(userId, query);

    const distribution = await this.prisma.prospecting_leads.groupBy({
      by: ['validationStatus'],
      where: leadsWhere,
      _count: true,
    });

    const total = distribution.reduce((sum, item) => sum + item._count, 0);

    return distribution.map((item) => ({
      validationStatus: item.validationStatus,
      count: item._count,
      percentage: this.calculatePercentage(item._count, total),
    }));
  }

  // ============================================
  // 6. LLM QUALITY METRICS
  // ============================================

  async getLLMQualityMetrics(
    userId: string,
    query: ProspectingMetricsQueryDto,
  ): Promise<LLMQualityMetricsDto> {
    const leadsWhere = this.buildLeadsWhere(userId, query);
    const analyzedWhere = { ...leadsWhere, seriousnessScore: { not: null } };

    const [totalAnalyzed, leads, validLeads, spamLeads] = await Promise.all([
      this.prisma.prospecting_leads.count({ where: analyzedWhere }),
      this.prisma.prospecting_leads.findMany({
        where: analyzedWhere,
        select: {
          seriousnessScore: true,
          email: true,
          phone: true,
          city: true,
          budgetMin: true,
          budgetMax: true,
          firstName: true,
          lastName: true,
          propertyTypes: true,
          intention: true,
          urgency: true,
        },
      }),
      this.prisma.prospecting_leads.count({
        where: { ...analyzedWhere, validationStatus: 'valid' },
      }),
      this.prisma.prospecting_leads.count({
        where: { ...analyzedWhere, validationStatus: 'spam' },
      }),
    ]);

    // Calculate seriousness distribution
    const ranges = [
      { range: '0-20', min: 0, max: 20 },
      { range: '21-40', min: 21, max: 40 },
      { range: '41-60', min: 41, max: 60 },
      { range: '61-80', min: 61, max: 80 },
      { range: '81-100', min: 81, max: 100 },
    ];

    const seriousnessDistribution = ranges.map((range) => {
      const count = leads.filter(
        (l) =>
          l.seriousnessScore !== null &&
          l.seriousnessScore >= range.min &&
          l.seriousnessScore <= range.max,
      ).length;
      return {
        range: range.range,
        count,
        percentage: this.calculatePercentage(count, totalAnalyzed),
      };
    });

    // Calculate average and median
    const scores = leads
      .filter((l) => l.seriousnessScore !== null)
      .map((l) => l.seriousnessScore as number)
      .sort((a, b) => a - b);

    const avgScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    const medianScore = scores.length > 0
      ? scores.length % 2 === 0
        ? (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2
        : scores[Math.floor(scores.length / 2)]
      : 0;

    // Calculate data completeness
    const completenessScores = leads.map((lead) => {
      let filled = 0;
      const fields = [
        lead.email,
        lead.phone,
        lead.city,
        lead.budgetMin,
        lead.budgetMax,
        lead.firstName,
        lead.lastName,
        lead.propertyTypes?.length,
        lead.intention,
        lead.urgency,
      ];
      fields.forEach((f) => {
        if (f !== null && f !== undefined && f !== '') filled++;
      });
      return (filled / fields.length) * 100;
    });

    const avgDataCompleteness = completenessScores.length > 0
      ? completenessScores.reduce((a, b) => a + b, 0) / completenessScores.length
      : 0;

    return {
      totalAnalyzed,
      seriousnessDistribution,
      avgSeriousnessScore: Math.round(avgScore * 100) / 100,
      medianSeriousnessScore: Math.round(medianScore * 100) / 100,
      validLeadDetectionRate: this.calculatePercentage(validLeads, totalAnalyzed),
      spamDetectionRate: this.calculatePercentage(spamLeads, totalAnalyzed),
      avgDataCompleteness: Math.round(avgDataCompleteness * 100) / 100,
    };
  }

  // ============================================
  // 7. MATCHING PERFORMANCE
  // ============================================

  async getMatchingPerformance(
    userId: string,
    query: ProspectingMetricsQueryDto,
  ): Promise<MatchingPerformanceDto> {
    const matchesWhere = this.buildMatchesWhere(userId, query);

    const [totalMatches, qualifiedMatches, scoreStats, matches, statusDistribution] =
      await Promise.all([
        this.prisma.prospecting_matches.count({ where: matchesWhere }),
        this.prisma.prospecting_matches.count({
          where: { ...matchesWhere, isQualified: true },
        }),
        this.prisma.prospecting_matches.aggregate({
          where: matchesWhere,
          _avg: { score: true },
        }),
        this.prisma.prospecting_matches.findMany({
          where: matchesWhere,
          select: { score: true },
        }),
        this.prisma.prospecting_matches.groupBy({
          by: ['status'],
          where: matchesWhere,
          _count: true,
        }),
      ]);

    // Score distribution
    const scoreRanges = [
      { range: '0-20', min: 0, max: 20 },
      { range: '21-40', min: 21, max: 40 },
      { range: '41-60', min: 41, max: 60 },
      { range: '61-80', min: 61, max: 80 },
      { range: '81-100', min: 81, max: 100 },
    ];

    const scoreDistribution = scoreRanges.map((range) => {
      const count = matches.filter(
        (m) => m.score >= range.min && m.score <= range.max,
      ).length;
      return {
        range: range.range,
        count,
        percentage: this.calculatePercentage(count, totalMatches),
      };
    });

    // Median score
    const scores = matches.map((m) => m.score).sort((a, b) => a - b);
    const medianScore = scores.length > 0
      ? scores.length % 2 === 0
        ? (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2
        : scores[Math.floor(scores.length / 2)]
      : 0;

    // Status distribution
    const statusDist = statusDistribution.map((item) => ({
      status: item.status,
      count: item._count,
      percentage: this.calculatePercentage(item._count, totalMatches),
    }));

    // Conversion funnel
    const funnel = {
      pending: 0,
      notified: 0,
      contacted: 0,
      converted: 0,
      ignored: 0,
    };
    statusDistribution.forEach((item) => {
      if (item.status in funnel) {
        funnel[item.status as keyof typeof funnel] = item._count;
      }
    });

    return {
      totalMatches,
      qualifiedMatches,
      qualificationRate: this.calculatePercentage(qualifiedMatches, totalMatches),
      avgScore: Math.round((scoreStats._avg.score || 0) * 100) / 100,
      medianScore: Math.round(medianScore * 100) / 100,
      scoreDistribution,
      statusDistribution: statusDist,
      conversionFunnel: funnel,
    };
  }

  // ============================================
  // 8. TIME SERIES DATA
  // ============================================

  async getTimeSeries(
    userId: string,
    query: TimeSeriesQueryDto,
  ): Promise<TimeSeriesDataPointDto[]> {
    const granularity = query.granularity || 'day';
    const leadsWhere = this.buildLeadsWhere(userId, query);

    // Get all leads and matches within the period
    const [leads, matches] = await Promise.all([
      this.prisma.prospecting_leads.findMany({
        where: leadsWhere,
        select: {
          id: true,
          createdAt: true,
          seriousnessScore: true,
          convertedProspectId: true,
        },
      }),
      this.prisma.prospecting_matches.findMany({
        where: this.buildMatchesWhere(userId, query),
        select: {
          id: true,
          createdAt: true,
          score: true,
          isQualified: true,
        },
      }),
    ]);

    // Group by date
    const groupByDate = (date: Date): string => {
      const d = new Date(date);
      switch (granularity) {
        case 'week':
          const startOfWeek = new Date(d);
          startOfWeek.setDate(d.getDate() - d.getDay());
          return startOfWeek.toISOString().split('T')[0];
        case 'month':
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        default:
          return d.toISOString().split('T')[0];
      }
    };

    const grouped: Record<string, {
      leadsCreated: number;
      leadsAnalyzed: number;
      matchesCreated: number;
      qualifiedMatches: number;
      seriousnessScores: number[];
      matchScores: number[];
      conversions: number;
    }> = {};

    leads.forEach((lead) => {
      const date = groupByDate(lead.createdAt);
      if (!grouped[date]) {
        grouped[date] = {
          leadsCreated: 0,
          leadsAnalyzed: 0,
          matchesCreated: 0,
          qualifiedMatches: 0,
          seriousnessScores: [],
          matchScores: [],
          conversions: 0,
        };
      }
      grouped[date].leadsCreated++;
      if (lead.seriousnessScore !== null) {
        grouped[date].leadsAnalyzed++;
        grouped[date].seriousnessScores.push(lead.seriousnessScore);
      }
      if (lead.convertedProspectId) {
        grouped[date].conversions++;
      }
    });

    matches.forEach((match) => {
      const date = groupByDate(match.createdAt);
      if (!grouped[date]) {
        grouped[date] = {
          leadsCreated: 0,
          leadsAnalyzed: 0,
          matchesCreated: 0,
          qualifiedMatches: 0,
          seriousnessScores: [],
          matchScores: [],
          conversions: 0,
        };
      }
      grouped[date].matchesCreated++;
      grouped[date].matchScores.push(match.score);
      if (match.isQualified) {
        grouped[date].qualifiedMatches++;
      }
    });

    // Convert to array and calculate averages
    return Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        leadsCreated: data.leadsCreated,
        leadsAnalyzed: data.leadsAnalyzed,
        matchesCreated: data.matchesCreated,
        qualifiedMatches: data.qualifiedMatches,
        avgSeriousnessScore:
          data.seriousnessScores.length > 0
            ? Math.round(
                (data.seriousnessScores.reduce((a, b) => a + b, 0) /
                  data.seriousnessScores.length) *
                  100,
              ) / 100
            : 0,
        avgMatchScore:
          data.matchScores.length > 0
            ? Math.round(
                (data.matchScores.reduce((a, b) => a + b, 0) / data.matchScores.length) *
                  100,
              ) / 100
            : 0,
        conversions: data.conversions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // ============================================
  // 9. SOURCE PERFORMANCE
  // ============================================

  async getSourcePerformance(
    userId: string,
    query: ProspectingMetricsQueryDto,
  ): Promise<SourcePerformanceDto[]> {
    const leadsWhere = this.buildLeadsWhere(userId, query);

    const sourceStats = await this.prisma.prospecting_leads.groupBy({
      by: ['source'],
      where: leadsWhere,
      _count: true,
      _avg: { seriousnessScore: true },
    });

    const results: SourcePerformanceDto[] = [];

    for (const stat of sourceStats) {
      const sourceWhere = { ...leadsWhere, source: stat.source };

      const [validCount, spamCount, convertedCount, matches, matchScoreAvg] =
        await Promise.all([
          this.prisma.prospecting_leads.count({
            where: { ...sourceWhere, validationStatus: 'valid' },
          }),
          this.prisma.prospecting_leads.count({
            where: { ...sourceWhere, validationStatus: 'spam' },
          }),
          this.prisma.prospecting_leads.count({
            where: { ...sourceWhere, convertedProspectId: { not: null } },
          }),
          this.prisma.prospecting_matches.count({
            where: { lead: sourceWhere },
          }),
          this.prisma.prospecting_matches.aggregate({
            where: { lead: sourceWhere },
            _avg: { score: true },
          }),
        ]);

      results.push({
        source: stat.source || 'unknown',
        leadsCount: stat._count,
        avgSeriousnessScore: Math.round((stat._avg.seriousnessScore || 0) * 100) / 100,
        validRate: this.calculatePercentage(validCount, stat._count),
        spamRate: this.calculatePercentage(spamCount, stat._count),
        conversionRate: this.calculatePercentage(convertedCount, stat._count),
        matchesGenerated: matches,
        avgMatchScore: Math.round((matchScoreAvg._avg.score || 0) * 100) / 100,
      });
    }

    return results.sort((a, b) => b.leadsCount - a.leadsCount);
  }

  // ============================================
  // 10. CAMPAIGN PERFORMANCE
  // ============================================

  async getCampaignPerformance(
    userId: string,
    query: ProspectingMetricsQueryDto,
  ): Promise<CampaignPerformanceDto[]> {
    const campaignsWhere = this.buildCampaignsWhere(userId, query);

    const campaigns = await this.prisma.prospecting_campaigns.findMany({
      where: campaignsWhere,
      include: {
        leads: {
          select: {
            id: true,
            seriousnessScore: true,
            convertedProspectId: true,
            prospecting_matches: {
              select: {
                score: true,
                isQualified: true,
              },
            },
          },
        },
      },
    });

    return campaigns.map((campaign) => {
      const leads = campaign.leads;
      const analyzedLeads = leads.filter((l) => l.seriousnessScore !== null);
      const allMatches = leads.flatMap((l) => l.prospecting_matches);
      const qualifiedMatches = allMatches.filter((m) => m.isQualified);
      const convertedLeads = leads.filter((l) => l.convertedProspectId !== null);

      const avgSeriousness = analyzedLeads.length > 0
        ? analyzedLeads.reduce((sum, l) => sum + (l.seriousnessScore || 0), 0) /
          analyzedLeads.length
        : 0;

      const avgMatchScore = allMatches.length > 0
        ? allMatches.reduce((sum, m) => sum + m.score, 0) / allMatches.length
        : 0;

      const conversionRate = this.calculatePercentage(convertedLeads.length, leads.length);

      // Efficiency score: weighted combination of metrics
      const efficiencyScore = Math.round(
        (avgSeriousness * 0.3) +
        (this.calculatePercentage(qualifiedMatches.length, allMatches.length || 1) * 0.3) +
        (conversionRate * 0.4)
      );

      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        status: campaign.status,
        type: campaign.type,
        leadsFound: leads.length,
        leadsAnalyzed: analyzedLeads.length,
        avgSeriousnessScore: Math.round(avgSeriousness * 100) / 100,
        matchesCount: allMatches.length,
        qualifiedMatches: qualifiedMatches.length,
        avgMatchScore: Math.round(avgMatchScore * 100) / 100,
        conversionRate,
        efficiencyScore,
      };
    });
  }

  // ============================================
  // 11. CONTACT VALIDATION METRICS
  // ============================================

  async getContactValidationMetrics(
    userId: string,
    query: ProspectingMetricsQueryDto,
  ): Promise<ContactValidationMetricsDto> {
    const validationsWhere = this.buildValidationsWhere(userId, query);

    const [
      totalValidations,
      emailValidations,
      phoneValidations,
      validCount,
      spamCount,
      disposableCount,
      catchAllCount,
    ] = await Promise.all([
      this.prisma.contact_validations.count({ where: validationsWhere }),
      this.prisma.contact_validations.count({
        where: { ...validationsWhere, contactType: 'email' },
      }),
      this.prisma.contact_validations.count({
        where: { ...validationsWhere, contactType: 'phone' },
      }),
      this.prisma.contact_validations.count({
        where: { ...validationsWhere, isValid: true },
      }),
      this.prisma.contact_validations.count({
        where: { ...validationsWhere, isSpam: true },
      }),
      this.prisma.contact_validations.count({
        where: { ...validationsWhere, isDisposable: true },
      }),
      this.prisma.contact_validations.count({
        where: { ...validationsWhere, isCatchAll: true },
      }),
    ]);

    const invalidCount = totalValidations - validCount;

    return {
      totalValidations,
      emailValidations,
      phoneValidations,
      validRate: this.calculatePercentage(validCount, totalValidations),
      spamRate: this.calculatePercentage(spamCount, totalValidations),
      disposableRate: this.calculatePercentage(disposableCount, totalValidations),
      resultDistribution: {
        valid: validCount,
        invalid: invalidCount,
        spam: spamCount,
        disposable: disposableCount,
        catchAll: catchAllCount,
      },
    };
  }

  // ============================================
  // 12. LOCATION PERFORMANCE
  // ============================================

  async getLocationPerformance(
    userId: string,
    query: ProspectingMetricsQueryDto,
  ): Promise<LocationPerformanceDto[]> {
    const leadsWhere = this.buildLeadsWhere(userId, query);

    const locationStats = await this.prisma.prospecting_leads.groupBy({
      by: ['city', 'country'],
      where: { ...leadsWhere, city: { not: null } },
      _count: true,
      _avg: { seriousnessScore: true },
    });

    const results: LocationPerformanceDto[] = [];

    for (const stat of locationStats) {
      if (!stat.city) continue;

      const locationWhere = { ...leadsWhere, city: stat.city };

      const [convertedCount, matches, matchStats, qualifiedMatches] = await Promise.all([
        this.prisma.prospecting_leads.count({
          where: { ...locationWhere, convertedProspectId: { not: null } },
        }),
        this.prisma.prospecting_matches.count({
          where: { lead: locationWhere },
        }),
        this.prisma.prospecting_matches.aggregate({
          where: { lead: locationWhere },
          _avg: { score: true },
        }),
        this.prisma.prospecting_matches.count({
          where: { lead: locationWhere, isQualified: true },
        }),
      ]);

      results.push({
        city: stat.city,
        country: stat.country || 'Tunisie',
        leadsCount: stat._count,
        avgSeriousnessScore: Math.round((stat._avg.seriousnessScore || 0) * 100) / 100,
        matchesCount: matches,
        avgMatchScore: Math.round((matchStats._avg.score || 0) * 100) / 100,
        qualificationRate: this.calculatePercentage(qualifiedMatches, matches),
        conversionRate: this.calculatePercentage(convertedCount, stat._count),
      });
    }

    return results.sort((a, b) => b.leadsCount - a.leadsCount);
  }

  // ============================================
  // 13. BUDGET ANALYSIS
  // ============================================

  async getBudgetAnalysis(
    userId: string,
    query: ProspectingMetricsQueryDto,
  ): Promise<BudgetAnalysisDto> {
    const leadsWhere = this.buildLeadsWhere(userId, query);
    const budgetWhere = {
      ...leadsWhere,
      OR: [{ budgetMin: { not: null } }, { budgetMax: { not: null } }],
    };

    const [totalLeads, leadsWithBudget, budgetStats, currencyStats] = await Promise.all([
      this.prisma.prospecting_leads.count({ where: leadsWhere }),
      this.prisma.prospecting_leads.count({ where: budgetWhere }),
      this.prisma.prospecting_leads.aggregate({
        where: budgetWhere,
        _avg: { budgetMin: true, budgetMax: true },
      }),
      this.prisma.prospecting_leads.groupBy({
        by: ['budgetCurrency'],
        where: budgetWhere,
        _count: true,
      }),
    ]);

    // Get budget ranges for distribution
    const leads = await this.prisma.prospecting_leads.findMany({
      where: budgetWhere,
      select: { budgetMin: true, budgetMax: true },
    });

    const budgetRanges = [
      { range: '0-100K', min: 0, max: 100000 },
      { range: '100K-300K', min: 100000, max: 300000 },
      { range: '300K-500K', min: 300000, max: 500000 },
      { range: '500K-1M', min: 500000, max: 1000000 },
      { range: '1M+', min: 1000000, max: Infinity },
    ];

    const budgetRangeDistribution = budgetRanges.map((range) => {
      const count = leads.filter((l) => {
        const budget = l.budgetMax || l.budgetMin || 0;
        return budget >= range.min && budget < range.max;
      }).length;
      return {
        range: range.range,
        count,
        percentage: this.calculatePercentage(count, leadsWithBudget),
      };
    });

    // Find primary currency
    const primaryCurrency = currencyStats.length > 0
      ? currencyStats.sort((a, b) => b._count - a._count)[0].budgetCurrency || 'TND'
      : 'TND';

    return {
      avgBudgetMin: Math.round((budgetStats._avg.budgetMin || 0) * 100) / 100,
      avgBudgetMax: Math.round((budgetStats._avg.budgetMax || 0) * 100) / 100,
      budgetRangeDistribution,
      budgetCoverageRate: this.calculatePercentage(leadsWithBudget, totalLeads),
      primaryCurrency,
    };
  }

  // ============================================
  // 14. TOP PERFORMERS
  // ============================================

  async getTopPerformers(
    userId: string,
    query: ProspectingMetricsQueryDto,
    limit: number = 10,
  ): Promise<TopPerformersDto> {
    const leadsWhere = this.buildLeadsWhere(userId, query);
    const matchesWhere = this.buildMatchesWhere(userId, query);
    const campaignsWhere = this.buildCampaignsWhere(userId, query);

    const [topLeads, topMatches, campaigns] = await Promise.all([
      this.prisma.prospecting_leads.findMany({
        where: { ...leadsWhere, seriousnessScore: { not: null } },
        orderBy: { seriousnessScore: 'desc' },
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          seriousnessScore: true,
          leadType: true,
          city: true,
        },
      }),
      this.prisma.prospecting_matches.findMany({
        where: matchesWhere,
        orderBy: { score: 'desc' },
        take: limit,
        select: {
          id: true,
          leadId: true,
          propertyId: true,
          score: true,
          status: true,
          isQualified: true,
        },
      }),
      this.prisma.prospecting_campaigns.findMany({
        where: campaignsWhere,
        include: {
          leads: {
            select: {
              id: true,
              convertedProspectId: true,
            },
          },
        },
      }),
    ]);

    // Calculate campaign efficiency
    const topCampaigns = campaigns
      .map((campaign) => {
        const leads = campaign.leads;
        const converted = leads.filter((l) => l.convertedProspectId !== null).length;
        const conversionRate = this.calculatePercentage(converted, leads.length);
        const efficiencyScore = Math.round(conversionRate * (leads.length / 100 + 1));
        return {
          id: campaign.id,
          name: campaign.name,
          leadsCount: leads.length,
          conversionRate,
          efficiencyScore,
        };
      })
      .sort((a, b) => b.efficiencyScore - a.efficiencyScore)
      .slice(0, limit);

    return {
      topLeadsBySeriousness: topLeads.map((l) => ({
        id: l.id,
        firstName: l.firstName || '',
        lastName: l.lastName || '',
        email: l.email || '',
        seriousnessScore: l.seriousnessScore || 0,
        leadType: l.leadType,
        city: l.city || '',
      })),
      topMatchesByScore: topMatches,
      topCampaigns,
    };
  }

  // ============================================
  // 15. GLOBAL SUMMARY (Combined metrics)
  // ============================================

  async getGlobalSummary(userId: string, query: ProspectingMetricsQueryDto) {
    const [
      overview,
      leadTypeDistribution,
      intentionDistribution,
      validationDistribution,
      llmQuality,
      matchingPerformance,
    ] = await Promise.all([
      this.getOverview(userId, query),
      this.getLeadTypeDistribution(userId, query),
      this.getIntentionDistribution(userId, query),
      this.getValidationStatusDistribution(userId, query),
      this.getLLMQualityMetrics(userId, query),
      this.getMatchingPerformance(userId, query),
    ]);

    return {
      overview,
      distributions: {
        leadType: leadTypeDistribution,
        intention: intentionDistribution,
        validationStatus: validationDistribution,
      },
      llmQuality,
      matchingPerformance,
    };
  }
}
