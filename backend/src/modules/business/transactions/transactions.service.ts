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
    await this.findOne(id, userId);

    return this.db.transaction.update({
      where: { id },
      data: updateDto,
      include: {
        property: true,
        prospect: true,
        mandate: true,
      },
    });
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
}
