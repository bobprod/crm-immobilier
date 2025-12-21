/**
 * Investment Analysis Service
 * Handles AI-powered analysis of investment projects
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { AiOrchestratorService } from '../../intelligence/ai-orchestrator/ai-orchestrator.service';
import { ProjectAnalysis } from '../types/investment-project.types';
import { InvestmentAnalysis, InvestmentProject } from '@prisma/client';

@Injectable()
export class InvestmentAnalysisService {
  private readonly logger = new Logger(InvestmentAnalysisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiOrchestrator: AiOrchestratorService,
  ) {}

  /**
   * Analyze an investment project using AI
   */
  async analyzeProject(
    projectId: string,
    userId: string,
    tenantId: string,
  ): Promise<InvestmentAnalysis> {
    this.logger.log(`Starting analysis for project: ${projectId}`);

    // Get project data
    const project = await this.prisma.investmentProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new BadRequestException(`Project not found: ${projectId}`);
    }

    // Check if recent analysis exists (< 24h)
    const recentAnalysis = await this.getRecentAnalysis(projectId);
    if (recentAnalysis) {
      this.logger.log(`Using recent analysis: ${recentAnalysis.id}`);
      return recentAnalysis;
    }

    // Prepare analysis prompt
    const analysisPrompt = this.buildAnalysisPrompt(project);

    // Call AI Orchestrator
    const orchestrationResult = await this.aiOrchestrator.executeObjective({
      objective: 'INVESTMENT_ANALYSIS',
      userQuery: analysisPrompt,
      context: {
        projectId: project.id,
        projectData: this.serializeProjectData(project),
      },
      userId,
      tenantId,
      maxBudget: 2.0, // $2 max per analysis
    });

    // Parse AI response
    const analysis = this.parseAnalysisResponse(orchestrationResult.synthesis);

    // Save analysis
    const savedAnalysis = await this.saveAnalysis(
      projectId,
      userId,
      orchestrationResult.id,
      analysis,
    );

    // Update project status
    await this.prisma.investmentProject.update({
      where: { id: projectId },
      data: {
        status: 'active',
        lastAnalyzedAt: new Date(),
      },
    });

    this.logger.log(`Analysis completed: ${savedAnalysis.id}`);
    return savedAnalysis;
  }

  /**
   * Get analysis for a project
   */
  async getAnalysis(projectId: string): Promise<InvestmentAnalysis | null> {
    return this.prisma.investmentAnalysis.findFirst({
      where: { projectId },
      orderBy: { analyzedAt: 'desc' },
    });
  }

  /**
   * List all analyses for a user
   */
  async listAnalyses(userId: string): Promise<InvestmentAnalysis[]> {
    return this.prisma.investmentAnalysis.findMany({
      where: { userId },
      orderBy: { analyzedAt: 'desc' },
      take: 50,
    });
  }

  // ============================================
  // Private Methods
  // ============================================

  private async getRecentAnalysis(
    projectId: string,
  ): Promise<InvestmentAnalysis | null> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return this.prisma.investmentAnalysis.findFirst({
      where: {
        projectId,
        analyzedAt: {
          gte: twentyFourHoursAgo,
        },
      },
      orderBy: { analyzedAt: 'desc' },
    });
  }

  private buildAnalysisPrompt(project: InvestmentProject): string {
    return `
Analyze this investment project and provide a comprehensive evaluation:

**Project Details:**
- Title: ${project.title}
- Location: ${project.city}, ${project.country}
- Type: ${project.propertyType}
- Total Price: ${project.totalPrice} ${project.currency}
- Minimum Investment: ${project.minTicket} ${project.currency}
- Target Yield: ${project.targetYield || 'N/A'}%
- Duration: ${project.durationMonths || 'N/A'} months
- Funding Progress: ${project.fundingProgress || 'N/A'}%

**Description:**
${project.description || 'No description available'}

**Required Analysis:**

1. **Overall Score (0-100)**: Provide a single numerical score representing the overall investment quality.

2. **Detailed Scores (0-100 each)**:
   - Location Score: Evaluate the location's investment potential
   - Yield Score: Assess the return potential
   - Risk Score: Evaluate the risk level (higher = riskier)
   - Liquidity Score: Assess how easily the investment can be liquidated

3. **SWOT Analysis**:
   - Strengths: List 3-5 key strengths
   - Weaknesses: List 3-5 key weaknesses
   - Opportunities: List 3-5 opportunities
   - Threats: List 3-5 potential threats

4. **Recommendation**: Provide one of: BUY, HOLD, PASS, INVESTIGATE
   Include reasoning for the recommendation (2-3 sentences)

5. **Red Flags**: List any concerning aspects (if any)

6. **Market Insights**: Brief market comparison and context

Format your response as JSON with this exact structure:
{
  "overallScore": number,
  "locationScore": number,
  "yieldScore": number,
  "riskScore": number,
  "liquidityScore": number,
  "strengths": string[],
  "weaknesses": string[],
  "opportunities": string[],
  "threats": string[],
  "recommendation": "BUY" | "HOLD" | "PASS" | "INVESTIGATE",
  "recommendationReason": string,
  "redFlags": string[],
  "marketComparison": string
}
    `.trim();
  }

  private serializeProjectData(project: InvestmentProject): any {
    return {
      id: project.id,
      title: project.title,
      city: project.city,
      country: project.country,
      totalPrice: project.totalPrice,
      minTicket: project.minTicket,
      currency: project.currency,
      targetYield: project.targetYield,
      propertyType: project.propertyType,
    };
  }

  private parseAnalysisResponse(synthesis: string): ProjectAnalysis {
    try {
      // Try to extract JSON from markdown code blocks
      let jsonStr = synthesis;
      const jsonMatch = synthesis.match(/```json\s*\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonStr);

      return {
        overallScore: this.ensureScore(parsed.overallScore),
        locationScore: this.ensureScore(parsed.locationScore),
        yieldScore: this.ensureScore(parsed.yieldScore),
        riskScore: this.ensureScore(parsed.riskScore),
        liquidityScore: this.ensureScore(parsed.liquidityScore),
        strengths: this.ensureArray(parsed.strengths),
        weaknesses: this.ensureArray(parsed.weaknesses),
        opportunities: this.ensureArray(parsed.opportunities),
        threats: this.ensureArray(parsed.threats),
        recommendation: parsed.recommendation || 'INVESTIGATE',
        recommendationReason: parsed.recommendationReason || '',
        redFlags: this.ensureArray(parsed.redFlags),
        marketComparison: parsed.marketComparison || null,
        similarProjects: [],
        metrics: null,
      };
    } catch (error) {
      this.logger.error(`Failed to parse analysis response: ${error.message}`);

      // Fallback to default values
      return {
        overallScore: 50,
        locationScore: 50,
        yieldScore: 50,
        riskScore: 50,
        liquidityScore: 50,
        strengths: ['Analysis parsing failed'],
        weaknesses: [],
        opportunities: [],
        threats: [],
        recommendation: 'INVESTIGATE',
        recommendationReason: 'Analysis could not be completed. Please retry.',
        redFlags: ['Analysis parsing failed'],
      };
    }
  }

  private ensureScore(value: any): number {
    const num = parseInt(value);
    if (isNaN(num)) return 50;
    return Math.max(0, Math.min(100, num));
  }

  private ensureArray(value: any): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item) => typeof item === 'string');
  }

  private async saveAnalysis(
    projectId: string,
    userId: string,
    orchestrationId: string,
    analysis: ProjectAnalysis,
  ): Promise<InvestmentAnalysis> {
    return this.prisma.investmentAnalysis.create({
      data: {
        id: this.generateId(),
        projectId,
        userId,
        orchestrationId,

        overallScore: analysis.overallScore,
        locationScore: analysis.locationScore,
        yieldScore: analysis.yieldScore,
        riskScore: analysis.riskScore,
        liquidityScore: analysis.liquidityScore,

        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        opportunities: analysis.opportunities,
        threats: analysis.threats,

        recommendation: analysis.recommendation,
        recommendationReason: analysis.recommendationReason,

        marketComparison: analysis.marketComparison || {},
        similarProjects: analysis.similarProjects || [],

        metrics: analysis.metrics || {},

        redFlags: analysis.redFlags || [],

        analyzedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  private generateId(): string {
    return `ana_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
