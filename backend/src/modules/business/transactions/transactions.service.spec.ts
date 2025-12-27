import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { DatabaseService } from '../../../shared/services/database/database.service';
import { BusinessNotificationHelper } from '../shared/notification.helper';
import { BusinessActivityLogger } from '../shared/activity-logger.helper';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let dbService: DatabaseService;
  let notificationHelper: BusinessNotificationHelper;
  let activityLogger: BusinessActivityLogger;

  const mockDatabaseService = {
    transaction: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    properties: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    mandate: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    commission: {
      create: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    transactionStep: {
      create: jest.fn(),
    },
  };

  const mockNotificationHelper = {
    notifyTransactionCreated: jest.fn(),
    notifyTransactionStatusChanged: jest.fn(),
    notifyTransactionCompleted: jest.fn(),
    notifyCommissionCreated: jest.fn(),
  };

  const mockActivityLogger = {
    logTransactionCreated: jest.fn(),
    logTransactionStatusChanged: jest.fn(),
    logTransactionCompleted: jest.fn(),
    logTransactionStepAdded: jest.fn(),
    logCommissionCreated: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
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

    service = module.get<TransactionsService>(TransactionsService);
    dbService = module.get<DatabaseService>(DatabaseService);
    notificationHelper = module.get<BusinessNotificationHelper>(BusinessNotificationHelper);
    activityLogger = module.get<BusinessActivityLogger>(BusinessActivityLogger);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId = 'user-123';
    const createDto = {
      reference: 'TRX-2025-001',
      type: 'sale',
      propertyId: 'property-123',
      prospectId: 'prospect-123',
      mandateId: 'mandate-123',
      status: 'offer_received',
      offerPrice: 250000,
      currency: 'TND',
    };

    const mockProperty = {
      id: 'property-123',
      title: 'Beautiful Villa',
      status: 'available',
    };

    const mockTransaction = {
      id: 'transaction-123',
      ...createDto,
      userId,
      property: mockProperty,
      prospect: { id: 'prospect-123', firstName: 'Jane', lastName: 'Smith' },
      mandate: { id: 'mandate-123', reference: 'MAN-2025-001' },
      createdAt: new Date(),
    };

    it('should create a transaction successfully', async () => {
      mockDatabaseService.transaction.findUnique.mockResolvedValue(null);
      mockDatabaseService.properties.findFirst.mockResolvedValue(mockProperty);
      mockDatabaseService.transaction.findFirst.mockResolvedValue(null);
      mockDatabaseService.transaction.create.mockResolvedValue(mockTransaction);

      const result = await service.create(userId, createDto as any);

      expect(result).toEqual(mockTransaction);
      expect(mockNotificationHelper.notifyTransactionCreated).toHaveBeenCalledWith(
        userId,
        mockTransaction,
      );
      expect(mockActivityLogger.logTransactionCreated).toHaveBeenCalledWith(userId, mockTransaction);
    });

    it('should throw ConflictException if reference already exists', async () => {
      mockDatabaseService.transaction.findUnique.mockResolvedValue(mockTransaction);

      await expect(service.create(userId, createDto as any)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if property not found', async () => {
      mockDatabaseService.transaction.findUnique.mockResolvedValue(null);
      mockDatabaseService.properties.findFirst.mockResolvedValue(null);

      await expect(service.create(userId, createDto as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if property is sold', async () => {
      mockDatabaseService.transaction.findUnique.mockResolvedValue(null);
      mockDatabaseService.properties.findFirst.mockResolvedValue({
        ...mockProperty,
        status: 'sold',
      });

      await expect(service.create(userId, createDto as any)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if property has active transaction', async () => {
      mockDatabaseService.transaction.findUnique.mockResolvedValue(null);
      mockDatabaseService.properties.findFirst.mockResolvedValue(mockProperty);
      mockDatabaseService.transaction.findFirst.mockResolvedValue({
        id: 'existing-transaction',
        reference: 'TRX-2025-000',
        status: 'offer_accepted',
      });

      await expect(service.create(userId, createDto as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    const userId = 'user-123';
    const transactionId = 'transaction-123';

    const oldTransaction = {
      id: transactionId,
      reference: 'TRX-2025-001',
      status: 'offer_received',
      type: 'sale',
      propertyId: 'property-123',
      mandateId: 'mandate-123',
      finalPrice: null,
      userId,
    };

    it('should update transaction and sync property status', async () => {
      const updateDto = { status: 'offer_accepted' };
      const updatedTransaction = { ...oldTransaction, ...updateDto };

      mockDatabaseService.transaction.findFirst.mockResolvedValue(oldTransaction);
      mockDatabaseService.transaction.update.mockResolvedValue(updatedTransaction);

      await service.update(transactionId, userId, updateDto as any);

      expect(mockDatabaseService.properties.update).toHaveBeenCalledWith({
        where: { id: oldTransaction.propertyId },
        data: { status: expect.any(String) },
      });

      expect(mockNotificationHelper.notifyTransactionStatusChanged).toHaveBeenCalledWith(
        userId,
        updatedTransaction,
        'offer_received',
        'offer_accepted',
      );

      expect(mockActivityLogger.logTransactionStatusChanged).toHaveBeenCalledWith(
        userId,
        updatedTransaction,
        'offer_received',
        'offer_accepted',
      );
    });

    it('should create commissions when finalized', async () => {
      const updateDto = { status: 'final_deed_signed', finalPrice: 250000 };
      const updatedTransaction = {
        ...oldTransaction,
        ...updateDto,
        mandate: {
          id: 'mandate-123',
          commission: 5,
          commissionType: 'percentage',
          type: 'simple',
        },
      };

      mockDatabaseService.transaction.findFirst.mockResolvedValue(oldTransaction);
      mockDatabaseService.transaction.update.mockResolvedValue(updatedTransaction);
      mockDatabaseService.mandate.findUnique.mockResolvedValue(updatedTransaction.mandate);
      mockDatabaseService.commission.count.mockResolvedValue(0);
      mockDatabaseService.commission.create.mockResolvedValue({
        id: 'commission-123',
        amount: 12500,
        type: 'agent',
      });

      await service.update(transactionId, userId, updateDto as any);

      expect(mockDatabaseService.commission.create).toHaveBeenCalled();
      expect(mockNotificationHelper.notifyTransactionCompleted).toHaveBeenCalled();
      expect(mockActivityLogger.logTransactionCompleted).toHaveBeenCalled();
    });

    it('should update mandate status when transaction finalized', async () => {
      const updateDto = { status: 'final_deed_signed', finalPrice: 250000 };
      const updatedTransaction = { ...oldTransaction, ...updateDto };

      mockDatabaseService.transaction.findFirst.mockResolvedValue(oldTransaction);
      mockDatabaseService.transaction.update.mockResolvedValue(updatedTransaction);
      mockDatabaseService.mandate.findUnique.mockResolvedValue(null);

      await service.update(transactionId, userId, updateDto as any);

      expect(mockDatabaseService.mandate.update).toHaveBeenCalledWith({
        where: { id: oldTransaction.mandateId },
        data: { status: 'completed' },
      });
    });

    it('should cancel commissions when transaction cancelled', async () => {
      const updateDto = { status: 'cancelled' };
      const updatedTransaction = { ...oldTransaction, ...updateDto };

      mockDatabaseService.transaction.findFirst.mockResolvedValue(oldTransaction);
      mockDatabaseService.transaction.update.mockResolvedValue(updatedTransaction);

      await service.update(transactionId, userId, updateDto as any);

      expect(mockDatabaseService.commission.updateMany).toHaveBeenCalledWith({
        where: { transactionId },
        data: { status: 'cancelled' },
      });
    });
  });

  describe('addStep', () => {
    const userId = 'user-123';
    const transactionId = 'transaction-123';
    const stepDto = {
      name: 'Offer Negotiation',
      status: 'completed',
      completedAt: new Date(),
      notes: 'Price agreed at 240000',
    };

    const mockTransaction = {
      id: transactionId,
      reference: 'TRX-2025-001',
      userId,
    };

    const mockStep = {
      id: 'step-123',
      ...stepDto,
      transactionId,
    };

    it('should add step and log activity', async () => {
      mockDatabaseService.transaction.findFirst.mockResolvedValue(mockTransaction);
      mockDatabaseService.transactionStep.create.mockResolvedValue(mockStep);

      const result = await service.addStep(transactionId, userId, stepDto as any);

      expect(result).toEqual(mockStep);
      expect(mockActivityLogger.logTransactionStepAdded).toHaveBeenCalledWith(
        userId,
        mockTransaction,
        mockStep,
      );
    });
  });

  describe('syncPropertyStatus', () => {
    it('should set property to sold when transaction finalized for sale', async () => {
      const transaction = {
        id: 'transaction-123',
        status: 'final_deed_signed',
        type: 'sale',
        propertyId: 'property-123',
        currency: 'TND',
      };

      mockDatabaseService.properties.update.mockResolvedValue({ status: 'sold' });

      // Call the private method through update
      mockDatabaseService.transaction.findFirst.mockResolvedValue(transaction);
      mockDatabaseService.transaction.update.mockResolvedValue(transaction);

      await service.update('transaction-123', 'user-123', { status: 'final_deed_signed' } as any);

      expect(mockDatabaseService.properties.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: { status: 'sold' },
      });
    });

    it('should set property to rented when transaction finalized for rent', async () => {
      const transaction = {
        id: 'transaction-123',
        status: 'final_deed_signed',
        type: 'rent',
        propertyId: 'property-123',
        currency: 'TND',
      };

      mockDatabaseService.transaction.findFirst.mockResolvedValue(transaction);
      mockDatabaseService.transaction.update.mockResolvedValue(transaction);

      await service.update('transaction-123', 'user-123', { status: 'final_deed_signed' } as any);

      expect(mockDatabaseService.properties.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: { status: 'rented' },
      });
    });

    it('should set property to available when transaction cancelled', async () => {
      const transaction = {
        id: 'transaction-123',
        status: 'cancelled',
        propertyId: 'property-123',
        currency: 'TND',
      };

      mockDatabaseService.transaction.findFirst.mockResolvedValue({
        ...transaction,
        status: 'offer_accepted',
      });
      mockDatabaseService.transaction.update.mockResolvedValue(transaction);

      await service.update('transaction-123', 'user-123', { status: 'cancelled' } as any);

      expect(mockDatabaseService.properties.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: { status: 'available' },
      });
    });
  });
});
