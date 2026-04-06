import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { WhatsAppService } from '../whatsapp.service';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignFiltersDto,
  CampaignResponseDto,
  CampaignsListResponseDto,
  CampaignStatus,
  RecipientStatus,
  CampaignStatsDto,
} from './dto';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsAppService,
  ) { }

  /**
   * Create a new campaign
   */
  async createCampaign(
    userId: string,
    dto: CreateCampaignDto,
  ): Promise<CampaignResponseDto> {
    this.logger.log(`Creating campaign: ${dto.name} for user ${userId}`);

    // Get user's WhatsApp config
    const config = await this.prisma.whatsAppConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      throw new NotFoundException('WhatsApp configuration not found');
    }

    // Verify template exists and belongs to user
    const template = await this.prisma.whatsAppTemplate.findFirst({
      where: {
        id: dto.templateId,
        configId: config.id,
      },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.status !== 'approved') {
      throw new BadRequestException(
        'Template must be approved before use in campaigns',
      );
    }

    // Validate recipients
    if (!dto.recipients || dto.recipients.length === 0) {
      throw new BadRequestException('At least one recipient is required');
    }

    // Create campaign with recipients
    const campaign = await this.prisma.whatsAppCampaign.create({
      data: {
        configId: config.id,
        name: dto.name,
        description: dto.description,
        type: dto.type,
        templateId: dto.templateId,
        templateName: template.name,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        totalRecipients: dto.recipients.length,
        pendingCount: dto.recipients.length,
        createdBy: userId,
        recipients: {
          create: dto.recipients.map((r) => ({
            contactId: r.contactId,
            phoneNumber: r.phoneNumber,
            variables: r.variables || {},
            status: 'pending',
          })),
        },
      },
      include: {
        recipients: true,
      },
    });

    return this.mapToResponseDto(campaign);
  }

  /**
   * Get all campaigns with filters
   */
  async getCampaigns(
    userId: string,
    filters: CampaignFiltersDto,
  ): Promise<CampaignsListResponseDto> {
    this.logger.log(`Getting campaigns for user ${userId}`);

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

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Pagination
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const skip = (page - 1) * pageSize;

    // Execute queries
    const [campaigns, total] = await Promise.all([
      this.prisma.whatsAppCampaign.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          [filters.sortBy || 'createdAt']: filters.sortOrder || 'desc',
        },
        include: {
          recipients: true,
        },
      }),
      this.prisma.whatsAppCampaign.count({ where }),
    ]);

    return {
      campaigns: campaigns.map((c) => this.mapToResponseDto(c)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get a single campaign by ID
   */
  async getCampaign(
    userId: string,
    campaignId: string,
  ): Promise<CampaignResponseDto> {
    this.logger.log(`Getting campaign ${campaignId} for user ${userId}`);

    const campaign = await this.findCampaignByIdAndUser(userId, campaignId);
    return this.mapToResponseDto(campaign);
  }

  /**
   * Update a campaign
   */
  async updateCampaign(
    userId: string,
    campaignId: string,
    dto: UpdateCampaignDto,
  ): Promise<CampaignResponseDto> {
    this.logger.log(`Updating campaign ${campaignId} for user ${userId}`);

    const campaign = await this.findCampaignByIdAndUser(userId, campaignId);

    // Cannot update running or completed campaigns
    if (['running', 'completed', 'cancelled'].includes(campaign.status)) {
      throw new BadRequestException(
        `Cannot update campaign with status: ${campaign.status}`,
      );
    }

    const updated = await this.prisma.whatsAppCampaign.update({
      where: { id: campaignId },
      data: {
        name: dto.name,
        description: dto.description,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      },
      include: {
        recipients: true,
      },
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(userId: string, campaignId: string): Promise<void> {
    this.logger.log(`Deleting campaign ${campaignId} for user ${userId}`);

    const campaign = await this.findCampaignByIdAndUser(userId, campaignId);

    // Cannot delete running campaigns
    if (campaign.status === 'running') {
      throw new BadRequestException('Cannot delete a running campaign');
    }

    await this.prisma.whatsAppCampaign.delete({
      where: { id: campaignId },
    });

    this.logger.log(`Campaign ${campaignId} deleted successfully`);
  }

  /**
   * Launch a campaign
   */
  async launchCampaign(
    userId: string,
    campaignId: string,
  ): Promise<CampaignResponseDto> {
    this.logger.log(`Launching campaign ${campaignId}`);

    const campaign = await this.findCampaignByIdAndUser(userId, campaignId);

    // Validate campaign status
    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      throw new BadRequestException(
        `Cannot launch campaign with status: ${campaign.status}`,
      );
    }

    // Update campaign status to running
    const updatedCampaign = await this.prisma.whatsAppCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'running',
        startedAt: new Date(),
      },
      include: {
        recipients: true,
      },
    });

    // Process campaign asynchronously
    this.processCampaign(userId, campaignId).catch((error) => {
      this.logger.error(
        `Error processing campaign ${campaignId}: ${error.message}`,
      );
    });

    return this.mapToResponseDto(updatedCampaign);
  }

  /**
   * Pause a running campaign
   */
  async pauseCampaign(
    userId: string,
    campaignId: string,
  ): Promise<CampaignResponseDto> {
    this.logger.log(`Pausing campaign ${campaignId}`);

    const campaign = await this.findCampaignByIdAndUser(userId, campaignId);

    if (campaign.status !== 'running') {
      throw new BadRequestException('Can only pause running campaigns');
    }

    const updated = await this.prisma.whatsAppCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'paused',
        pausedAt: new Date(),
      },
      include: {
        recipients: true,
      },
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Resume a paused campaign
   */
  async resumeCampaign(
    userId: string,
    campaignId: string,
  ): Promise<CampaignResponseDto> {
    this.logger.log(`Resuming campaign ${campaignId}`);

    const campaign = await this.findCampaignByIdAndUser(userId, campaignId);

    if (campaign.status !== 'paused') {
      throw new BadRequestException('Can only resume paused campaigns');
    }

    const updated = await this.prisma.whatsAppCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'running',
        pausedAt: null,
      },
      include: {
        recipients: true,
      },
    });

    // Continue processing
    this.processCampaign(userId, campaignId).catch((error) => {
      this.logger.error(
        `Error processing campaign ${campaignId}: ${error.message}`,
      );
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Cancel a campaign
   */
  async cancelCampaign(
    userId: string,
    campaignId: string,
  ): Promise<CampaignResponseDto> {
    this.logger.log(`Cancelling campaign ${campaignId}`);

    const campaign = await this.findCampaignByIdAndUser(userId, campaignId);

    if (['completed', 'cancelled'].includes(campaign.status)) {
      throw new BadRequestException(
        `Cannot cancel campaign with status: ${campaign.status}`,
      );
    }

    const updated = await this.prisma.whatsAppCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        completedAt: new Date(),
      },
      include: {
        recipients: true,
      },
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(
    userId: string,
    campaignId: string,
  ): Promise<CampaignStatsDto> {
    this.logger.log(`Getting stats for campaign ${campaignId}`);

    const campaign = await this.findCampaignByIdAndUser(userId, campaignId);

    return this.calculateStats(campaign);
  }

  async getCampaignRecipients(userId: string, campaignId: string) {
    const campaign = await this.findCampaignByIdAndUser(userId, campaignId);
    return campaign.recipients || [];
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE HELPER METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Find campaign by ID and verify it belongs to user
   */
  private async findCampaignByIdAndUser(userId: string, campaignId: string) {
    const config = await this.prisma.whatsAppConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      throw new NotFoundException('WhatsApp configuration not found');
    }

    const campaign = await this.prisma.whatsAppCampaign.findFirst({
      where: {
        id: campaignId,
        configId: config.id,
      },
      include: {
        recipients: true,
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  /**
   * Process campaign - send messages to all recipients
   */
  private async processCampaign(
    userId: string,
    campaignId: string,
  ): Promise<void> {
    this.logger.log(`Processing campaign ${campaignId}`);

    const campaign = await this.prisma.whatsAppCampaign.findUnique({
      where: { id: campaignId },
      include: {
        recipients: {
          where: { status: 'pending' },
        },
      },
    });

    if (!campaign || campaign.status !== 'running') {
      return;
    }

    // Send messages to all pending recipients
    for (const recipient of campaign.recipients) {
      try {
        // Send template message
        await this.whatsappService.sendTemplateMessage(userId, {
          to: recipient.phoneNumber,
          templateName: campaign.templateName,
          language: 'fr',
          variables: Object.values((recipient.variables as any) || {}),
        } as any);

        // Update recipient status
        await this.prisma.whatsAppCampaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
          },
        });

        // Update campaign counts
        await this.prisma.whatsAppCampaign.update({
          where: { id: campaignId },
          data: {
            sentCount: { increment: 1 },
            pendingCount: { decrement: 1 },
          },
        });

        // Small delay to avoid rate limiting
        await this.sleep(100);
      } catch (error) {
        this.logger.error(
          `Failed to send message to ${recipient.phoneNumber}: ${error.message}`,
        );

        // Update recipient as failed
        await this.prisma.whatsAppCampaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: 'failed',
            failedAt: new Date(),
            errorMessage: error.message,
          },
        });

        // Update campaign counts
        await this.prisma.whatsAppCampaign.update({
          where: { id: campaignId },
          data: {
            failedCount: { increment: 1 },
            pendingCount: { decrement: 1 },
          },
        });
      }
    }

    // Mark campaign as completed
    await this.prisma.whatsAppCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    this.logger.log(`Campaign ${campaignId} completed`);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Map Prisma model to response DTO
   */
  private mapToResponseDto(campaign: any): CampaignResponseDto {
    return {
      id: campaign.id,
      configId: campaign.configId,
      name: campaign.name,
      description: campaign.description,
      type: campaign.type,
      status: campaign.status,
      templateId: campaign.templateId,
      templateName: campaign.templateName,
      recipients: (campaign.recipients || []).map((r: any) => ({
        contactId: r.contactId,
        phoneNumber: r.phoneNumber,
        name: r.name,
        variables: r.variables,
        status: r.status,
        sentAt: r.sentAt,
        deliveredAt: r.deliveredAt,
        readAt: r.readAt,
        errorMessage: r.errorMessage,
      })),
      scheduledAt: campaign.scheduledAt,
      startedAt: campaign.startedAt,
      completedAt: campaign.completedAt,
      stats: this.calculateStats(campaign),
      createdBy: campaign.createdBy,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    };
  }

  /**
   * Calculate campaign statistics
   */
  private calculateStats(campaign: any): CampaignStatsDto {
    const {
      totalRecipients,
      sentCount,
      deliveredCount,
      readCount,
      failedCount,
      pendingCount,
    } = campaign;

    const successRate =
      totalRecipients > 0
        ? Math.round(((sentCount - failedCount) / totalRecipients) * 100)
        : 0;

    const readRate =
      sentCount > 0 ? Math.round((readCount / sentCount) * 100) : 0;

    return {
      totalRecipients,
      sent: sentCount,
      delivered: deliveredCount,
      read: readCount,
      failed: failedCount,
      pending: pendingCount,
      successRate,
      readRate,
    };
  }
}
