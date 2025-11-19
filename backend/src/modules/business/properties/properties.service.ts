import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: any) {
    return this.prisma.properties.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async findAll(userId: string, filters?: any) {
    const where: any = { userId };

    if (filters?.type) where.type = filters.type;
    if (filters?.category) where.category = filters.category;
    if (filters?.status) where.status = filters.status;
    if (filters?.city) where.city = filters.city;
    if (filters?.minPrice) where.price = { ...where.price, gte: parseFloat(filters.minPrice) };
    if (filters?.maxPrice) where.price = { ...where.price, lte: parseFloat(filters.maxPrice) };

    return this.prisma.properties.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.properties.findFirst({
      where: { id, userId },
    });
  }

  async update(id: string, userId: string, data: any) {
    return this.prisma.properties.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.properties.delete({
      where: { id },
    });
  }

  async syncWithWordPress(id: string, userId: string, wpSyncId: string) {
    return this.prisma.properties.update({
      where: { id },
      data: {
        wpSyncId,
        wpSyncedAt: new Date(),
      },
    });
  }
}
