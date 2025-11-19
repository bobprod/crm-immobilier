import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.users.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        agencyId: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        agencyId: true,
        createdAt: true,
        agencies: true,
      },
    });
  }

  async update(id: string, data: any) {
    const { password, ...updateData } = data;
    return this.prisma.users.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        agencyId: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.users.delete({
      where: { id },
    });
  }
}
