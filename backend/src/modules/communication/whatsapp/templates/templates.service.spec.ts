import { Test, TestingModule } from '@nestjs/testing';
import { TemplatesService } from './templates.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateTemplateDto, UpdateTemplateDto, TemplateFiltersDto } from './dto';

describe('TemplatesService', () => {
  let service: TemplatesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    whatsAppConfig: {
      findUnique: jest.fn(),
    },
    whatsAppTemplate: {
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
  const templateId = 'template-123';

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

  const mockTemplate = {
    id: templateId,
    configId,
    name: 'welcome_message',
    language: 'fr',
    category: 'utility',
    header: 'Welcome',
    body: 'Bonjour {{1}}, bienvenue chez {{2}}!',
    footer: 'Powered by CRM',
    buttons: [],
    variables: ['{{1}}', '{{2}}'],
    status: 'pending',
    approvedAt: null,
    rejectedReason: null,
    sentCount: 10,
    deliveredCount: 9,
    readCount: 8,
    failedCount: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTemplate', () => {
    const createDto: CreateTemplateDto = {
      name: 'welcome_message',
      language: 'fr',
      category: 'utility' as any,
      body: 'Bonjour {{1}}, bienvenue!',
      header: 'Welcome',
      footer: 'Powered by CRM',
    };

    it('should create a template successfully', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppTemplate.findUnique.mockResolvedValue(null);
      mockPrismaService.whatsAppTemplate.create.mockResolvedValue(mockTemplate);

      const result = await service.createTemplate(userId, createDto);

      expect(result).toBeDefined();
      expect(result.name).toBe('welcome_message');
      expect(result.variables).toEqual(['{{1}}', '{{2}}']);
      expect(mockPrismaService.whatsAppConfig.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(mockPrismaService.whatsAppTemplate.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if config not found', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(null);

      await expect(service.createTemplate(userId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if template name exists', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppTemplate.findUnique.mockResolvedValue(
        mockTemplate,
      );

      await expect(service.createTemplate(userId, createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should extract variables from body correctly', async () => {
      const bodyWithVars = 'Hello {{1}}, your code is {{2}} and ref {{3}}';
      const dtoWithVars = { ...createDto, body: bodyWithVars };

      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppTemplate.findUnique.mockResolvedValue(null);
      mockPrismaService.whatsAppTemplate.create.mockImplementation((data) => {
        return Promise.resolve({
          ...mockTemplate,
          body: bodyWithVars,
          variables: data.data.variables,
        });
      });

      const result = await service.createTemplate(userId, dtoWithVars);

      expect(result.variables).toEqual(['{{1}}', '{{2}}', '{{3}}']);
    });
  });

  describe('getTemplates', () => {
    it('should get all templates with pagination', async () => {
      const filters: TemplateFiltersDto = {
        page: 1,
        limit: 20,
      };

      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppTemplate.findMany.mockResolvedValue([
        mockTemplate,
      ]);
      mockPrismaService.whatsAppTemplate.count.mockResolvedValue(1);

      const result = await service.getTemplates(userId, filters);

      expect(result.templates).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter templates by status', async () => {
      const filters: TemplateFiltersDto = {
        status: 'approved' as any,
        page: 1,
        limit: 20,
      };

      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppTemplate.findMany.mockResolvedValue([]);
      mockPrismaService.whatsAppTemplate.count.mockResolvedValue(0);

      await service.getTemplates(userId, filters);

      expect(mockPrismaService.whatsAppTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'approved',
          }),
        }),
      );
    });

    it('should filter templates by category', async () => {
      const filters: TemplateFiltersDto = {
        category: 'marketing' as any,
        page: 1,
        limit: 20,
      };

      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppTemplate.findMany.mockResolvedValue([]);
      mockPrismaService.whatsAppTemplate.count.mockResolvedValue(0);

      await service.getTemplates(userId, filters);

      expect(mockPrismaService.whatsAppTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'marketing',
          }),
        }),
      );
    });

    it('should search templates by name or body', async () => {
      const filters: TemplateFiltersDto = {
        search: 'welcome',
        page: 1,
        limit: 20,
      };

      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppTemplate.findMany.mockResolvedValue([
        mockTemplate,
      ]);
      mockPrismaService.whatsAppTemplate.count.mockResolvedValue(1);

      await service.getTemplates(userId, filters);

      expect(mockPrismaService.whatsAppTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'welcome', mode: 'insensitive' } },
              { body: { contains: 'welcome', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    it('should throw NotFoundException if config not found', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(null);

      await expect(service.getTemplates(userId, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTemplate', () => {
    it('should get a template by ID', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppTemplate.findFirst.mockResolvedValue(
        mockTemplate,
      );

      const result = await service.getTemplate(userId, templateId);

      expect(result).toBeDefined();
      expect(result.id).toBe(templateId);
      expect(result.name).toBe('welcome_message');
    });

    it('should throw NotFoundException if template not found', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppTemplate.findFirst.mockResolvedValue(null);

      await expect(service.getTemplate(userId, templateId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateTemplate', () => {
    const updateDto: UpdateTemplateDto = {
      body: 'Updated body {{1}}',
    };

    it('should update a template successfully', async () => {
      const updatedTemplate = {
        ...mockTemplate,
        body: updateDto.body,
        variables: ['{{1}}'],
      };

      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppTemplate.findFirst.mockResolvedValue(
        mockTemplate,
      );
      mockPrismaService.whatsAppTemplate.update.mockResolvedValue(
        updatedTemplate,
      );

      const result = await service.updateTemplate(userId, templateId, updateDto);

      expect(result.body).toBe('Updated body {{1}}');
      expect(result.variables).toEqual(['{{1}}']);
    });

    it('should throw ConflictException if new name already exists', async () => {
      const updateDto: UpdateTemplateDto = {
        name: 'existing_name',
      };

      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppTemplate.findFirst
        .mockResolvedValueOnce(mockTemplate) // First call to verify ownership
        .mockResolvedValueOnce({ ...mockTemplate, id: 'other-id' }); // Second call to check name conflict

      await expect(
        service.updateTemplate(userId, templateId, updateDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should set approvedAt when status changes to approved', async () => {
      const updateDto: UpdateTemplateDto = {
        status: 'approved' as any,
      };

      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppTemplate.findFirst.mockResolvedValue(
        mockTemplate,
      );
      mockPrismaService.whatsAppTemplate.update.mockImplementation((args) => {
        return Promise.resolve({
          ...mockTemplate,
          ...args.data,
        });
      });

      await service.updateTemplate(userId, templateId, updateDto);

      expect(mockPrismaService.whatsAppTemplate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            approvedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should throw NotFoundException if template not found', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppTemplate.findFirst.mockResolvedValue(null);

      await expect(
        service.updateTemplate(userId, templateId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete a template successfully', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppTemplate.findFirst.mockResolvedValue(
        mockTemplate,
      );
      mockPrismaService.whatsAppTemplate.delete.mockResolvedValue(mockTemplate);

      await service.deleteTemplate(userId, templateId);

      expect(mockPrismaService.whatsAppTemplate.delete).toHaveBeenCalledWith({
        where: { id: templateId },
      });
    });

    it('should throw NotFoundException if template not found', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppTemplate.findFirst.mockResolvedValue(null);

      await expect(service.deleteTemplate(userId, templateId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('duplicateTemplate', () => {
    it('should duplicate a template successfully', async () => {
      const duplicatedTemplate = {
        ...mockTemplate,
        id: 'new-template-id',
        name: 'welcome_message_copy',
        status: 'pending',
      };

      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppTemplate.findFirst.mockResolvedValue(
        mockTemplate,
      );
      mockPrismaService.whatsAppTemplate.findUnique
        .mockResolvedValueOnce(null); // First check: _copy doesn't exist
      mockPrismaService.whatsAppTemplate.create.mockResolvedValue(
        duplicatedTemplate,
      );

      const result = await service.duplicateTemplate(userId, templateId);

      expect(result.name).toBe('welcome_message_copy');
      expect(result.status).toBe('pending');
      expect(mockPrismaService.whatsAppTemplate.create).toHaveBeenCalled();
    });

    it('should handle name conflicts by incrementing counter', async () => {
      const duplicatedTemplate = {
        ...mockTemplate,
        id: 'new-template-id',
        name: 'welcome_message_copy_2',
        status: 'pending',
      };

      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppTemplate.findFirst.mockResolvedValue(
        mockTemplate,
      );
      mockPrismaService.whatsAppTemplate.findUnique
        .mockResolvedValueOnce({ ...mockTemplate, name: 'welcome_message_copy' }) // _copy exists
        .mockResolvedValueOnce(null); // _copy_2 doesn't exist
      mockPrismaService.whatsAppTemplate.create.mockResolvedValue(
        duplicatedTemplate,
      );

      const result = await service.duplicateTemplate(userId, templateId);

      expect(result.name).toBe('welcome_message_copy_2');
    });

    it('should throw NotFoundException if original template not found', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppTemplate.findFirst.mockResolvedValue(null);

      await expect(
        service.duplicateTemplate(userId, templateId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTemplateStats', () => {
    it('should calculate template statistics correctly', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppTemplate.findFirst.mockResolvedValue(
        mockTemplate,
      );

      const result = await service.getTemplateStats(userId, templateId);

      expect(result.sentCount).toBe(10);
      expect(result.deliveredCount).toBe(9);
      expect(result.readCount).toBe(8);
      expect(result.failedCount).toBe(1);
      expect(result.deliveryRate).toBe(90); // 9/10 * 100
      expect(result.readRate).toBe(89); // 8/9 * 100
      expect(result.successRate).toBe(90); // (10-1)/10 * 100
    });

    it('should handle zero stats correctly', async () => {
      const emptyTemplate = {
        ...mockTemplate,
        sentCount: 0,
        deliveredCount: 0,
        readCount: 0,
        failedCount: 0,
      };

      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppTemplate.findFirst.mockResolvedValue(
        emptyTemplate,
      );

      const result = await service.getTemplateStats(userId, templateId);

      expect(result.deliveryRate).toBe(0);
      expect(result.readRate).toBe(0);
      expect(result.successRate).toBe(0);
    });

    it('should throw NotFoundException if template not found', async () => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppTemplate.findFirst.mockResolvedValue(null);

      await expect(
        service.getTemplateStats(userId, templateId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
