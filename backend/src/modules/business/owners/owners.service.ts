import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../../shared/services/database/database.service';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';

@Injectable()
export class OwnersService {
  constructor(private readonly db: DatabaseService) {}

  async create(userId: string, createOwnerDto: CreateOwnerDto) {
    return this.db.owner.create({
      data: {
        ...createOwnerDto,
        userId,
      },
      include: {
        properties: {
          select: {
            id: true,
            title: true,
            reference: true,
          },
        },
        mandates: {
          select: {
            id: true,
            reference: true,
            status: true,
            endDate: true,
          },
        },
      },
    });
  }

  async findAll(userId: string, filters?: {
    search?: string;
    isActive?: boolean;
    city?: string;
  }) {
    const where: any = { userId };

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.city) {
      where.city = filters.city;
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.db.owner.findMany({
      where,
      include: {
        _count: {
          select: {
            properties: true,
            mandates: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const owner = await this.db.owner.findFirst({
      where: { id, userId },
      include: {
        properties: {
          include: {
            propertySeo: true,
          },
        },
        mandates: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                reference: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        invoices: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!owner) {
      throw new NotFoundException(`Owner with ID ${id} not found`);
    }

    return owner;
  }

  async update(id: string, userId: string, updateOwnerDto: UpdateOwnerDto) {
    // Check if owner exists
    await this.findOne(id, userId);

    return this.db.owner.update({
      where: { id },
      data: updateOwnerDto,
      include: {
        _count: {
          select: {
            properties: true,
            mandates: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    // Check if owner exists
    await this.findOne(id, userId);

    // Check if owner has active mandates
    const activeMandates = await this.db.mandate.count({
      where: {
        ownerId: id,
        status: 'active',
      },
    });

    if (activeMandates > 0) {
      throw new Error('Cannot delete owner with active mandates');
    }

    return this.db.owner.delete({
      where: { id },
    });
  }

  async getStats(userId: string) {
    const [total, active, withMandates, withProperties] = await Promise.all([
      this.db.owner.count({ where: { userId } }),
      this.db.owner.count({ where: { userId, isActive: true } }),
      this.db.owner.count({
        where: {
          userId,
          mandates: {
            some: {
              status: 'active',
            },
          },
        },
      }),
      this.db.owner.count({
        where: {
          userId,
          properties: {
            some: {},
          },
        },
      }),
    ]);

    return {
      total,
      active,
      withMandates,
      withProperties,
    };
  }
}
