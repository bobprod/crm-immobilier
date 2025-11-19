import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { TrackingPlatform, DetectedAnomaly } from '../dto';

/**
 * Service de détection d'anomalies
 */
@Injectable()
export class AnomalyDetectionService {
  constructor(private readonly prisma: PrismaService) {}

  async detectAnomalies(userId: string, platform: TrackingPlatform): Promise<DetectedAnomaly[]> {
    // TODO: Implémenter détection ML réelle
    return [];
  }
}
