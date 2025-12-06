import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../../../shared/services/database/database.service';
import { CreateMandateDto } from './dto/create-mandate.dto';
import { UpdateMandateDto } from './dto/update-mandate.dto';

@Injectable()
export class MandatesService {
  constructor(private readonly db: DatabaseService) {}

  async create(userId: string, createMandateDto: CreateMandateDto) {
    // Check if reference already exists
    const existing = await this.db.mandate.findUnique({
      where: { reference: createMandateDto.reference },
    });

    if (existing) {
      throw new ConflictException('Mandate reference already exists');
    }

    // Check if owner belongs to user
    const owner = await this.db.owner.findFirst({
      where: { id: createMandateDto.ownerId, userId },
    });

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    // 🆕 VALIDATION: Check dates coherence
    const startDate = new Date(createMandateDto.startDate);
    const endDate = new Date(createMandateDto.endDate);

    if (endDate <= startDate) {
      throw new ConflictException('End date must be after start date');
    }

    // 🆕 VALIDATION: If property specified, validate it
    if (createMandateDto.propertyId) {
      const property = await this.db.properties.findFirst({
        where: { id: createMandateDto.propertyId, userId },
      });

      if (!property) {
        throw new NotFoundException('Property not found');
      }

      // 🆕 VALIDATION: Cannot create mandate on sold/rented property
      if (property.status === 'sold' || property.status === 'rented') {
        throw new ConflictException(
          `Cannot create mandate on a ${property.status} property`,
        );
      }

      // 🆕 VALIDATION: Check for active mandate on same property
      const activeMandate = await this.db.mandate.findFirst({
        where: {
          propertyId: createMandateDto.propertyId,
          status: 'active',
        },
      });

      if (activeMandate) {
        throw new ConflictException(
          `Property already has an active mandate (${activeMandate.reference})`,
        );
      }
    }

    const mandate = await this.db.mandate.create({
      data: {
        ...createMandateDto,
        userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            reference: true,
            price: true,
            city: true,
          },
        },
      },
    });

    // 🆕 AUTO-LINK: Link owner to property if not already linked
    if (createMandateDto.propertyId && createMandateDto.ownerId) {
      await this.db.properties.update({
        where: { id: createMandateDto.propertyId },
        data: {
          ownerNewId: createMandateDto.ownerId,
          status: 'available', // Set to available when active mandate created
        },
      });
      console.log(`✅ Property ${createMandateDto.propertyId} linked to owner ${createMandateDto.ownerId}`);
    }

    return mandate;
  }

  async findAll(userId: string, filters?: {
    status?: string;
    type?: string;
    category?: string;
    ownerId?: string;
    propertyId?: string;
    expiringInDays?: number;
  }) {
    const where: any = { userId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.ownerId) {
      where.ownerId = filters.ownerId;
    }

    if (filters?.propertyId) {
      where.propertyId = filters.propertyId;
    }

    // Filter expiring mandates
    if (filters?.expiringInDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + filters.expiringInDays);

      where.status = 'active';
      where.endDate = {
        gte: new Date(),
        lte: futureDate,
      };
    }

    return this.db.mandate.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            reference: true,
            city: true,
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const mandate = await this.db.mandate.findFirst({
      where: { id, userId },
      include: {
        owner: true,
        property: {
          include: {
            propertySeo: true,
          },
        },
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!mandate) {
      throw new NotFoundException(`Mandate with ID ${id} not found`);
    }

    return mandate;
  }

  async update(id: string, userId: string, updateMandateDto: UpdateMandateDto) {
    // Check if mandate exists
    await this.findOne(id, userId);

    return this.db.mandate.update({
      where: { id },
      data: updateMandateDto,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            reference: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    // Check if mandate exists
    await this.findOne(id, userId);

    // Check if mandate has transactions
    const transactionCount = await this.db.transaction.count({
      where: { mandateId: id },
    });

    if (transactionCount > 0) {
      throw new ConflictException('Cannot delete mandate with existing transactions');
    }

    return this.db.mandate.delete({
      where: { id },
    });
  }

  async cancel(id: string, userId: string, reason: string) {
    await this.findOne(id, userId);

    return this.db.mandate.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });
  }

  async getStats(userId: string) {
    const [total, active, expired, exclusive] = await Promise.all([
      this.db.mandate.count({ where: { userId } }),
      this.db.mandate.count({ where: { userId, status: 'active' } }),
      this.db.mandate.count({ where: { userId, status: 'expired' } }),
      this.db.mandate.count({
        where: { userId, status: 'active', type: 'exclusive' },
      }),
    ]);

    // Get expiring soon (within 30 days)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const expiringSoon = await this.db.mandate.count({
      where: {
        userId,
        status: 'active',
        endDate: {
          gte: new Date(),
          lte: futureDate,
        },
      },
    });

    return {
      total,
      active,
      expired,
      exclusive,
      expiringSoon,
    };
  }

  async checkExpiredMandates(userId: string) {
    const expiredMandates = await this.db.mandate.findMany({
      where: {
        userId,
        status: 'active',
        endDate: {
          lt: new Date(),
        },
      },
    });

    // Update status to expired
    if (expiredMandates.length > 0) {
      await this.db.mandate.updateMany({
        where: {
          id: {
            in: expiredMandates.map((m) => m.id),
          },
        },
        data: {
          status: 'expired',
        },
      });
    }

    return expiredMandates;
  }
}
