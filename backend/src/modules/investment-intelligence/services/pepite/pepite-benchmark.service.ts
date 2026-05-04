import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';

export interface BenchmarkResult {
  avgPriceM2: number | null;
  sampleCount: number;
  city: string;
  type: string;
}

@Injectable()
export class PepiteBenchmarkService {
  private readonly logger = new Logger(PepiteBenchmarkService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAvgPriceM2(city: string, type?: string, agencyId?: string): Promise<BenchmarkResult> {
    try {
      const where: any = {
        deletedAt: null,
        price: { gt: 0 },
      };

      if (city) {
        where.city = { contains: city, mode: 'insensitive' };
      }
      if (type) {
        where.type = { contains: type, mode: 'insensitive' };
      }
      if (agencyId) {
        where.agencyId = agencyId;
      }

      const props = await this.prisma.properties.findMany({
        where,
        select: { price: true, area: true },
        take: 100,
      });

      const withArea = props.filter((p) => p.area && p.area > 0 && p.price && p.price > 0);

      if (withArea.length === 0) {
        return { avgPriceM2: null, sampleCount: 0, city, type: type ?? 'all' };
      }

      const total = withArea.reduce((sum, p) => sum + p.price! / p.area!, 0);
      const avg = total / withArea.length;

      this.logger.log(`Benchmark ${city}/${type}: ${avg.toFixed(0)}/m² (${withArea.length} biens)`);

      return {
        avgPriceM2: Math.round(avg),
        sampleCount: withArea.length,
        city,
        type: type ?? 'all',
      };
    } catch (err: any) {
      this.logger.warn(`Benchmark error: ${err.message}`);
      return { avgPriceM2: null, sampleCount: 0, city, type: type ?? 'all' };
    }
  }

  async isPriceUnderMarket(
    priceRaw: string | null,
    city: string,
    surfaceRaw: string | null,
    type?: string,
    agencyId?: string,
  ): Promise<{ underMarket: boolean; ratio: number | null; avgPriceM2: number | null }> {
    if (!priceRaw || !surfaceRaw) {
      return { underMarket: false, ratio: null, avgPriceM2: null };
    }

    const price = this.extractNumber(priceRaw);
    const surface = this.extractNumber(surfaceRaw);

    if (!price || !surface) {
      return { underMarket: false, ratio: null, avgPriceM2: null };
    }

    const benchmark = await this.getAvgPriceM2(city, type, agencyId);
    if (!benchmark.avgPriceM2) {
      return { underMarket: false, ratio: null, avgPriceM2: null };
    }

    const listingPriceM2 = price / surface;
    const ratio = listingPriceM2 / benchmark.avgPriceM2;
    const underMarket = ratio < 0.85;

    return { underMarket, ratio: Math.round(ratio * 100) / 100, avgPriceM2: benchmark.avgPriceM2 };
  }

  private extractNumber(raw: string): number | null {
    const cleaned = raw.replace(/[^\d.,]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
}
