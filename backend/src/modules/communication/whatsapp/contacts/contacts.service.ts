import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  CreateContactDto,
  UpdateContactDto,
  ContactFiltersDto,
  ContactResponseDto,
  ContactsListResponseDto,
  ContactStatsDto,
  ImportResultDto,
  ExportResultDto,
} from './dto';

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new WhatsApp contact
   */
  async createContact(
    userId: string,
    dto: CreateContactDto,
  ): Promise<ContactResponseDto> {
    this.logger.log(
      `Creating contact: ${dto.phoneNumber} for user ${userId}`,
    );

    // Get user's WhatsApp config
    const config = await this.prisma.whatsAppConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      throw new NotFoundException('WhatsApp configuration not found');
    }

    // Check if contact already exists
    const existing = await this.prisma.whatsAppContact.findUnique({
      where: {
        configId_phoneNumber: {
          configId: config.id,
          phoneNumber: dto.phoneNumber,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Contact with phone number "${dto.phoneNumber}" already exists`,
      );
    }

    // Create contact
    const contact = await this.prisma.whatsAppContact.create({
      data: {
        configId: config.id,
        phoneNumber: dto.phoneNumber,
        name: dto.name,
        email: dto.email,
        tags: dto.tags || [],
        groups: dto.groups || [],
        notes: dto.notes,
        customFields: dto.customFields || {},
      },
    });

    return this.mapToResponseDto(contact);
  }

  /**
   * Get all contacts with filters and pagination
   */
  async getContacts(
    userId: string,
    filters: ContactFiltersDto,
  ): Promise<ContactsListResponseDto> {
    this.logger.log(`Getting contacts for user ${userId}`);

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

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phoneNumber: { contains: filters.search } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters.groups && filters.groups.length > 0) {
      where.groups = { hasSome: filters.groups };
    }

    if (filters.isBlocked !== undefined) {
      where.isBlocked = filters.isBlocked;
    }

    if (filters.hasConversations !== undefined) {
      if (filters.hasConversations) {
        where.totalConversations = { gt: 0 };
      } else {
        where.totalConversations = 0;
      }
    }

    // Pagination
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const skip = (page - 1) * pageSize;

    // Execute queries
    const [contacts, total] = await Promise.all([
      this.prisma.whatsAppContact.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          [filters.sortBy || 'createdAt']: filters.sortOrder || 'desc',
        },
      }),
      this.prisma.whatsAppContact.count({ where }),
    ]);

    return {
      contacts: contacts.map((c) => this.mapToResponseDto(c)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get a single contact by ID
   */
  async getContact(
    userId: string,
    contactId: string,
  ): Promise<ContactResponseDto> {
    this.logger.log(`Getting contact ${contactId} for user ${userId}`);

    const contact = await this.findContactByIdAndUser(userId, contactId);
    return this.mapToResponseDto(contact);
  }

  /**
   * Update a contact
   */
  async updateContact(
    userId: string,
    contactId: string,
    dto: UpdateContactDto,
  ): Promise<ContactResponseDto> {
    this.logger.log(`Updating contact ${contactId} for user ${userId}`);

    // Verify contact belongs to user
    await this.findContactByIdAndUser(userId, contactId);

    // Update contact
    const contact = await this.prisma.whatsAppContact.update({
      where: { id: contactId },
      data: dto,
    });

    return this.mapToResponseDto(contact);
  }

  /**
   * Delete a contact
   */
  async deleteContact(userId: string, contactId: string): Promise<void> {
    this.logger.log(`Deleting contact ${contactId} for user ${userId}`);

    // Verify contact belongs to user
    await this.findContactByIdAndUser(userId, contactId);

    // Delete contact
    await this.prisma.whatsAppContact.delete({
      where: { id: contactId },
    });

    this.logger.log(`Contact ${contactId} deleted successfully`);
  }

  /**
   * Block/unblock a contact
   */
  async toggleBlockContact(
    userId: string,
    contactId: string,
  ): Promise<ContactResponseDto> {
    this.logger.log(`Toggling block status for contact ${contactId}`);

    const contact = await this.findContactByIdAndUser(userId, contactId);

    const updated = await this.prisma.whatsAppContact.update({
      where: { id: contactId },
      data: { isBlocked: !contact.isBlocked },
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Import contacts from CSV
   */
  async importContacts(
    userId: string,
    contacts: CreateContactDto[],
  ): Promise<ImportResultDto> {
    this.logger.log(
      `Importing ${contacts.length} contacts for user ${userId}`,
    );

    const config = await this.prisma.whatsAppConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      throw new NotFoundException('WhatsApp configuration not found');
    }

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const contactDto of contacts) {
      try {
        // Check if contact already exists
        const existing = await this.prisma.whatsAppContact.findUnique({
          where: {
            configId_phoneNumber: {
              configId: config.id,
              phoneNumber: contactDto.phoneNumber,
            },
          },
        });

        if (existing) {
          failed++;
          errors.push(
            `Contact ${contactDto.phoneNumber} already exists (skipped)`,
          );
          continue;
        }

        // Create contact
        await this.prisma.whatsAppContact.create({
          data: {
            configId: config.id,
            phoneNumber: contactDto.phoneNumber,
            name: contactDto.name,
            email: contactDto.email,
            tags: contactDto.tags || [],
            groups: contactDto.groups || [],
            notes: contactDto.notes,
            customFields: contactDto.customFields || {},
          },
        });

        imported++;
      } catch (error) {
        failed++;
        errors.push(
          `Failed to import ${contactDto.phoneNumber}: ${error.message}`,
        );
      }
    }

    return { imported, failed, errors };
  }

  /**
   * Export contacts to CSV
   */
  async exportContacts(
    userId: string,
    filters?: ContactFiltersDto,
  ): Promise<ExportResultDto> {
    this.logger.log(`Exporting contacts for user ${userId}`);

    // Get all contacts matching filters (no pagination)
    const config = await this.prisma.whatsAppConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      throw new NotFoundException('WhatsApp configuration not found');
    }

    const where: any = { configId: config.id };

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phoneNumber: { contains: filters.search } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters?.groups && filters.groups.length > 0) {
      where.groups = { hasSome: filters.groups };
    }

    if (filters?.isBlocked !== undefined) {
      where.isBlocked = filters.isBlocked;
    }

    const contacts = await this.prisma.whatsAppContact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Generate CSV
    const csvHeader = 'Phone Number,Name,Email,Tags,Groups,Notes\n';
    const csvRows = contacts
      .map((contact) => {
        const phoneNumber = contact.phoneNumber;
        const name = contact.name || '';
        const email = contact.email || '';
        const tags = contact.tags.join(';');
        const groups = contact.groups.join(';');
        const notes = (contact.notes || '').replace(/\n/g, ' ');

        return `"${phoneNumber}","${name}","${email}","${tags}","${groups}","${notes}"`;
      })
      .join('\n');

    const csvContent = csvHeader + csvRows;
    const base64Data = Buffer.from(csvContent).toString('base64');
    const filename = `whatsapp_contacts_${new Date().toISOString().split('T')[0]}.csv`;

    return {
      data: base64Data,
      filename,
      mimeType: 'text/csv',
    };
  }

  /**
   * Get contact statistics
   */
  async getContactStats(
    userId: string,
    contactId: string,
  ): Promise<ContactStatsDto> {
    this.logger.log(`Getting stats for contact ${contactId}`);

    const contact = await this.findContactByIdAndUser(userId, contactId);

    return {
      totalMessages: contact.totalMessages,
      sentMessages: contact.sentMessages,
      receivedMessages: contact.receivedMessages,
      totalConversations: contact.totalConversations,
      activeConversations: contact.activeConversations,
      avgResponseTime: contact.avgResponseTime,
      lastInteraction: contact.lastInteractionAt,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE HELPER METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Find contact by ID and verify it belongs to user
   */
  private async findContactByIdAndUser(userId: string, contactId: string) {
    const config = await this.prisma.whatsAppConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      throw new NotFoundException('WhatsApp configuration not found');
    }

    const contact = await this.prisma.whatsAppContact.findFirst({
      where: {
        id: contactId,
        configId: config.id,
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  /**
   * Map Prisma model to response DTO
   */
  private mapToResponseDto(contact: any): ContactResponseDto {
    return {
      id: contact.id,
      configId: contact.configId,
      phoneNumber: contact.phoneNumber,
      name: contact.name,
      email: contact.email,
      profilePicture: contact.profilePicture,
      tags: contact.tags,
      groups: contact.groups,
      notes: contact.notes,
      customFields: contact.customFields,
      isBlocked: contact.isBlocked,
      stats: {
        totalMessages: contact.totalMessages,
        sentMessages: contact.sentMessages,
        receivedMessages: contact.receivedMessages,
        totalConversations: contact.totalConversations,
        activeConversations: contact.activeConversations,
        avgResponseTime: contact.avgResponseTime,
        lastInteraction: contact.lastInteractionAt,
      },
      lastMessageAt: contact.lastMessageAt,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    };
  }
}
