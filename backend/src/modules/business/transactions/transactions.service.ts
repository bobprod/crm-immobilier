import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../../../shared/services/database/database.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  CreateTransactionStepDto,
} from './dto/transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly db: DatabaseService) {}

  async create(userId: string, createDto: CreateTransactionDto) {
    // Check if reference already exists
    const existing = await this.db.transaction.findUnique({
      where: { reference: createDto.reference },
    });

    if (existing) {
      throw new ConflictException('Transaction reference already exists');
    }

    // Check if property belongs to user
    const property = await this.db.properties.findFirst({
      where: { id: createDto.propertyId, userId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // 🆕 VALIDATION: Check if property is already sold/rented
    if (property.status === 'sold' || property.status === 'rented') {
      throw new ConflictException(
        `Cannot create transaction on a ${property.status} property`,
      );
    }

    // 🆕 VALIDATION: Check for active transactions on this property
    const activeTransaction = await this.db.transaction.findFirst({
      where: {
        propertyId: createDto.propertyId,
        status: {
          in: ['offer_received', 'offer_accepted', 'promise_signed', 'compromis_signed'],
        },
      },
    });

    if (activeTransaction) {
      throw new ConflictException(
        `Property already has an active transaction (${activeTransaction.reference})`,
      );
    }

    return this.db.transaction.create({
      data: {
        ...createDto,
        userId,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            reference: true,
            price: true,
            city: true,
          },
        },
        prospect: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        mandate: {
          select: {
            id: true,
            reference: true,
            type: true,
          },
        },
      },
    });
  }

  async findAll(userId: string, filters?: {
    status?: string;
    type?: string;
    propertyId?: string;
    prospectId?: string;
    mandateId?: string;
  }) {
    const where: any = { userId };

    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;
    if (filters?.propertyId) where.propertyId = filters.propertyId;
    if (filters?.prospectId) where.prospectId = filters.prospectId;
    if (filters?.mandateId) where.mandateId = filters.mandateId;

    return this.db.transaction.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            reference: true,
            city: true,
          },
        },
        prospect: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        mandate: {
          select: {
            id: true,
            reference: true,
          },
        },
        _count: {
          select: {
            steps: true,
            commissions: true,
            invoices: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const transaction = await this.db.transaction.findFirst({
      where: { id, userId },
      include: {
        property: true,
        prospect: true,
        mandate: true,
        steps: {
          orderBy: {
            completedAt: 'asc',
          },
        },
        commissions: {
          include: {
            agent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        invoices: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async update(id: string, userId: string, updateDto: UpdateTransactionDto) {
    const oldTransaction = await this.findOne(id, userId);

    const updated = await this.db.transaction.update({
      where: { id },
      data: updateDto,
      include: {
        property: true,
        prospect: true,
        mandate: true,
      },
    });

    // 🆕 AUTO-SYNC: Update property status based on transaction status
    if (updateDto.status && updateDto.status !== oldTransaction.status) {
      await this.syncPropertyStatus(updated);
    }

    // 🆕 AUTO-CREATE: Create commissions when transaction is finalized
    if (updateDto.status === 'final_deed_signed' && updated.finalPrice) {
      await this.createCommissionsForTransaction(updated);
    }

    // 🆕 AUTO-UPDATE: Update mandate status
    if (updateDto.status === 'final_deed_signed' && updated.mandateId) {
      await this.db.mandate.update({
        where: { id: updated.mandateId },
        data: { status: 'completed' },
      });
    }

    // 🆕 AUTO-CANCEL: Cancel commissions if transaction is cancelled
    if (updateDto.status === 'cancelled') {
      await this.db.commission.updateMany({
        where: { transactionId: id },
        data: { status: 'cancelled' },
      });
    }

    return updated;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    // Check if transaction has invoices or commissions
    const hasFinancial = await this.db.transaction.findFirst({
      where: {
        id,
        OR: [
          { commissions: { some: {} } },
          { invoices: { some: {} } },
        ],
      },
    });

    if (hasFinancial) {
      throw new ConflictException(
        'Cannot delete transaction with existing invoices or commissions',
      );
    }

    return this.db.transaction.delete({
      where: { id },
    });
  }

  async addStep(transactionId: string, userId: string, stepDto: CreateTransactionStepDto) {
    const transaction = await this.findOne(transactionId, userId);

    return this.db.transactionStep.create({
      data: {
        ...stepDto,
        transactionId: transaction.id,
      },
    });
  }

  async getStats(userId: string) {
    const [total, inProgress, completed, cancelled] = await Promise.all([
      this.db.transaction.count({ where: { userId } }),
      this.db.transaction.count({
        where: {
          userId,
          status: {
            in: ['offer_received', 'offer_accepted', 'promise_signed', 'compromis_signed'],
          },
        },
      }),
      this.db.transaction.count({
        where: { userId, status: 'final_deed_signed' },
      }),
      this.db.transaction.count({
        where: { userId, status: 'cancelled' },
      }),
    ]);

    // Calculate total value
    const transactions = await this.db.transaction.findMany({
      where: { userId, status: 'final_deed_signed' },
      select: { finalPrice: true },
    });

    const totalValue = transactions.reduce(
      (sum, t) => sum + (t.finalPrice || 0),
      0,
    );

    return {
      total,
      inProgress,
      completed,
      cancelled,
      totalValue,
    };
  }

  async getPipeline(userId: string) {
    const stages = [
      'offer_received',
      'offer_accepted',
      'promise_signed',
      'compromis_signed',
      'final_deed_signed',
    ];

    const pipeline = await Promise.all(
      stages.map(async (stage) => {
        const transactions = await this.db.transaction.findMany({
          where: { userId, status: stage as any },
          include: {
            property: {
              select: {
                id: true,
                title: true,
                price: true,
              },
            },
            prospect: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        const totalValue = transactions.reduce(
          (sum, t) => sum + (t.finalPrice || t.negotiatedPrice || t.offerPrice || 0),
          0,
        );

        return {
          stage,
          count: transactions.length,
          totalValue,
          transactions,
        };
      }),
    );

    return pipeline;
  }

  // ========================================
  // 🆕 PRIVATE HELPERS - AUTO SYNC & VALIDATIONS
  // ========================================

  /**
   * Synchronize property status based on transaction status
   */
  private async syncPropertyStatus(transaction: any) {
    let propertyStatus: string;

    switch (transaction.status) {
      case 'final_deed_signed':
        propertyStatus = transaction.type === 'sale' ? 'sold' : 'rented';
        break;
      case 'cancelled':
        propertyStatus = 'available';
        break;
      case 'offer_accepted':
      case 'promise_signed':
      case 'compromis_signed':
        propertyStatus = 'reserved';
        break;
      case 'offer_received':
        propertyStatus = 'pending';
        break;
      default:
        return; // No change
    }

    await this.db.properties.update({
      where: { id: transaction.propertyId },
      data: { status: propertyStatus as any },
    });

    console.log(`✅ Property ${transaction.propertyId} status updated to: ${propertyStatus}`);
  }

  /**
   * Automatically create commissions when transaction is finalized
   */
  private async createCommissionsForTransaction(transaction: any) {
    // Skip if commissions already exist
    const existingCommissions = await this.db.commission.count({
      where: { transactionId: transaction.id },
    });

    if (existingCommissions > 0) {
      console.log('⚠️  Commissions already exist for this transaction, skipping auto-creation');
      return;
    }

    // Get mandate to calculate commission
    const mandate = transaction.mandateId
      ? await this.db.mandate.findUnique({
          where: { id: transaction.mandateId },
        })
      : null;

    if (!mandate) {
      console.log('⚠️  No mandate found, cannot auto-create commission');
      return;
    }

    // Calculate commission amount
    const commissionAmount =
      mandate.commissionType === 'percentage'
        ? (transaction.finalPrice * mandate.commission) / 100
        : mandate.commission;

    // Create commission for the agent
    const commission = await this.db.commission.create({
      data: {
        userId: transaction.userId,
        transactionId: transaction.id,
        agentId: transaction.userId,
        type: 'agent',
        amount: commissionAmount,
        percentage: mandate.commissionType === 'percentage' ? mandate.commission : null,
        currency: transaction.currency,
        status: 'pending',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        notes: `Commission automatique pour transaction ${transaction.reference}`,
      },
    });

    console.log(`✅ Commission created: ${commissionAmount} ${transaction.currency}`);

    // Create exclusivity bonus if applicable
    if (mandate.type === 'exclusive' && mandate.exclusivityBonus) {
      await this.db.commission.create({
        data: {
          userId: transaction.userId,
          transactionId: transaction.id,
          agentId: transaction.userId,
          type: 'bonus',
          amount: mandate.exclusivityBonus,
          currency: transaction.currency,
          status: 'pending',
          notes: 'Bonus d\'exclusivité',
        },
      });

      console.log(`✅ Exclusivity bonus created: ${mandate.exclusivityBonus} ${transaction.currency}`);
    }

    return commission;
  }
}
