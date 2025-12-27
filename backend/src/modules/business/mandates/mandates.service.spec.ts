import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { MandatesService } from './mandates.service';
import { DatabaseService } from '../../../shared/services/database/database.service';
import { BusinessNotificationHelper } from '../shared/notification.helper';
import { BusinessActivityLogger } from '../shared/activity-logger.helper';

describe('MandatesService', () => {
  let service: MandatesService;
  let dbService: DatabaseService;
  let notificationHelper: BusinessNotificationHelper;
  let activityLogger: BusinessActivityLogger;

  const mockDatabaseService = {
    mandate: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    owner: {
      findFirst: jest.fn(),
    },
    properties: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      count: jest.fn(),
    },
  };

  const mockNotificationHelper = {
    notifyMandateCreated: jest.fn(),
    notifyMandateExpiring: jest.fn(),
  };

  const mockActivityLogger = {
    logMandateCreated: jest.fn(),
    logMandateStatusChanged: jest.fn(),
    logMandateCancelled: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MandatesService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: BusinessNotificationHelper,
          useValue: mockNotificationHelper,
        },
        {
          provide: BusinessActivityLogger,
          useValue: mockActivityLogger,
        },
      ],
    }).compile();

    service = module.get<MandatesService>(MandatesService);
    dbService = module.get<DatabaseService>(DatabaseService);
    notificationHelper = module.get<BusinessNotificationHelper>(BusinessNotificationHelper);
    activityLogger = module.get<BusinessActivityLogger>(BusinessActivityLogger);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId = 'user-123';
    const createMandateDto = {
      reference: 'MAN-2025-001',
      type: 'exclusive',
      category: 'sale',
      ownerId: 'owner-123',
      propertyId: 'property-123',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      commission: 5,
      commissionType: 'percentage',
      exclusivityBonus: 1000,
      terms: 'Standard terms',
    };

    const mockOwner = {
      id: 'owner-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    };

    const mockProperty = {
      id: 'property-123',
      title: 'Beautiful Villa',
      status: 'available',
    };

    const mockMandate = {
      id: 'mandate-123',
      ...createMandateDto,
      userId,
      owner: mockOwner,
      property: mockProperty,
      status: 'active',
      createdAt: new Date(),
    };

    it('should create a mandate successfully', async () => {
      mockDatabaseService.mandate.findUnique.mockResolvedValue(null);
      mockDatabaseService.owner.findFirst.mockResolvedValue(mockOwner);
      mockDatabaseService.properties.findFirst.mockResolvedValue(mockProperty);
      mockDatabaseService.mandate.findFirst.mockResolvedValue(null);
      mockDatabaseService.mandate.create.mockResolvedValue(mockMandate);

      const result = await service.create(userId, createMandateDto as any);

      expect(result).toEqual(mockMandate);
      expect(mockDatabaseService.mandate.create).toHaveBeenCalledWith({
        data: {
          ...createMandateDto,
          userId,
        },
        include: expect.any(Object),
      });
      expect(mockNotificationHelper.notifyMandateCreated).toHaveBeenCalledWith(userId, mockMandate);
      expect(mockActivityLogger.logMandateCreated).toHaveBeenCalledWith(userId, mockMandate);
    });

    it('should throw ConflictException if reference already exists', async () => {
      mockDatabaseService.mandate.findUnique.mockResolvedValue(mockMandate);

      await expect(service.create(userId, createMandateDto as any)).rejects.toThrow(
        ConflictException,
      );
      expect(mockDatabaseService.mandate.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if owner not found', async () => {
      mockDatabaseService.mandate.findUnique.mockResolvedValue(null);
      mockDatabaseService.owner.findFirst.mockResolvedValue(null);

      await expect(service.create(userId, createMandateDto as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if end date is before start date', async () => {
      const invalidDto = {
        ...createMandateDto,
        startDate: '2025-12-31',
        endDate: '2025-01-01',
      };

      mockDatabaseService.mandate.findUnique.mockResolvedValue(null);
      mockDatabaseService.owner.findFirst.mockResolvedValue(mockOwner);

      await expect(service.create(userId, invalidDto as any)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if property is already sold', async () => {
      mockDatabaseService.mandate.findUnique.mockResolvedValue(null);
      mockDatabaseService.owner.findFirst.mockResolvedValue(mockOwner);
      mockDatabaseService.properties.findFirst.mockResolvedValue({
        ...mockProperty,
        status: 'sold',
      });

      await expect(service.create(userId, createMandateDto as any)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if property already has active mandate', async () => {
      mockDatabaseService.mandate.findUnique.mockResolvedValue(null);
      mockDatabaseService.owner.findFirst.mockResolvedValue(mockOwner);
      mockDatabaseService.properties.findFirst.mockResolvedValue(mockProperty);
      mockDatabaseService.mandate.findFirst.mockResolvedValue({
        id: 'existing-mandate',
        reference: 'MAN-2025-000',
        status: 'active',
      });

      await expect(service.create(userId, createMandateDto as any)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should link owner to property when creating mandate', async () => {
      mockDatabaseService.mandate.findUnique.mockResolvedValue(null);
      mockDatabaseService.owner.findFirst.mockResolvedValue(mockOwner);
      mockDatabaseService.properties.findFirst.mockResolvedValue(mockProperty);
      mockDatabaseService.mandate.findFirst.mockResolvedValue(null);
      mockDatabaseService.mandate.create.mockResolvedValue(mockMandate);

      await service.create(userId, createMandateDto as any);

      expect(mockDatabaseService.properties.update).toHaveBeenCalledWith({
        where: { id: createMandateDto.propertyId },
        data: {
          ownerNewId: createMandateDto.ownerId,
          status: 'available',
        },
      });
    });
  });

  describe('update', () => {
    const userId = 'user-123';
    const mandateId = 'mandate-123';

    const oldMandate = {
      id: mandateId,
      reference: 'MAN-2025-001',
      status: 'active',
      userId,
    };

    const updateDto = {
      status: 'completed',
    };

    const updatedMandate = {
      ...oldMandate,
      ...updateDto,
    };

    it('should update mandate and log status change', async () => {
      mockDatabaseService.mandate.findFirst.mockResolvedValue(oldMandate);
      mockDatabaseService.mandate.update.mockResolvedValue(updatedMandate);

      const result = await service.update(mandateId, userId, updateDto as any);

      expect(result).toEqual(updatedMandate);
      expect(mockActivityLogger.logMandateStatusChanged).toHaveBeenCalledWith(
        userId,
        updatedMandate,
        'active',
        'completed',
      );
    });

    it('should not log status change if status unchanged', async () => {
      mockDatabaseService.mandate.findFirst.mockResolvedValue(oldMandate);
      mockDatabaseService.mandate.update.mockResolvedValue(oldMandate);

      await service.update(mandateId, userId, { notes: 'Updated notes' } as any);

      expect(mockActivityLogger.logMandateStatusChanged).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    const userId = 'user-123';
    const mandateId = 'mandate-123';
    const reason = 'Client requested cancellation';

    const mandate = {
      id: mandateId,
      reference: 'MAN-2025-001',
      status: 'active',
      userId,
    };

    it('should cancel mandate and log activity', async () => {
      mockDatabaseService.mandate.findFirst.mockResolvedValue(mandate);
      mockDatabaseService.mandate.update.mockResolvedValue({
        ...mandate,
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason,
      });

      const result = await service.cancel(mandateId, userId, reason);

      expect(result.status).toBe('cancelled');
      expect(mockActivityLogger.logMandateCancelled).toHaveBeenCalledWith(
        userId,
        expect.any(Object),
        reason,
      );
    });
  });

  describe('checkExpiredMandates', () => {
    const userId = 'user-123';

    it('should mark expired mandates as expired', async () => {
      const expiredMandates = [
        {
          id: 'mandate-1',
          reference: 'MAN-2024-001',
          status: 'active',
          endDate: new Date('2024-12-31'),
          userId,
        },
        {
          id: 'mandate-2',
          reference: 'MAN-2024-002',
          status: 'active',
          endDate: new Date('2024-11-30'),
          userId,
        },
      ];

      mockDatabaseService.mandate.findMany.mockResolvedValue(expiredMandates);
      mockDatabaseService.mandate.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.checkExpiredMandates(userId);

      expect(result).toHaveLength(2);
      expect(mockDatabaseService.mandate.updateMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['mandate-1', 'mandate-2'],
          },
        },
        data: {
          status: 'expired',
        },
      });
    });

    it('should return empty array if no expired mandates', async () => {
      mockDatabaseService.mandate.findMany.mockResolvedValue([]);

      const result = await service.checkExpiredMandates(userId);

      expect(result).toHaveLength(0);
      expect(mockDatabaseService.mandate.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('checkExpiringMandates', () => {
    const userId = 'user-123';

    it('should send notifications for expiring mandates', async () => {
      const expiringMandates = [
        {
          id: 'mandate-1',
          reference: 'MAN-2025-001',
          status: 'active',
          endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
          userId,
          owner: { firstName: 'John', lastName: 'Doe' },
          property: { title: 'Villa' },
        },
      ];

      mockDatabaseService.mandate.findMany.mockResolvedValue(expiringMandates);

      const result = await service.checkExpiringMandates(userId, 30);

      expect(result).toHaveLength(1);
      expect(mockNotificationHelper.notifyMandateExpiring).toHaveBeenCalledWith(
        userId,
        expiringMandates[0],
        expect.any(Number),
      );
    });
  });

  describe('remove', () => {
    const userId = 'user-123';
    const mandateId = 'mandate-123';

    const mandate = {
      id: mandateId,
      reference: 'MAN-2025-001',
      userId,
    };

    it('should delete mandate if no transactions', async () => {
      mockDatabaseService.mandate.findFirst.mockResolvedValue(mandate);
      mockDatabaseService.transaction.count.mockResolvedValue(0);
      mockDatabaseService.mandate.delete.mockResolvedValue(mandate);

      const result = await service.remove(mandateId, userId);

      expect(result).toEqual(mandate);
      expect(mockDatabaseService.mandate.delete).toHaveBeenCalledWith({
        where: { id: mandateId },
      });
    });

    it('should throw ConflictException if mandate has transactions', async () => {
      mockDatabaseService.mandate.findFirst.mockResolvedValue(mandate);
      mockDatabaseService.transaction.count.mockResolvedValue(3);

      await expect(service.remove(mandateId, userId)).rejects.toThrow(ConflictException);
      expect(mockDatabaseService.mandate.delete).not.toHaveBeenCalled();
    });
  });
});
