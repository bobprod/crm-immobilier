import { Test, TestingModule } from '@nestjs/testing';
import { BusinessEventHandlers } from './business.event-handlers';
import { BusinessNotificationHelper } from '../notification.helper';
import { BusinessActivityLogger } from '../activity-logger.helper';
import { EmailService } from '../email.service';
import {
  MandateCreatedEvent,
  MandateStatusChangedEvent,
  TransactionCreatedEvent,
  TransactionStatusChangedEvent,
  CommissionCreatedEvent,
} from './business.events';

describe('BusinessEventHandlers', () => {
  let handlers: BusinessEventHandlers;
  let notificationHelper: BusinessNotificationHelper;
  let activityLogger: BusinessActivityLogger;
  let emailService: EmailService;

  const mockNotificationHelper = {
    notifyMandateCreated: jest.fn(),
    notifyMandateExpiring: jest.fn(),
    notifyTransactionCreated: jest.fn(),
    notifyTransactionStatusChanged: jest.fn(),
    notifyTransactionCompleted: jest.fn(),
    notifyCommissionCreated: jest.fn(),
  };

  const mockActivityLogger = {
    logMandateCreated: jest.fn(),
    logMandateStatusChanged: jest.fn(),
    logMandateCancelled: jest.fn(),
    logTransactionCreated: jest.fn(),
    logTransactionStatusChanged: jest.fn(),
    logTransactionCompleted: jest.fn(),
    logCommissionCreated: jest.fn(),
    logInvoiceCreated: jest.fn(),
    logInvoiceStatusChanged: jest.fn(),
    logPaymentCreated: jest.fn(),
    logOwnerCreated: jest.fn(),
  };

  const mockEmailService = {
    sendMandateCreatedEmail: jest.fn(),
    sendTransactionCreatedEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessEventHandlers,
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

    handlers = module.get<BusinessEventHandlers>(BusinessEventHandlers);
    notificationHelper = module.get<BusinessNotificationHelper>(BusinessNotificationHelper);
    activityLogger = module.get<BusinessActivityLogger>(BusinessActivityLogger);
    emailService = module.get<EmailService>(EmailService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handlers).toBeDefined();
  });

  describe('handleMandateCreated', () => {
    it('should handle mandate created event', async () => {
      const mandate = {
        id: 'mandate-123',
        reference: 'MAN-2025-001',
        type: 'exclusive',
      };

      const event = new MandateCreatedEvent('user-123', mandate);

      await handlers.handleMandateCreated(event);

      expect(mockNotificationHelper.notifyMandateCreated).toHaveBeenCalledWith(
        'user-123',
        mandate,
      );
      expect(mockActivityLogger.logMandateCreated).toHaveBeenCalledWith('user-123', mandate);
    });

    it('should not throw error if notification fails', async () => {
      const mandate = { id: 'mandate-123', reference: 'MAN-2025-001' };
      const event = new MandateCreatedEvent('user-123', mandate);

      mockNotificationHelper.notifyMandateCreated.mockRejectedValue(
        new Error('Notification failed'),
      );

      await expect(handlers.handleMandateCreated(event)).resolves.not.toThrow();
    });
  });

  describe('handleMandateStatusChanged', () => {
    it('should log mandate status change', async () => {
      const mandate = { id: 'mandate-123', reference: 'MAN-2025-001' };
      const event = new MandateStatusChangedEvent('user-123', mandate, 'active', 'completed');

      await handlers.handleMandateStatusChanged(event);

      expect(mockActivityLogger.logMandateStatusChanged).toHaveBeenCalledWith(
        'user-123',
        mandate,
        'active',
        'completed',
      );
    });
  });

  describe('handleTransactionCreated', () => {
    it('should handle transaction created event', async () => {
      const transaction = {
        id: 'transaction-123',
        reference: 'TRX-2025-001',
        type: 'sale',
      };

      const event = new TransactionCreatedEvent('user-123', transaction);

      await handlers.handleTransactionCreated(event);

      expect(mockNotificationHelper.notifyTransactionCreated).toHaveBeenCalledWith(
        'user-123',
        transaction,
      );
      expect(mockActivityLogger.logTransactionCreated).toHaveBeenCalledWith(
        'user-123',
        transaction,
      );
    });
  });

  describe('handleTransactionStatusChanged', () => {
    it('should handle transaction status change', async () => {
      const transaction = { id: 'transaction-123', reference: 'TRX-2025-001' };
      const event = new TransactionStatusChangedEvent(
        'user-123',
        transaction,
        'offer_received',
        'offer_accepted',
      );

      await handlers.handleTransactionStatusChanged(event);

      expect(mockNotificationHelper.notifyTransactionStatusChanged).toHaveBeenCalledWith(
        'user-123',
        transaction,
        'offer_received',
        'offer_accepted',
      );
      expect(mockActivityLogger.logTransactionStatusChanged).toHaveBeenCalledWith(
        'user-123',
        transaction,
        'offer_received',
        'offer_accepted',
      );
    });
  });

  describe('handleCommissionCreated', () => {
    it('should handle commission created event', async () => {
      const commission = {
        id: 'commission-123',
        amount: 12500,
        currency: 'TND',
        type: 'agent',
      };

      const event = new CommissionCreatedEvent('user-123', commission, true);

      await handlers.handleCommissionCreated(event);

      expect(mockNotificationHelper.notifyCommissionCreated).toHaveBeenCalledWith(
        'user-123',
        commission,
      );
      expect(mockActivityLogger.logCommissionCreated).toHaveBeenCalledWith(
        'user-123',
        commission,
        true,
      );
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully in all handlers', async () => {
      const mandate = { id: 'mandate-123' };
      const event = new MandateCreatedEvent('user-123', mandate);

      // Make both notification and logging fail
      mockNotificationHelper.notifyMandateCreated.mockRejectedValue(new Error('Failed'));
      mockActivityLogger.logMandateCreated.mockRejectedValue(new Error('Failed'));

      // Should not throw
      await expect(handlers.handleMandateCreated(event)).resolves.not.toThrow();
    });
  });
});
