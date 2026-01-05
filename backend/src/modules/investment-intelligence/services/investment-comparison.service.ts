/**
 * Investment Comparison Service
 * Handles comparing multiple investment projects
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import {
  ComparisonCriteria,
  ComparisonResult,
} from '../types/investment-project.types';
import { InvestmentComparison, InvestmentProject } from '@prisma/client';

@Injectable()
export class InvestmentComparisonService {
  private readonly logger = new Logger(InvestmentComparisonService.name);

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Compare multiple investment projects
   */
  async compareProjects(
    projectIds: string[],
    criteria: ComparisonCriteria,
    userId: string,
    name?: string,
  ): Promise<InvestmentComparison> {
    this.logger.log(`Comparing ${projectIds.length} projects`);

    if (projectIds.length < 2) {
      throw new BadRequestException('At least 2 projects required for comparison');
    }

    if (projectIds.length > 10) {
      throw new BadRequestException('Cannot compare more than 10 projects at once');
    }

    // Fetch projects
    const projects = await this.prisma.investmentProject.findMany({
      where: {
        id: { in: projectIds },
      },
      include: {
        analyses: {
          orderBy: { analyzedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (projects.length !== projectIds.length) {
      throw new BadRequestException('One or more projects not found');
    }

    // Calculate scores
    const results = this.calculateComparisonScores(projects, criteria);

    // Determine winner
    const winner = results.reduce((best, current) =>
      current.scores.overall > best.scores.overall ? current : best,
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(results, criteria);

    // Save comparison
    const comparison = await this.prisma.investmentComparison.create({
      data: {
        id: this.generateId(),
        userId,
        name: name || `Comparison ${new Date().toLocaleDateString()}`,
        projectIds,
        criteria: criteria as any,
        results: results as any,
        winner: winner.projectId,
        recommendations,
        comparedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Comparison created: ${comparison.id}`);
    return comparison;
  }

  /**
   * Get comparison by ID
   */
  async getComparison(comparisonId: string): Promise<InvestmentComparison | null> {
    return this.prisma.investmentComparison.findUnique({
      where: { id: comparisonId },
    });
  }

  /**
   * List comparisons for user
   */
  async listComparisons(userId: string): Promise<InvestmentComparison[]> {
    return this.prisma.investmentComparison.findMany({
      where: { userId },
      orderBy: { comparedAt: 'desc' },
      take: 20,
    });
  }

  /**
   * Delete comparison
   */
  async deleteComparison(comparisonId: string): Promise<void> {
    await this.prisma.investmentComparison.delete({
      where: { id: comparisonId },
    });
  }

  // ============================================
  // Private Methods
  // ============================================

  private calculateComparisonScores(
    projects: any[],
    criteria: ComparisonCriteria,
  ): ComparisonResult[] {
    const weights = {
      location: criteria.weights?.location || 0.2,
      yield: criteria.weights?.yield || 0.3,
      risk: criteria.weights?.risk || 0.2,
      liquidity: criteria.weights?.liquidity || 0.15,
      ticket: criteria.weights?.ticket || 0.1,
      duration: criteria.weights?.duration || 0.05,
    };

    const results: ComparisonResult[] = projects.map((project) => {
      const analysis = project.analyses[0];

      // Calculate individual scores (0-100)
      const locationScore = analysis?.locationScore || 50;
      const yieldScore = this.calculateYieldScore(project.targetYield);
      const riskScore = 100 - (analysis?.riskScore || 50); // Invert risk (lower is better)
      const liquidityScore = analysis?.liquidityScore || 50;
      const ticketScore = this.calculateTicketScore(project.minTicket, criteria);
      const durationScore = this.calculateDurationScore(
        criteria,
        project.durationMonths,
      );

      // Calculate weighted overall score
      const overall =
        locationScore * weights.location +
        yieldScore * weights.yield +
        riskScore * weights.risk +
        liquidityScore * weights.liquidity +
        ticketScore * weights.ticket +
        durationScore * weights.duration;

      // Generate pros and cons
      const pros = this.generatePros(project, analysis);
      const cons = this.generateCons(project, analysis);

      return {
        projectId: project.id,
        scores: {
          overall: Math.round(overall),
          location: locationScore,
          yield: yieldScore,
          risk: riskScore,
          liquidity: liquidityScore,
          ticket: ticketScore,
          duration: durationScore,
        },
        ranking: 0, // Will be set after sorting
        pros,
        cons,
      };
    });

    // Sort by overall score and assign rankings
    results.sort((a, b) => b.scores.overall - a.scores.overall);
    results.forEach((result, index) => {
      result.ranking = index + 1;
    });

    return results;
  }

  private calculateYieldScore(targetYield?: number | null): number {
    if (!targetYield) return 50;

    // Score based on typical crowdfunding yields (4-12%)
    if (targetYield < 4) return 30;
    if (targetYield < 6) return 60;
    if (targetYield < 8) return 80;
    if (targetYield < 10) return 90;
    if (targetYield < 12) return 95;
    return 100; // Very high yield (but also potentially higher risk)
  }

  private calculateTicketScore(
    minTicket: number,
    criteria: ComparisonCriteria,
  ): number {
    // Lower ticket = higher score (more accessible)
    const maxTicket = criteria.filters?.maxTicket || 10000;

    if (minTicket <= 100) return 100;
    if (minTicket <= 500) return 90;
    if (minTicket <= 1000) return 80;
    if (minTicket <= maxTicket) return 60;
    return 40; // Above user's max ticket
  }

  private calculateDurationScore(
    criteria: ComparisonCriteria,
    durationMonths?: number | null,
  ): number {
    if (!durationMonths) return 50;

    // Shorter duration = higher score (faster liquidity)
    if (durationMonths <= 12) return 100;
    if (durationMonths <= 24) return 80;
    if (durationMonths <= 36) return 60;
    if (durationMonths <= 60) return 40;
    return 20; // Very long duration
  }

  private generatePros(project: InvestmentProject, analysis: any): string[] {
    const pros: string[] = [];

    if (project.targetYield && project.targetYield >= 8) {
      pros.push(`High yield: ${project.targetYield}%`);
    }

    if (project.minTicket <= 500) {
      pros.push(`Low entry: ${project.minTicket} ${project.currency}`);
    }

    if (project.durationMonths && project.durationMonths <= 24) {
      pros.push(`Short duration: ${project.durationMonths} months`);
    }

    if (analysis?.overallScore >= 75) {
      pros.push('Excellent AI analysis score');
    }

    if (project.fundingProgress && project.fundingProgress > 50) {
      pros.push(`Strong funding: ${project.fundingProgress}% funded`);
    }

    return pros.slice(0, 5);
  }

  private generateCons(project: InvestmentProject, analysis: any): string[] {
    const cons: string[] = [];

    if (project.targetYield && project.targetYield < 5) {
      cons.push(`Low yield: ${project.targetYield}%`);
    }

    if (project.minTicket >= 5000) {
      cons.push(`High entry: ${project.minTicket} ${project.currency}`);
    }

    if (project.durationMonths && project.durationMonths > 36) {
      cons.push(`Long duration: ${project.durationMonths} months`);
    }

    if (analysis?.riskScore >= 70) {
      cons.push('High risk profile');
    }

    if (analysis?.redFlags && analysis.redFlags.length > 0) {
      cons.push(`${analysis.redFlags.length} red flags identified`);
    }

    return cons.slice(0, 5);
  }

  private generateRecommendations(
    results: ComparisonResult[],
    criteria: ComparisonCriteria,
  ): string[] {
    const recommendations: string[] = [];

    const topProject = results[0];
    recommendations.push(
      `Best overall option: Project ranked #1 with score ${topProject.scores.overall}/100`,
    );

    // Best yield
    const bestYield = results.reduce((best, current) =>
      current.scores.yield > best.scores.yield ? current : best,
    );
    recommendations.push(
      `Highest yield potential: Project ${bestYield.ranking} (yield score: ${bestYield.scores.yield}/100)`,
    );

    // Lowest risk
    const lowestRisk = results.reduce((best, current) =>
      current.scores.risk > best.scores.risk ? current : best,
    );
    recommendations.push(
      `Safest option: Project ${lowestRisk.ranking} (risk score: ${lowestRisk.scores.risk}/100)`,
    );

    // Most accessible
    const mostAccessible = results.reduce((best, current) =>
      current.scores.ticket > best.scores.ticket ? current : best,
    );
    recommendations.push(
      `Most accessible: Project ${mostAccessible.ranking} (ticket score: ${mostAccessible.scores.ticket}/100)`,
    );

    return recommendations;
  }

  private generateId(): string {
    return `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
