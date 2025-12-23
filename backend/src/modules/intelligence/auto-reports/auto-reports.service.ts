import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GenerateReportDto, ReportData } from './dto/generate-report.dto';

@Injectable()
export class AutoReportsService {
  private readonly logger = new Logger(AutoReportsService.name);
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Générer un rapport automatique
   */
  async generateReport(
    userId: string,
    dto: GenerateReportDto,
  ): Promise<ReportData> {
    try {
      this.logger.log(`Generating ${dto.reportType} report for user ${userId}`);

      const { startDate, endDate, label } = this.getReportPeriod(dto);

      // Collecter les données
      const summary = await this.collectSummaryData(userId, startDate, endDate);

      // Générer des insights avec l'IA
      const insights = await this.generateInsights(summary);

      // Générer des recommandations
      const recommendations = await this.generateRecommendations(summary, insights);

      const reportData: ReportData = {
        period: {
          startDate,
          endDate,
          label,
        },
        summary,
        insights,
        recommendations,
      };

      return reportData;
    } catch (error) {
      this.logger.error(`Error generating report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtenir la période du rapport
   */
  private getReportPeriod(dto: GenerateReportDto): {
    startDate: Date;
    endDate: Date;
    label: string;
  } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    let label: string;

    if (dto.reportType === 'custom' && dto.startDate && dto.endDate) {
      startDate = new Date(dto.startDate);
      endDate = new Date(dto.endDate);
      label = 'Période personnalisée';
    } else if (dto.reportType === 'daily') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      label = 'Aujourd\'hui';
    } else if (dto.reportType === 'weekly') {
      const dayOfWeek = now.getDay();
      startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      label = 'Cette semaine';
    } else {
      // monthly
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      label = 'Ce mois';
    }

    return { startDate, endDate, label };
  }

  /**
   * Collecter les données de synthèse
   */
  private async collectSummaryData(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    try {
      // Prospects
      const totalProspects = await this.prisma.prospects.count({
        where: { userId },
      });

      const newProspects = await this.prisma.prospects.count({
        where: {
          userId,
          createdAt: { gte: startDate, lte: endDate },
        },
      });

      const qualifiedProspects = await this.prisma.prospects.count({
        where: {
          userId,
          status: 'qualified',
          createdAt: { gte: startDate, lte: endDate },
        },
      });

      // Propriétés
      const totalProperties = await this.prisma.properties.count({
        where: { userId },
      });

      const newProperties = await this.prisma.properties.count({
        where: {
          userId,
          createdAt: { gte: startDate, lte: endDate },
        },
      });

      // Rendez-vous
      const totalAppointments = await this.prisma.appointments.count({
        where: {
          userId,
          startTime: { gte: startDate, lte: endDate },
        },
      });

      const completedAppointments = await this.prisma.appointments.count({
        where: {
          userId,
          startTime: { gte: startDate, lte: endDate },
          status: 'completed',
        },
      });

      return {
        totalProspects,
        newProspects,
        qualifiedProspects,
        totalProperties,
        newProperties,
        totalAppointments,
        completedAppointments,
        revenue: 0, // À calculer si disponible
      };
    } catch (error) {
      this.logger.error(`Error collecting summary data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Générer des insights avec l'IA
   */
  private async generateInsights(summary: any): Promise<string[]> {
    try {
      if (!this.openai) {
        return this.generateStaticInsights(summary);
      }

      const prompt = `Analyze this real estate CRM data and provide 3-5 key insights in French:

Data:
- Total prospects: ${summary.totalProspects}
- New prospects this period: ${summary.newProspects}
- Qualified prospects: ${summary.qualifiedProspects}
- Total properties: ${summary.totalProperties}
- New properties: ${summary.newProperties}
- Total appointments: ${summary.totalAppointments}
- Completed appointments: ${completedAppointments}

Provide concise, actionable insights. Return as JSON array of strings.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      });

      const content = response.choices[0]?.message?.content || '[]';
      const insights = JSON.parse(content);

      return Array.isArray(insights) ? insights : this.generateStaticInsights(summary);
    } catch (error) {
      this.logger.error(`Error generating insights: ${error.message}`);
      return this.generateStaticInsights(summary);
    }
  }

  /**
   * Générer des insights statiques (sans IA)
   */
  private generateStaticInsights(summary: any): string[] {
    const insights: string[] = [];

    if (summary.newProspects > 0) {
      insights.push(
        `${summary.newProspects} nouveaux prospects ajoutés pendant cette période`,
      );
    }

    const qualificationRate =
      summary.newProspects > 0
        ? (summary.qualifiedProspects / summary.newProspects) * 100
        : 0;

    if (qualificationRate > 0) {
      insights.push(
        `Taux de qualification: ${qualificationRate.toFixed(1)}%`,
      );
    }

    if (summary.totalAppointments > 0) {
      const completionRate =
        (summary.completedAppointments / summary.totalAppointments) * 100;
      insights.push(
        `${summary.completedAppointments} rendez-vous complétés sur ${summary.totalAppointments} (${completionRate.toFixed(1)}%)`,
      );
    }

    if (summary.newProperties > 0) {
      insights.push(
        `${summary.newProperties} nouvelles propriétés ajoutées au catalogue`,
      );
    }

    return insights.length > 0
      ? insights
      : ['Aucune activité significative pendant cette période'];
  }

  /**
   * Générer des recommandations
   */
  private async generateRecommendations(
    summary: any,
    insights: string[],
  ): Promise<string[]> {
    try {
      if (!this.openai) {
        return this.generateStaticRecommendations(summary);
      }

      const prompt = `Based on this CRM data and insights, provide 3-5 actionable recommendations in French:

Data:
${JSON.stringify(summary, null, 2)}

Insights:
${insights.join('\n')}

Provide specific, actionable recommendations. Return as JSON array of strings.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      });

      const content = response.choices[0]?.message?.content || '[]';
      const recommendations = JSON.parse(content);

      return Array.isArray(recommendations)
        ? recommendations
        : this.generateStaticRecommendations(summary);
    } catch (error) {
      this.logger.error(`Error generating recommendations: ${error.message}`);
      return this.generateStaticRecommendations(summary);
    }
  }

  /**
   * Générer des recommandations statiques
   */
  private generateStaticRecommendations(summary: any): string[] {
    const recommendations: string[] = [];

    if (summary.newProspects < 5) {
      recommendations.push(
        'Intensifier la prospection pour augmenter le nombre de nouveaux contacts',
      );
    }

    const qualificationRate =
      summary.newProspects > 0
        ? (summary.qualifiedProspects / summary.newProspects) * 100
        : 0;

    if (qualificationRate < 50) {
      recommendations.push(
        'Améliorer le processus de qualification des prospects',
      );
    }

    if (summary.totalAppointments === 0) {
      recommendations.push(
        'Planifier plus de rendez-vous avec les prospects qualifiés',
      );
    }

    if (summary.newProperties === 0) {
      recommendations.push(
        'Enrichir le catalogue de propriétés pour répondre aux demandes',
      );
    }

    recommendations.push(
      'Utiliser les modules AI du CRM pour optimiser votre workflow',
    );

    return recommendations;
  }

  /**
   * Obtenir l'historique des rapports
   */
  async getReportHistory(userId: string, limit: number = 10): Promise<any[]> {
    try {
      // À implémenter: stocker les rapports générés dans la base de données
      // Pour l'instant, retourner un tableau vide
      return [];
    } catch (error) {
      this.logger.error(`Error getting report history: ${error.message}`);
      return [];
    }
  }
}
