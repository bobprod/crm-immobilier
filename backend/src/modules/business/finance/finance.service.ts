import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService as DatabaseService } from '../../../shared/database/prisma.service';
import {
  CreateCommissionDto,
  UpdateCommissionDto,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  CreatePaymentDto,
  UpdatePaymentDto,
} from './dto/finance.dto';
import { BusinessNotificationHelper } from '../shared/notification.helper';
import { BusinessActivityLogger } from '../shared/activity-logger.helper';

@Injectable()
export class FinanceService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notificationHelper: BusinessNotificationHelper,
    private readonly activityLogger: BusinessActivityLogger,
  ) { }

  // ========== COMMISSIONS ==========

  async createCommission(userId: string, createDto: CreateCommissionDto) {
    // Verify transaction belongs to user
    const transaction = await this.db.transaction.findFirst({
      where: { id: createDto.transactionId, userId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const commission = await this.db.commission.create({
      data: {
        ...createDto,
        userId,
      },
      include: {
        transaction: {
          select: {
            id: true,
            reference: true,
            finalPrice: true,
          },
        },
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // 🆕 NOTIFICATION: Notify manual commission created
    await this.notificationHelper.notifyCommissionCreated(userId, commission);

    // 🆕 ACTIVITY LOG: Log manual commission creation
    await this.activityLogger.logCommissionCreated(userId, commission, false);

    return commission;
  }

  async findAllCommissions(userId: string, filters?: {
    status?: string;
    agentId?: string;
    transactionId?: string;
  }) {
    const where: any = { userId };

    if (filters?.status) where.status = filters.status;
    if (filters?.agentId) where.agentId = filters.agentId;
    if (filters?.transactionId) where.transactionId = filters.transactionId;

    return this.db.commission.findMany({
      where,
      include: {
        transaction: {
          select: {
            id: true,
            reference: true,
            property: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            payments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOneCommission(id: string, userId: string) {
    const commission = await this.db.commission.findFirst({
      where: { id, userId },
      include: {
        transaction: {
          include: {
            property: true,
          },
        },
        agent: true,
        payments: {
          orderBy: {
            paidAt: 'desc',
          },
        },
      },
    });

    if (!commission) {
      throw new NotFoundException(`Commission with ID ${id} not found`);
    }

    return commission;
  }

  async updateCommission(id: string, userId: string, updateDto: UpdateCommissionDto) {
    await this.findOneCommission(id, userId);

    return this.db.commission.update({
      where: { id },
      data: updateDto,
      include: {
        transaction: true,
        agent: true,
      },
    });
  }

  async deleteCommission(id: string, userId: string) {
    await this.findOneCommission(id, userId);

    // Check if commission has payments
    const paymentsCount = await this.db.payment.count({
      where: { commissionId: id },
    });

    if (paymentsCount > 0) {
      throw new ConflictException('Cannot delete commission with existing payments');
    }

    return this.db.commission.delete({
      where: { id },
    });
  }

  // ========== INVOICES ==========

  async createInvoice(userId: string, createDto: CreateInvoiceDto) {
    // Check if invoice number already exists
    const existing = await this.db.invoice.findUnique({
      where: { number: createDto.number },
    });

    if (existing) {
      throw new ConflictException('Invoice number already exists');
    }

    const invoice = await this.db.invoice.create({
      data: {
        ...createDto,
        userId,
      },
      include: {
        transaction: {
          select: {
            id: true,
            reference: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // 🆕 ACTIVITY LOG: Log invoice creation
    await this.activityLogger.logInvoiceCreated(userId, invoice);

    return invoice;
  }

  async findAllInvoices(userId: string, filters?: {
    status?: string;
    clientType?: string;
    transactionId?: string;
    ownerId?: string;
    overdue?: boolean;
  }) {
    const where: any = { userId };

    if (filters?.status) where.status = filters.status;
    if (filters?.clientType) where.clientType = filters.clientType;
    if (filters?.transactionId) where.transactionId = filters.transactionId;
    if (filters?.ownerId) where.ownerId = filters.ownerId;

    if (filters?.overdue) {
      where.status = { in: ['sent', 'partially_paid'] };
      where.dueDate = { lt: new Date() };
    }

    return this.db.invoice.findMany({
      where,
      include: {
        transaction: {
          select: {
            id: true,
            reference: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            payments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOneInvoice(id: string, userId: string) {
    const invoice = await this.db.invoice.findFirst({
      where: { id, userId },
      include: {
        transaction: {
          include: {
            property: true,
          },
        },
        owner: true,
        payments: {
          orderBy: {
            paidAt: 'desc',
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async updateInvoice(id: string, userId: string, updateDto: UpdateInvoiceDto) {
    await this.findOneInvoice(id, userId);

    return this.db.invoice.update({
      where: { id },
      data: updateDto,
      include: {
        transaction: true,
        owner: true,
      },
    });
  }

  async deleteInvoice(id: string, userId: string) {
    await this.findOneInvoice(id, userId);

    // Check if invoice has payments
    const paymentsCount = await this.db.payment.count({
      where: { invoiceId: id },
    });

    if (paymentsCount > 0) {
      throw new ConflictException('Cannot delete invoice with existing payments');
    }

    return this.db.invoice.delete({
      where: { id },
    });
  }

  // ========== PAYMENTS ==========

  async createPayment(userId: string, createDto: CreatePaymentDto) {
    const payment = await this.db.payment.create({
      data: {
        ...createDto,
        userId,
      },
      include: {
        invoice: true,
        commission: true,
      },
    });

    // 🆕 ACTIVITY LOG: Log payment creation
    await this.activityLogger.logPaymentCreated(userId, payment);

    // Auto-update invoice/commission status if fully paid
    if (payment.invoiceId) {
      await this.updateInvoicePaymentStatus(payment.invoiceId, userId);
    }

    if (payment.commissionId) {
      await this.updateCommissionPaymentStatus(payment.commissionId, userId);
    }

    return payment;
  }

  async findAllPayments(userId: string, filters?: {
    invoiceId?: string;
    commissionId?: string;
    method?: string;
  }) {
    const where: any = { userId };

    if (filters?.invoiceId) where.invoiceId = filters.invoiceId;
    if (filters?.commissionId) where.commissionId = filters.commissionId;
    if (filters?.method) where.method = filters.method;

    return this.db.payment.findMany({
      where,
      include: {
        invoice: {
          select: {
            id: true,
            number: true,
            clientName: true,
          },
        },
        commission: {
          select: {
            id: true,
            agent: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        paidAt: 'desc',
      },
    });
  }

  async findOnePayment(id: string, userId: string) {
    const payment = await this.db.payment.findFirst({
      where: { id, userId },
      include: {
        invoice: true,
        commission: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async updatePayment(id: string, userId: string, updateDto: UpdatePaymentDto) {
    await this.findOnePayment(id, userId);

    return this.db.payment.update({
      where: { id },
      data: updateDto,
    });
  }

  async deletePayment(id: string, userId: string) {
    const payment = await this.findOnePayment(id, userId);

    const deleted = await this.db.payment.delete({
      where: { id },
    });

    // Update invoice/commission status after payment deletion
    if (payment.invoiceId) {
      await this.updateInvoicePaymentStatus(payment.invoiceId, userId);
    }

    if (payment.commissionId) {
      await this.updateCommissionPaymentStatus(payment.commissionId, userId);
    }

    return deleted;
  }

  // ========== HELPER METHODS ==========

  private async updateInvoicePaymentStatus(invoiceId: string, userId: string) {
    const invoice = await this.db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: true,
      },
    });

    if (!invoice) return;

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);

    const oldStatus = invoice.status;
    let newStatus = invoice.status;
    if (totalPaid >= invoice.totalAmount) {
      newStatus = 'paid';
    } else if (totalPaid > 0) {
      newStatus = 'partially_paid';
    }

    if (oldStatus !== newStatus) {
      const updated = await this.db.invoice.update({
        where: { id: invoiceId },
        data: { status: newStatus, paidAt: totalPaid >= invoice.totalAmount ? new Date() : null },
      });

      // 🆕 ACTIVITY LOG: Log invoice status change
      await this.activityLogger.logInvoiceStatusChanged(userId, updated, oldStatus, newStatus);
    }
  }

  private async updateCommissionPaymentStatus(commissionId: string, userId: string) {
    const commission = await this.db.commission.findUnique({
      where: { id: commissionId },
      include: {
        payments: true,
      },
    });

    if (!commission) return;

    const totalPaid = commission.payments.reduce((sum, p) => sum + p.amount, 0);

    const oldStatus = commission.status;
    let newStatus = commission.status;
    if (totalPaid >= commission.amount) {
      newStatus = 'paid';
    } else if (totalPaid > 0) {
      newStatus = 'partially_paid';
    }

    if (oldStatus !== newStatus) {
      const updated = await this.db.commission.update({
        where: { id: commissionId },
        data: { status: newStatus, paidAt: totalPaid >= commission.amount ? new Date() : null },
      });

      // 🆕 ACTIVITY LOG: Log commission status change
      await this.activityLogger.logCommissionStatusChanged(userId, updated, oldStatus, newStatus);
    }
  }

  // ========== STATS ==========

  async getStats(userId: string) {
    const [
      totalCommissions,
      pendingCommissions,
      totalInvoices,
      overdueInvoices,
      totalPayments,
    ] = await Promise.all([
      this.db.commission.count({ where: { userId } }),
      this.db.commission.count({ where: { userId, status: 'pending' } }),
      this.db.invoice.count({ where: { userId } }),
      this.db.invoice.count({
        where: {
          userId,
          status: { in: ['sent', 'partially_paid'] },
          dueDate: { lt: new Date() },
        },
      }),
      this.db.payment.count({ where: { userId } }),
    ]);

    // Calculate financial totals
    const [commissions, invoices, payments] = await Promise.all([
      this.db.commission.findMany({
        where: { userId, status: 'paid' },
        select: { amount: true },
      }),
      this.db.invoice.findMany({
        where: { userId, status: 'paid' },
        select: { totalAmount: true },
      }),
      this.db.payment.findMany({
        where: { userId },
        select: { amount: true },
      }),
    ]);

    const totalCommissionValue = commissions.reduce((sum, c) => sum + c.amount, 0);
    const totalInvoiceValue = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalPaymentValue = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      commissions: {
        total: totalCommissions,
        pending: pendingCommissions,
        value: totalCommissionValue,
      },
      invoices: {
        total: totalInvoices,
        overdue: overdueInvoices,
        value: totalInvoiceValue,
      },
      payments: {
        total: totalPayments,
        value: totalPaymentValue,
      },
    };
  }
}
