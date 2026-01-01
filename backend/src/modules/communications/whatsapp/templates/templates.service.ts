import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateFiltersDto,
  TemplateResponseDto,
  TemplatesListResponseDto,
  TemplateStatsDto,
} from './dto';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new WhatsApp template
   */
  async createTemplate(
    userId: string,
    dto: CreateTemplateDto,
  ): Promise<TemplateResponseDto> {
    this.logger.log(`Creating template: ${dto.name} for user ${userId}`);

    // Get user's WhatsApp config
    const config = await this.prisma.whatsAppConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      throw new NotFoundException('WhatsApp configuration not found');
    }

    // Check if template with same name already exists
    const existing = await this.prisma.whatsAppTemplate.findUnique({
      where: {
        configId_name: {
          configId: config.id,
          name: dto.name,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Template with name "${dto.name}" already exists`,
      );
    }

    // Extract variables from body text
    const variables = this.extractVariables(dto.body);

    // Create template
    const template = await this.prisma.whatsAppTemplate.create({
      data: {
        configId: config.id,
        name: dto.name,
        language: dto.language || 'fr',
        category: dto.category,
        header: dto.header,
        body: dto.body,
        footer: dto.footer,
        buttons: dto.buttons || [],
        variables,
      },
    });

    return this.mapToResponseDto(template);
  }

  /**
   * Get all templates with filters and pagination
   */
  async getTemplates(
    userId: string,
    filters: TemplateFiltersDto,
  ): Promise<TemplatesListResponseDto> {
    this.logger.log(`Getting templates for user ${userId}`);

    // Get user's WhatsApp config
    const config = await this.prisma.whatsAppConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      throw new NotFoundException('WhatsApp configuration not found');
    }

    // Build where clause
    const where: any = {
      configId: config.id,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.language) {
      where.language = filters.language;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { body: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // Execute queries
    const [templates, total] = await Promise.all([
      this.prisma.whatsAppTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [filters.sortBy || 'createdAt']: filters.sortOrder || 'desc',
        },
      }),
      this.prisma.whatsAppTemplate.count({ where }),
    ]);

    return {
      templates: templates.map((t) => this.mapToResponseDto(t)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single template by ID
   */
  async getTemplate(
    userId: string,
    templateId: string,
  ): Promise<TemplateResponseDto> {
    this.logger.log(`Getting template ${templateId} for user ${userId}`);

    const template = await this.findTemplateByIdAndUser(userId, templateId);
    return this.mapToResponseDto(template);
  }

  /**
   * Update a template
   */
  async updateTemplate(
    userId: string,
    templateId: string,
    dto: UpdateTemplateDto,
  ): Promise<TemplateResponseDto> {
    this.logger.log(`Updating template ${templateId} for user ${userId}`);

    // Verify template belongs to user
    await this.findTemplateByIdAndUser(userId, templateId);

    // If name is being changed, check for conflicts
    if (dto.name) {
      const config = await this.prisma.whatsAppConfig.findUnique({
        where: { userId },
      });

      const existing = await this.prisma.whatsAppTemplate.findFirst({
        where: {
          configId: config.id,
          name: dto.name,
          NOT: { id: templateId },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Template with name "${dto.name}" already exists`,
        );
      }
    }

    // Extract variables if body is being updated
    const updateData: any = { ...dto };
    if (dto.body) {
      updateData.variables = this.extractVariables(dto.body);
    }

    // Handle status changes
    if (dto.status === 'approved') {
      updateData.approvedAt = new Date();
      updateData.rejectedReason = null;
    } else if (dto.status === 'rejected' && dto.rejectedReason) {
      updateData.approvedAt = null;
    }

    // Update template
    const template = await this.prisma.whatsAppTemplate.update({
      where: { id: templateId },
      data: updateData,
    });

    return this.mapToResponseDto(template);
  }

  /**
   * Delete a template
   */
  async deleteTemplate(userId: string, templateId: string): Promise<void> {
    this.logger.log(`Deleting template ${templateId} for user ${userId}`);

    // Verify template belongs to user
    await this.findTemplateByIdAndUser(userId, templateId);

    // Delete template
    await this.prisma.whatsAppTemplate.delete({
      where: { id: templateId },
    });

    this.logger.log(`Template ${templateId} deleted successfully`);
  }

  /**
   * Duplicate a template
   */
  async duplicateTemplate(
    userId: string,
    templateId: string,
  ): Promise<TemplateResponseDto> {
    this.logger.log(`Duplicating template ${templateId} for user ${userId}`);

    // Get original template
    const original = await this.findTemplateByIdAndUser(userId, templateId);

    // Generate unique name
    let newName = `${original.name}_copy`;
    let counter = 1;

    while (
      await this.prisma.whatsAppTemplate.findUnique({
        where: {
          configId_name: {
            configId: original.configId,
            name: newName,
          },
        },
      })
    ) {
      counter++;
      newName = `${original.name}_copy_${counter}`;
    }

    // Create duplicate
    const duplicate = await this.prisma.whatsAppTemplate.create({
      data: {
        configId: original.configId,
        name: newName,
        language: original.language,
        category: original.category,
        header: original.header,
        body: original.body,
        footer: original.footer,
        buttons: original.buttons,
        variables: original.variables,
        status: 'pending', // Reset to pending
      },
    });

    return this.mapToResponseDto(duplicate);
  }

  /**
   * Get template statistics
   */
  async getTemplateStats(
    userId: string,
    templateId: string,
  ): Promise<TemplateStatsDto> {
    this.logger.log(`Getting stats for template ${templateId}`);

    const template = await this.findTemplateByIdAndUser(userId, templateId);

    return this.calculateStats(template);
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE HELPER METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Find template by ID and verify it belongs to user
   */
  private async findTemplateByIdAndUser(userId: string, templateId: string) {
    const config = await this.prisma.whatsAppConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      throw new NotFoundException('WhatsApp configuration not found');
    }

    const template = await this.prisma.whatsAppTemplate.findFirst({
      where: {
        id: templateId,
        configId: config.id,
      },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }

  /**
   * Extract variable placeholders from template body
   */
  private extractVariables(body: string): string[] {
    const regex = /\{\{(\d+)\}\}/g;
    const matches = body.match(regex);

    if (!matches) {
      return [];
    }

    // Remove duplicates and sort
    const uniqueVars = [...new Set(matches)].sort();
    return uniqueVars;
  }

  /**
   * Map Prisma model to response DTO
   */
  private mapToResponseDto(template: any): TemplateResponseDto {
    return {
      id: template.id,
      configId: template.configId,
      name: template.name,
      language: template.language,
      category: template.category,
      header: template.header,
      body: template.body,
      footer: template.footer,
      buttons: template.buttons,
      variables: template.variables,
      status: template.status,
      approvedAt: template.approvedAt,
      rejectedReason: template.rejectedReason,
      stats: this.calculateStats(template),
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  /**
   * Calculate template statistics
   */
  private calculateStats(template: any): TemplateStatsDto {
    const { sentCount, deliveredCount, readCount, failedCount } = template;

    const deliveryRate =
      sentCount > 0 ? Math.round((deliveredCount / sentCount) * 100) : 0;

    const readRate =
      deliveredCount > 0 ? Math.round((readCount / deliveredCount) * 100) : 0;

    const successRate =
      sentCount > 0
        ? Math.round(((sentCount - failedCount) / sentCount) * 100)
        : 0;

    return {
      sentCount,
      deliveredCount,
      readCount,
      failedCount,
      deliveryRate,
      readRate,
      successRate,
    };
  }
}
