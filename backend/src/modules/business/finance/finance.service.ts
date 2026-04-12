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
    });

    // Fetch related data in parallel
    const [txn, agent] = await Promise.all([
      this.db.transaction.findFirst({ where: { id: commission.transactionId } }),
      commission.agentId ? this.db.users.findFirst({ where: { id: commission.agentId } }) : null,
    ]);

    const result = {
      ...commission,
      transaction: txn ? { id: txn.id, reference: txn.reference, finalPrice: txn.finalPrice } : null,
      agent: agent ? { id: agent.id, firstName: agent.firstName, lastName: agent.lastName, email: agent.email } : null,
    };

    // 🆕 NOTIFICATION: Notify manual commission created
    try { await this.notificationHelper.notifyCommissionCreated(userId, result); } catch (_) { }

    // 🆕 ACTIVITY LOG: Log manual commission creation
    try { await this.activityLogger.logCommissionCreated(userId, result, false); } catch (_) { }

    return result;
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

    const commissions = await this.db.commission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Collect unique IDs for batch fetching
    const txnIds = [...new Set(commissions.map(c => c.transactionId).filter(Boolean))];
    const agentIds = [...new Set(commissions.map(c => c.agentId).filter(Boolean))];
    const commissionIds = commissions.map(c => c.id);

    const [transactions, agents, payments] = await Promise.all([
      txnIds.length ? this.db.transaction.findMany({ where: { id: { in: txnIds } } }) : [],
      agentIds.length ? this.db.users.findMany({ where: { id: { in: agentIds } } }) : [],
      commissionIds.length ? this.db.payment.findMany({ where: { commissionId: { in: commissionIds } } }) : [],
    ]);

    const txnMap = new Map((transactions as any[]).map(t => [t.id, t]));
    const agentMap = new Map((agents as any[]).map(a => [a.id, a]));

    // Count payments per commission
    const paymentCounts = new Map<string, number>();
    for (const p of payments as any[]) {
      paymentCounts.set(p.commissionId, (paymentCounts.get(p.commissionId) || 0) + 1);
    }

    return commissions.map((c: any) => {
      const txn = txnMap.get(c.transactionId);
      const agent = agentMap.get(c.agentId);
      return {
        ...c,
        transaction: txn ? { id: txn.id, reference: txn.reference } : null,
        agent: agent ? { id: agent.id, firstName: agent.firstName, lastName: agent.lastName } : null,
        _count: { payments: paymentCounts.get(c.id) || 0 },
      };
    });
  }

  async findOneCommission(id: string, userId: string) {
    const commission = await this.db.commission.findFirst({
      where: { id, userId },
    });

    if (!commission) {
      throw new NotFoundException(`Commission with ID ${id} not found`);
    }

    const [txn, agent, payments] = await Promise.all([
      commission.transactionId ? this.db.transaction.findFirst({ where: { id: commission.transactionId } }) : null,
      commission.agentId ? this.db.users.findFirst({ where: { id: commission.agentId } }) : null,
      this.db.payment.findMany({ where: { commissionId: id }, orderBy: { paidAt: 'desc' } }),
    ]);

    return {
      ...commission,
      transaction: txn || null,
      agent: agent || null,
      payments: payments || [],
    };
  }

  async updateCommission(id: string, userId: string, updateDto: UpdateCommissionDto) {
    await this.findOneCommission(id, userId);

    const updated = await this.db.commission.update({
      where: { id },
      data: updateDto,
    });

    return updated;
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
    });

    // Fetch related data
    const [txn, owner] = await Promise.all([
      invoice.transactionId ? this.db.transaction.findFirst({ where: { id: invoice.transactionId } }) : null,
      invoice.ownerId ? this.db.owner.findFirst({ where: { id: invoice.ownerId } }) : null,
    ]);

    const result = {
      ...invoice,
      transaction: txn ? { id: txn.id, reference: txn.reference } : null,
      owner: owner ? { id: owner.id, firstName: owner.firstName, lastName: owner.lastName } : null,
    };

    // 🆕 ACTIVITY LOG: Log invoice creation
    try { await this.activityLogger.logInvoiceCreated(userId, result); } catch (_) { }

    return result;
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

    const invoices = await this.db.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const txnIds = [...new Set((invoices as any[]).map(i => i.transactionId).filter(Boolean))];
    const ownerIds = [...new Set((invoices as any[]).map(i => i.ownerId).filter(Boolean))];
    const invoiceIds = (invoices as any[]).map(i => i.id);

    const [transactions, owners, payments] = await Promise.all([
      txnIds.length ? this.db.transaction.findMany({ where: { id: { in: txnIds } } }) : [],
      ownerIds.length ? this.db.owner.findMany({ where: { id: { in: ownerIds } } }) : [],
      invoiceIds.length ? this.db.payment.findMany({ where: { invoiceId: { in: invoiceIds } } }) : [],
    ]);

    const txnMap = new Map((transactions as any[]).map(t => [t.id, t]));
    const ownerMap = new Map((owners as any[]).map(o => [o.id, o]));
    const paymentCounts = new Map<string, number>();
    for (const p of payments as any[]) {
      paymentCounts.set(p.invoiceId, (paymentCounts.get(p.invoiceId) || 0) + 1);
    }

    return (invoices as any[]).map(inv => {
      const txn = txnMap.get(inv.transactionId);
      const owner = ownerMap.get(inv.ownerId);
      return {
        ...inv,
        transaction: txn ? { id: txn.id, reference: txn.reference } : null,
        owner: owner ? { id: owner.id, firstName: owner.firstName, lastName: owner.lastName } : null,
        _count: { payments: paymentCounts.get(inv.id) || 0 },
      };
    });
  }

  async findOneInvoice(id: string, userId: string) {
    const invoice = await this.db.invoice.findFirst({
      where: { id, userId },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    const [txn, owner, payments] = await Promise.all([
      invoice.transactionId ? this.db.transaction.findFirst({ where: { id: invoice.transactionId } }) : null,
      invoice.ownerId ? this.db.owner.findFirst({ where: { id: invoice.ownerId } }) : null,
      this.db.payment.findMany({ where: { invoiceId: id }, orderBy: { paidAt: 'desc' } }),
    ]);

    return {
      ...invoice,
      transaction: txn || null,
      owner: owner || null,
      payments: payments || [],
    };
  }

  async updateInvoice(id: string, userId: string, updateDto: UpdateInvoiceDto) {
    await this.findOneInvoice(id, userId);

    return this.db.invoice.update({
      where: { id },
      data: updateDto,
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
    });

    // 🆕 ACTIVITY LOG: Log payment creation
    try { await this.activityLogger.logPaymentCreated(userId, payment); } catch (_) { }

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

    const payments = await this.db.payment.findMany({
      where,
      orderBy: { paidAt: 'desc' },
    });

    // Batch-fetch related invoices and commissions
    const invoiceIds = [...new Set((payments as any[]).map(p => p.invoiceId).filter(Boolean))];
    const commissionIds = [...new Set((payments as any[]).map(p => p.commissionId).filter(Boolean))];

    const [invoices, commissions] = await Promise.all([
      invoiceIds.length ? this.db.invoice.findMany({ where: { id: { in: invoiceIds } } }) : [],
      commissionIds.length ? this.db.commission.findMany({ where: { id: { in: commissionIds } } }) : [],
    ]);

    const invoiceMap = new Map((invoices as any[]).map(i => [i.id, i]));
    const commissionMap = new Map((commissions as any[]).map(c => [c.id, c]));

    return (payments as any[]).map(p => {
      const inv = invoiceMap.get(p.invoiceId);
      const comm = commissionMap.get(p.commissionId);
      return {
        ...p,
        invoice: inv ? { id: inv.id, number: inv.number, clientName: inv.clientName } : null,
        commission: comm ? { id: comm.id } : null,
      };
    });
  }

  async findOnePayment(id: string, userId: string) {
    const payment = await this.db.payment.findFirst({
      where: { id, userId },
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
    });

    if (!invoice) return;

    const payments = await this.db.payment.findMany({
      where: { invoiceId },
    });

    const totalPaid = (payments as any[]).reduce((sum, p) => sum + p.amount, 0);

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
      try { await this.activityLogger.logInvoiceStatusChanged(userId, updated, oldStatus, newStatus); } catch (_) { }
    }
  }

  private async updateCommissionPaymentStatus(commissionId: string, userId: string) {
    const commission = await this.db.commission.findUnique({
      where: { id: commissionId },
    });

    if (!commission) return;

    const payments = await this.db.payment.findMany({
      where: { commissionId },
    });

    const totalPaid = (payments as any[]).reduce((sum, p) => sum + p.amount, 0);

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
      try { await this.activityLogger.logCommissionStatusChanged(userId, updated, oldStatus, newStatus); } catch (_) { }
    }
  }

  // ========== STATS ==========

  async getStats(userId: string) {
    const [
      totalCommissions,
      pendingCommissions,
      paidCommissions,
      totalInvoices,
      draftInvoices,
      sentInvoices,
      paidInvoices,
      overdueInvoices,
      totalPayments,
    ] = await Promise.all([
      this.db.commission.count({ where: { userId } }),
      this.db.commission.count({ where: { userId, status: 'pending' } }),
      this.db.commission.count({ where: { userId, status: 'paid' } }),
      this.db.invoice.count({ where: { userId } }),
      this.db.invoice.count({ where: { userId, status: 'draft' } }),
      this.db.invoice.count({ where: { userId, status: 'sent' } }),
      this.db.invoice.count({ where: { userId, status: 'paid' } }),
      this.db.invoice.count({
        where: {
          userId,
          status: { in: ['sent', 'partially_paid'] },
          dueDate: { lt: new Date() },
        },
      }),
      this.db.payment.count({ where: { userId } }),
    ]);

    // Calculate financial totals — all commissions / invoices (not just paid)
    const [allCommissions, paidCommissionsList, allInvoices, paidInvoicesList, allPayments] = await Promise.all([
      this.db.commission.findMany({ where: { userId } }),
      this.db.commission.findMany({ where: { userId, status: 'paid' } }),
      this.db.invoice.findMany({ where: { userId } }),
      this.db.invoice.findMany({ where: { userId, status: 'paid' } }),
      this.db.payment.findMany({ where: { userId } }),
    ]);

    const commissionTotalAmount = allCommissions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const commissionPaidAmount = paidCommissionsList.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const commissionPendingAmount = commissionTotalAmount - commissionPaidAmount;

    const invoiceTotalAmount = allInvoices.reduce((sum, i) => sum + (Number(i.totalAmount) || Number(i.amount) || 0), 0);
    const invoicePaidAmount = paidInvoicesList.reduce((sum, i) => sum + (Number(i.totalAmount) || Number(i.amount) || 0), 0);
    const invoicePendingAmount = invoiceTotalAmount - invoicePaidAmount;

    const paymentTotalAmount = allPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Payment breakdown by method
    const byMethod: Record<string, { count: number; totalAmount: number }> = {};
    for (const p of allPayments) {
      const m = p.method || 'other';
      if (!byMethod[m]) byMethod[m] = { count: 0, totalAmount: 0 };
      byMethod[m].count++;
      byMethod[m].totalAmount += Number(p.amount) || 0;
    }

    return {
      commissions: {
        total: totalCommissions,
        pending: pendingCommissions,
        paid: paidCommissions,
        totalAmount: commissionTotalAmount,
        paidAmount: commissionPaidAmount,
        pendingAmount: commissionPendingAmount,
      },
      invoices: {
        total: totalInvoices,
        draft: draftInvoices,
        sent: sentInvoices,
        paid: paidInvoices,
        overdue: overdueInvoices,
        totalAmount: invoiceTotalAmount,
        paidAmount: invoicePaidAmount,
        pendingAmount: invoicePendingAmount,
      },
      payments: {
        total: totalPayments,
        totalAmount: paymentTotalAmount,
        byMethod: Object.entries(byMethod).map(([method, data]) => ({
          method,
          count: data.count,
          totalAmount: data.totalAmount,
        })),
      },
      revenue: {
        current: commissionPaidAmount + invoicePaidAmount,
        previous: 0,
        growth: 0,
      },
    };
  }
}
