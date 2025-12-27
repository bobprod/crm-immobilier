import { Test, TestingModule } from '@nestjs/testing';
import { BusinessOrchestrator } from './business-orchestrator.service';
import { DatabaseService } from '../../../shared/services/database/database.service';
import { MandatesService } from '../mandates/mandates.service';
import { TransactionsService } from '../transactions/transactions.service';
import { FinanceService } from '../finance/finance.service';
import { BusinessNotificationHelper } from './notification.helper';
import { BusinessActivityLogger } from './activity-logger.helper';
import { EmailService } from './email.service';

describe('BusinessOrchestrator', () => {
  let orchestrator: BusinessOrchestrator;
  let mandatesService: MandatesService;
  let transactionsService: TransactionsService;
  let financeService: FinanceService;
  let dbService: DatabaseService;

  const mockDatabaseService = {
    mandate: {
      update: jest.fn(),
    },
    properties: {
      update: jest.fn(),
    },
    activity: {
      create: jest.fn(),
    },
  };

  const mockMandatesService = {
    create: jest.fn(),
    findOne: jest.fn(),
  };

  const mockTransactionsService = {
    update: jest.fn(),
    findOne: jest.fn(),
  };

  const mockFinanceService = {
    createInvoice: jest.fn(),
    createPayment: jest.fn(),
  };

  const mockNotificationHelper = {};
  const mockActivityLogger = {};
  const mockEmailService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessOrchestrator,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: MandatesService,
          useValue: mockMandatesService,
        },
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
        {
          provide: FinanceService,
          useValue: mockFinanceService,
        },
        {
          provide: BusinessNotificationHelper,
          useValue: mockNotificationHelper,
        },
        {
          provide: BusinessActivityLogger,
          useValue: mockActivityLogger,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    orchestrator = module.get<BusinessOrchestrator>(BusinessOrchestrator);
    mandatesService = module.get<MandatesService>(MandatesService);
    transactionsService = module.get<TransactionsService>(TransactionsService);
    financeService = module.get<FinanceService>(FinanceService);
    dbService = module.get<DatabaseService>(DatabaseService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(orchestrator).toBeDefined();
  });

  describe('createMandateWithProperty', () => {
    const userId = 'user-123';
    const mandateData = {
      reference: 'MAN-2025-001',
      type: 'exclusive',
      category: 'sale',
      ownerId: 'owner-123',
      propertyId: 'property-123',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      commission: 5,
      commissionType: 'percentage',
    };

    const mockMandate = {
      id: 'mandate-123',
      ...mandateData,
      userId,
      owner: { email: 'owner@example.com' },
    };

    it('should create mandate with all workflow steps', async () => {
      mockMandatesService.create.mockResolvedValue(mockMandate);

      const result = await orchestrator.createMandateWithProperty(userId, mandateData, {
        createFollowUpTask: true,
        sendWelcomeEmail: true,
      });

      expect(result).toEqual(mockMandate);
      expect(mockMandatesService.create).toHaveBeenCalledWith(userId, mandateData);
      expect(mockDatabaseService.activity.create).toHaveBeenCalled(); // Follow-up task
    });

    it('should create mandate without optional steps', async () => {
      mockMandatesService.create.mockResolvedValue(mockMandate);

      const result = await orchestrator.createMandateWithProperty(userId, mandateData);

      expect(result).toEqual(mockMandate);
      expect(mockMandatesService.create).toHaveBeenCalledWith(userId, mandateData);
    });
  });

  describe('renewMandate', () => {
    const userId = 'user-123';
    const oldMandateId = 'old-mandate-123';
    const newDates = {
      startDate: new Date('2025-01-01'),
      endDate: new Date('2026-01-01'),
    };

    const oldMandate = {
      id: oldMandateId,
      reference: 'MAN-2024-001',
      type: 'exclusive',
      category: 'sale',
      ownerId: 'owner-123',
      propertyId: 'property-123',
      commission: 5,
      commissionType: 'percentage',
      status: 'active',
      userId,
    };

    const newMandate = {
      id: 'new-mandate-123',
      reference: expect.stringContaining('MAN-2024-001-R'),
      ...newDates,
      type: oldMandate.type,
      category: oldMandate.category,
      ownerId: oldMandate.ownerId,
      propertyId: oldMandate.propertyId,
      commission: oldMandate.commission,
      commissionType: oldMandate.commissionType,
      userId,
    };

    it('should renew mandate and mark old as completed', async () => {
      mockMandatesService.findOne.mockResolvedValue(oldMandate);
      mockMandatesService.create.mockResolvedValue(newMandate);

      const result = await orchestrator.renewMandate(userId, oldMandateId, newDates);

      expect(mockMandatesService.findOne).toHaveBeenCalledWith(oldMandateId, userId);
      expect(mockMandatesService.create).toHaveBeenCalled();
      expect(mockDatabaseService.mandate.update).toHaveBeenCalledWith({
        where: { id: oldMandateId },
        data: expect.objectContaining({
          status: 'completed',
        }),
      });
      expect(mockDatabaseService.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'mandate_renewed',
        }),
      });
    });
  });

  describe('finalizeTransaction', () => {
    const userId = 'user-123';
    const transactionId = 'transaction-123';
    const finalizationData = {
      finalPrice: 250000,
      actualClosing: new Date(),
      notaryFees: 5000,
      generateInvoice: true,
      buyerInfo: {
        name: 'John Buyer',
        email: 'buyer@example.com',
        phone: '+216 12345678',
        address: '123 Buyer Street',
      },
    };

    const mockTransaction = {
      id: transactionId,
      reference: 'TRX-2025-001',
      type: 'sale',
      status: 'final_deed_signed',
      finalPrice: finalizationData.finalPrice,
      propertyId: 'property-123',
      mandateId: 'mandate-123',
      currency: 'TND',
      property: { title: 'Beautiful Villa' },
      userId,
    };

    const mockInvoice = {
      id: 'invoice-123',
      number: `INV-TRX-2025-001-${Date.now()}`,
      totalAmount: 255000, // finalPrice + notaryFees
    };

    it('should finalize transaction with invoice generation', async () => {
      mockTransactionsService.update.mockResolvedValue(mockTransaction);
      mockFinanceService.createInvoice.mockResolvedValue(mockInvoice);

      const result = await orchestrator.finalizeTransaction(
        userId,
        transactionId,
        finalizationData,
      );

      expect(result.transaction).toEqual(mockTransaction);
      expect(result.invoice).toEqual(mockInvoice);

      expect(mockTransactionsService.update).toHaveBeenCalledWith(
        transactionId,
        userId,
        expect.objectContaining({
          status: 'final_deed_signed',
          finalPrice: finalizationData.finalPrice,
        }),
      );

      expect(mockFinanceService.createInvoice).toHaveBeenCalled();
      expect(mockDatabaseService.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'report_generated',
        }),
      });
    });

    it('should finalize transaction without invoice', async () => {
      mockTransactionsService.update.mockResolvedValue(mockTransaction);

      const result = await orchestrator.finalizeTransaction(userId, transactionId, {
        ...finalizationData,
        generateInvoice: false,
      });

      expect(result.transaction).toEqual(mockTransaction);
      expect(result.invoice).toBeNull();
      expect(mockFinanceService.createInvoice).not.toHaveBeenCalled();
    });
  });

  describe('cancelTransaction', () => {
    const userId = 'user-123';
    const transactionId = 'transaction-123';
    const reason = 'Client changed mind';

    const mockTransaction = {
      id: transactionId,
      reference: 'TRX-2025-001',
      propertyId: 'property-123',
      status: 'offer_accepted',
      userId,
    };

    const cancelledTransaction = {
      ...mockTransaction,
      status: 'cancelled',
    };

    it('should cancel transaction and restore property status', async () => {
      mockTransactionsService.findOne.mockResolvedValue(mockTransaction);
      mockTransactionsService.update.mockResolvedValue(cancelledTransaction);

      const result = await orchestrator.cancelTransaction(userId, transactionId, reason);

      expect(result.status).toBe('cancelled');
      expect(mockTransactionsService.update).toHaveBeenCalledWith(
        transactionId,
        userId,
        expect.objectContaining({
          status: 'cancelled',
        }),
      );

      expect(mockDatabaseService.properties.update).toHaveBeenCalledWith({
        where: { id: mockTransaction.propertyId },
        data: { status: 'available' },
      });

      expect(mockDatabaseService.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'transaction_cancelled',
        }),
      });
    });
  });

  describe('publishProperty', () => {
    const userId = 'user-123';
    const propertyId = 'property-123';

    const mockProperty = {
      id: propertyId,
      title: 'Beautiful Villa',
      status: 'available',
      userId,
      mandates: [
        {
          id: 'mandate-123',
          status: 'active',
        },
      ],
    };

    it('should publish property with active mandate', async () => {
      mockDatabaseService.properties.findFirst = jest.fn().mockResolvedValue(mockProperty);
      mockDatabaseService.properties.update.mockResolvedValue({
        ...mockProperty,
        isPublished: true,
        publishedAt: expect.any(Date),
      });

      const result = await orchestrator.publishProperty(userId, propertyId);

      expect(mockDatabaseService.properties.update).toHaveBeenCalledWith({
        where: { id: propertyId },
        data: expect.objectContaining({
          status: 'available',
          isPublished: true,
          publishedAt: expect.any(Date),
        }),
      });

      expect(mockDatabaseService.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'property_published',
        }),
      });
    });

    it('should throw error if property has no active mandate', async () => {
      mockDatabaseService.properties.findFirst = jest.fn().mockResolvedValue({
        ...mockProperty,
        mandates: [],
      });

      await expect(orchestrator.publishProperty(userId, propertyId)).rejects.toThrow(
        'Cannot publish property without active mandate',
      );
    });
  });

  describe('recordPayment', () => {
    const userId = 'user-123';
    const paymentData = {
      amount: 50000,
      currency: 'TND',
      method: 'bank_transfer',
      invoiceId: 'invoice-123',
      paidAt: new Date(),
    };

    const mockPayment = {
      id: 'payment-123',
      ...paymentData,
      invoice: {
        id: 'invoice-123',
        number: 'INV-001',
      },
    };

    it('should record payment with receipt generation', async () => {
      mockFinanceService.createPayment.mockResolvedValue(mockPayment);

      const result = await orchestrator.recordPayment(userId, paymentData, {
        generateReceipt: true,
        sendConfirmationEmail: false,
      });

      expect(result).toEqual(mockPayment);
      expect(mockFinanceService.createPayment).toHaveBeenCalledWith(userId, paymentData);
      expect(mockDatabaseService.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'receipt_generated',
        }),
      });
    });

    it('should record payment without optional steps', async () => {
      mockFinanceService.createPayment.mockResolvedValue(mockPayment);

      const result = await orchestrator.recordPayment(userId, paymentData);

      expect(result).toEqual(mockPayment);
      expect(mockFinanceService.createPayment).toHaveBeenCalledWith(userId, paymentData);
    });
  });
});
