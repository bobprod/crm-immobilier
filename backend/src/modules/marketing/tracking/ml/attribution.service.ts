import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { AttributionModel } from '../dto';

/**
 * Service d'attribution multi-touch
 */
@Injectable()
export class AttributionService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateAttribution(
    userId: string,
    prospectId: string,
    model: 'last_click' | 'first_click' | 'linear' | 'time_decay' | 'shapley' | 'markov' = 'linear',
  ): Promise<AttributionModel | null> {
    // TODO: Implémenter attribution ML réelle
    return null;
  }
}
