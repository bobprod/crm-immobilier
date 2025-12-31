import { Test, TestingModule } from '@nestjs/testing';
import { ContactsService } from './contacts.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateContactDto, UpdateContactDto, ContactFiltersDto } from './dto';

describe('ContactsService', () => {
  let service: ContactsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    whatsAppConfig: {
      findUnique: jest.fn(),
    },
    whatsAppContact: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const userId = 'user-123';
  const configId = 'config-123';
  const contactId = 'contact-123';

  const mockConfig = {
    id: configId,
    userId,
    provider: 'meta',
    phoneNumberId: 'phone-123',
    accessToken: 'token-123',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockContact = {
    id: contactId,
    configId,
    phoneNumber: '+33612345678',
    name: 'Jean Dupont',
    email: 'jean@example.com',
    profilePicture: null,
    tags: ['client', 'vip'],
    groups: ['paris'],
    notes: 'Client important',
    customFields: { budget: 250000 },
    isBlocked: false,
    totalMessages: 10,
    sentMessages: 6,
    receivedMessages: 4,
    totalConversations: 2,
    activeConversations: 1,
    avgResponseTime: 15,
    lastInteractionAt: new Date(),
    lastMessageAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createContact', () => {
    const createDto: CreateContactDto = {
      phoneNumber: '+33612345678',
      name: 'Jean Dupont',
      email: 'jean@example.com',
      tags: ['client'],
      groups: ['paris'],
      notes: 'Client important',
    };

    it('should create a contact successfully', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppContact.findUnique.mockResolvedValue(null);
      mockPrismaService.whatsAppContact.create.mockResolvedValue(mockContact);

      const result = await service.createContact(userId, createDto);

      expect(result).toBeDefined();
      expect(result.phoneNumber).toBe('+33612345678');
      expect(result.name).toBe('Jean Dupont');
      expect(mockPrismaService.whatsAppConfig.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(mockPrismaService.whatsAppContact.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if config not found', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(null);

      await expect(service.createContact(userId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if contact already exists', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppContact.findUnique.mockResolvedValue(
        mockContact,
      );

      await expect(service.createContact(userId, createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getContacts', () => {
    it('should get all contacts with pagination', async () => {
      const filters: ContactFiltersDto = {
        page: 1,
        pageSize: 20,
      };

      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppContact.findMany.mockResolvedValue([
        mockContact,
      ]);
      mockPrismaService.whatsAppContact.count.mockResolvedValue(1);

      const result = await service.getContacts(userId, filters);

      expect(result.contacts).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter contacts by search query', async () => {
      const filters: ContactFiltersDto = {
        search: 'Jean',
        page: 1,
        pageSize: 20,
      };

      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppContact.findMany.mockResolvedValue([
        mockContact,
      ]);
      mockPrismaService.whatsAppContact.count.mockResolvedValue(1);

      await service.getContacts(userId, filters);

      expect(mockPrismaService.whatsAppContact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'Jean', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    it('should filter contacts by tags', async () => {
      const filters: ContactFiltersDto = {
        tags: ['client', 'vip'],
        page: 1,
        pageSize: 20,
      };

      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppContact.findMany.mockResolvedValue([]);
      mockPrismaService.whatsAppContact.count.mockResolvedValue(0);

      await service.getContacts(userId, filters);

      expect(mockPrismaService.whatsAppContact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: { hasSome: ['client', 'vip'] },
          }),
        }),
      );
    });

    it('should filter contacts by blocked status', async () => {
      const filters: ContactFiltersDto = {
        isBlocked: true,
        page: 1,
        pageSize: 20,
      };

      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppContact.findMany.mockResolvedValue([]);
      mockPrismaService.whatsAppContact.count.mockResolvedValue(0);

      await service.getContacts(userId, filters);

      expect(mockPrismaService.whatsAppContact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isBlocked: true,
          }),
        }),
      );
    });

    it('should throw NotFoundException if config not found', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(null);

      await expect(service.getContacts(userId, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getContact', () => {
    it('should get a contact by ID', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppContact.findFirst.mockResolvedValue(
        mockContact,
      );

      const result = await service.getContact(userId, contactId);

      expect(result).toBeDefined();
      expect(result.id).toBe(contactId);
      expect(result.phoneNumber).toBe('+33612345678');
    });

    it('should throw NotFoundException if contact not found', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppContact.findFirst.mockResolvedValue(null);

      await expect(service.getContact(userId, contactId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateContact', () => {
    const updateDto: UpdateContactDto = {
      name: 'Jean Updated',
      tags: ['client', 'premium'],
    };

    it('should update a contact successfully', async () => {
      const updatedContact = {
        ...mockContact,
        name: 'Jean Updated',
        tags: ['client', 'premium'],
      };

      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppContact.findFirst.mockResolvedValue(
        mockContact,
      );
      mockPrismaService.whatsAppContact.update.mockResolvedValue(
        updatedContact,
      );

      const result = await service.updateContact(userId, contactId, updateDto);

      expect(result.name).toBe('Jean Updated');
      expect(result.tags).toEqual(['client', 'premium']);
    });

    it('should throw NotFoundException if contact not found', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppContact.findFirst.mockResolvedValue(null);

      await expect(
        service.updateContact(userId, contactId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteContact', () => {
    it('should delete a contact successfully', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppContact.findFirst.mockResolvedValue(
        mockContact,
      );
      mockPrismaService.whatsAppContact.delete.mockResolvedValue(mockContact);

      await service.deleteContact(userId, contactId);

      expect(mockPrismaService.whatsAppContact.delete).toHaveBeenCalledWith({
        where: { id: contactId },
      });
    });

    it('should throw NotFoundException if contact not found', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppContact.findFirst.mockResolvedValue(null);

      await expect(service.deleteContact(userId, contactId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('toggleBlockContact', () => {
    it('should toggle block status from false to true', async () => {
      const blockedContact = { ...mockContact, isBlocked: true };

      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppContact.findFirst.mockResolvedValue(
        mockContact,
      );
      mockPrismaService.whatsAppContact.update.mockResolvedValue(
        blockedContact,
      );

      const result = await service.toggleBlockContact(userId, contactId);

      expect(result.isBlocked).toBe(true);
      expect(mockPrismaService.whatsAppContact.update).toHaveBeenCalledWith({
        where: { id: contactId },
        data: { isBlocked: true },
      });
    });

    it('should toggle block status from true to false', async () => {
      const blockedContact = { ...mockContact, isBlocked: true };
      const unblockedContact = { ...mockContact, isBlocked: false };

      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppContact.findFirst.mockResolvedValue(
        blockedContact,
      );
      mockPrismaService.whatsAppContact.update.mockResolvedValue(
        unblockedContact,
      );

      const result = await service.toggleBlockContact(userId, contactId);

      expect(result.isBlocked).toBe(false);
    });

    it('should throw NotFoundException if contact not found', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppContact.findFirst.mockResolvedValue(null);

      await expect(
        service.toggleBlockContact(userId, contactId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('importContacts', () => {
    it('should import contacts successfully', async () => {
      const contacts: CreateContactDto[] = [
        {
          phoneNumber: '+33612345678',
          name: 'Contact 1',
          email: 'c1@example.com',
        },
        {
          phoneNumber: '+33612345679',
          name: 'Contact 2',
          email: 'c2@example.com',
        },
      ];

      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppContact.findUnique.mockResolvedValue(null);
      mockPrismaService.whatsAppContact.create.mockResolvedValue(mockContact);

      const result = await service.importContacts(userId, contacts);

      expect(result.imported).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should skip existing contacts during import', async () => {
      const contacts: CreateContactDto[] = [
        {
          phoneNumber: '+33612345678',
          name: 'Contact 1',
        },
        {
          phoneNumber: '+33612345679',
          name: 'Contact 2',
        },
      ];

      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppContact.findUnique
        .mockResolvedValueOnce(mockContact) // First contact exists
        .mockResolvedValueOnce(null); // Second contact doesn't exist
      mockPrismaService.whatsAppContact.create.mockResolvedValue(mockContact);

      const result = await service.importContacts(userId, contacts);

      expect(result.imported).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('already exists');
    });

    it('should throw NotFoundException if config not found', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(null);

      await expect(service.importContacts(userId, [])).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('exportContacts', () => {
    it('should export contacts to CSV', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppContact.findMany.mockResolvedValue([
        mockContact,
      ]);

      const result = await service.exportContacts(userId);

      expect(result.data).toBeDefined();
      expect(result.filename).toContain('whatsapp_contacts_');
      expect(result.filename).toContain('.csv');
      expect(result.mimeType).toBe('text/csv');
    });

    it('should export empty CSV if no contacts', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppContact.findMany.mockResolvedValue([]);

      const result = await service.exportContacts(userId);

      expect(result.data).toBeDefined();
      expect(result.filename).toContain('.csv');
    });

    it('should throw NotFoundException if config not found', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(null);

      await expect(service.exportContacts(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getContactStats', () => {
    it('should get contact statistics', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppContact.findFirst.mockResolvedValue(
        mockContact,
      );

      const result = await service.getContactStats(userId, contactId);

      expect(result.totalMessages).toBe(10);
      expect(result.sentMessages).toBe(6);
      expect(result.receivedMessages).toBe(4);
      expect(result.totalConversations).toBe(2);
      expect(result.activeConversations).toBe(1);
      expect(result.avgResponseTime).toBe(15);
    });

    it('should throw NotFoundException if contact not found', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppContact.findFirst.mockResolvedValue(null);

      await expect(
        service.getContactStats(userId, contactId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
