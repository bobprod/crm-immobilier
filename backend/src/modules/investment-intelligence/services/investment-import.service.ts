/**
 * Investment Import Service
 * Handles importing investment projects from various platforms
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { AdapterRegistryService } from './adapter-registry.service';
import {
  ImportContext,
  UnifiedProjectData,
  ValidationResult,
} from '../types/investment-project.types';
import { InvestmentProject, InvestmentProjectStatus } from '@prisma/client';

@Injectable()
export class InvestmentImportService {
  private readonly logger = new Logger(InvestmentImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly adapterRegistry: AdapterRegistryService,
  ) {}

  /**
   * Import a project from URL
   */
  async importFromUrl(
    url: string,
    context: ImportContext,
  ): Promise<InvestmentProject> {
    this.logger.log(`Starting import from URL: ${url}`);

    // Step 1: Detect platform and get adapter
    const detection = this.adapterRegistry.detectPlatform(url);
    if (!detection.detected) {
      throw new BadRequestException('Unable to detect investment platform from URL');
    }

    const adapter = this.adapterRegistry.getAdapterForUrl(url);
    this.logger.log(`Using adapter: ${adapter.name}`);

    // Step 2: Check if project already exists
    const existingProject = await this.findExistingProject(url, context.tenantId);
    if (existingProject && !context.options?.forceUpdate) {
      this.logger.log(`Project already exists: ${existingProject.id}`);
      return existingProject;
    }

    // Step 3: Import raw data from platform
    const rawData = await adapter.importFromUrl(url, context);

    // Step 4: Map to unified format
    const unifiedData = adapter.mapToUnifiedFormat(rawData);

    // Step 5: Validate data
    if (!context.options?.skipValidation) {
      const validation = adapter.validateData(unifiedData);
      if (!validation.isValid) {
        this.logger.error(`Validation failed: ${JSON.stringify(validation.errors)}`);
        throw new BadRequestException(
          `Invalid project data: ${validation.errors.map((e) => e.message).join(', ')}`,
        );
      }

      // Log warnings
      if (validation.warnings.length > 0) {
        this.logger.warn(`Validation warnings: ${JSON.stringify(validation.warnings)}`);
      }
    }

    // Step 6: Save or update project
    const project = existingProject
      ? await this.updateProject(existingProject.id, unifiedData, context)
      : await this.createProject(unifiedData, context);

    this.logger.log(`Successfully imported project: ${project.id}`);

    // Step 7: Trigger analysis if requested
    if (context.options?.analyzeImmediately) {
      // TODO: Trigger analysis via AI Orchestrator
      this.logger.log(`Analysis requested for project: ${project.id}`);
    }

    return project;
  }

  /**
   * Import multiple projects from URLs
   */
  async importBatch(
    urls: string[],
    context: ImportContext,
  ): Promise<{
    succeeded: InvestmentProject[];
    failed: { url: string; error: string }[];
  }> {
    this.logger.log(`Starting batch import of ${urls.length} projects`);

    const succeeded: InvestmentProject[] = [];
    const failed: { url: string; error: string }[] = [];

    for (const url of urls) {
      try {
        const project = await this.importFromUrl(url, context);
        succeeded.push(project);

        // Rate limiting delay
        await this.sleep(2000);
      } catch (error) {
        this.logger.error(`Failed to import ${url}: ${error.message}`);
        failed.push({ url, error: error.message });
      }
    }

    this.logger.log(
      `Batch import completed: ${succeeded.length} succeeded, ${failed.length} failed`,
    );

    return { succeeded, failed };
  }

  /**
   * Sync existing project (re-import to update data)
   */
  async syncProject(projectId: string, context: ImportContext): Promise<InvestmentProject> {
    const project = await this.prisma.investmentProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new BadRequestException(`Project not found: ${projectId}`);
    }

    if (!project.sourceUrl) {
      throw new BadRequestException('Project has no source URL to sync from');
    }

    return this.importFromUrl(project.sourceUrl, {
      ...context,
      options: { ...context.options, forceUpdate: true },
    });
  }

  // ============================================
  // Private Methods
  // ============================================

  private async findExistingProject(
    url: string,
    tenantId: string,
  ): Promise<InvestmentProject | null> {
    return this.prisma.investmentProject.findFirst({
      where: {
        sourceUrl: url,
        tenantId,
      },
    });
  }

  private async createProject(
    data: UnifiedProjectData,
    context: ImportContext,
  ): Promise<InvestmentProject> {
    return this.prisma.investmentProject.create({
      data: {
        id: this.generateId(),
        userId: context.userId,
        tenantId: context.tenantId,

        title: data.title,
        description: data.description,
        sourceUrl: data.sourceUrl,
        source: data.source,
        sourceProjectId: data.sourceProjectId,

        city: data.city,
        country: data.country,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,

        totalPrice: data.totalPrice,
        minTicket: data.minTicket,
        currency: data.currency,

        grossYield: data.grossYield,
        netYield: data.netYield,
        targetYield: data.targetYield,

        durationMonths: data.durationMonths,
        startDate: data.startDate,
        endDate: data.endDate,

        propertyType: data.propertyType,

        status: data.status || InvestmentProjectStatus.draft,
        fundingProgress: data.fundingProgress,

        rawData: data.rawData,
        images: data.images || [],
        documents: data.documents || [],

        importedAt: new Date(),
        lastSyncedAt: new Date(),

        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  private async updateProject(
    projectId: string,
    data: UnifiedProjectData,
    context: ImportContext,
  ): Promise<InvestmentProject> {
    return this.prisma.investmentProject.update({
      where: { id: projectId },
      data: {
        title: data.title,
        description: data.description,

        city: data.city,
        country: data.country,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,

        totalPrice: data.totalPrice,
        minTicket: data.minTicket,
        currency: data.currency,

        grossYield: data.grossYield,
        netYield: data.netYield,
        targetYield: data.targetYield,

        durationMonths: data.durationMonths,
        startDate: data.startDate,
        endDate: data.endDate,

        propertyType: data.propertyType,

        status: data.status,
        fundingProgress: data.fundingProgress,

        rawData: data.rawData,
        images: data.images || [],
        documents: data.documents || [],

        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  private generateId(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============================================
  // Query Methods
  // ============================================

  /**
   * Get project by ID
   */
  async getProjectById(projectId: string): Promise<InvestmentProject | null> {
    return this.prisma.investmentProject.findUnique({
      where: { id: projectId },
    });
  }

  /**
   * List projects for user
   */
  async listProjects(
    userId: string,
    tenantId: string,
    filters?: {
      source?: string;
      status?: InvestmentProjectStatus;
      country?: string;
      minYield?: number;
      maxTicket?: number;
    },
  ): Promise<InvestmentProject[]> {
    return this.prisma.investmentProject.findMany({
      where: {
        userId,
        tenantId,
        ...(filters?.source && { source: filters.source as any }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.country && { country: filters.country }),
        ...(filters?.minYield && { targetYield: { gte: filters.minYield } }),
        ...(filters?.maxTicket && { minTicket: { lte: filters.maxTicket } }),
      },
      orderBy: {
        importedAt: 'desc',
      },
    });
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string): Promise<void> {
    await this.prisma.investmentProject.delete({
      where: { id: projectId },
    });
  }
}
