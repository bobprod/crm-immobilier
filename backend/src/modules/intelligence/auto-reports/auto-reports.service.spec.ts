import { Test, TestingModule } from '@nestjs/testing';
import { AutoReportsService } from './auto-reports.service';
import { PrismaService } from '../../../shared/database/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('AutoReportsService', () => {
  let service: AutoReportsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    prospects: {
      count: jest.fn(),
    },
    properties: {
      count: jest.fn(),
    },
    appointments: {
      count: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'OPENAI_API_KEY') return null; // Test fallback mode
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutoReportsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AutoReportsService>(AutoReportsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateReport', () => {
    beforeEach(() => {
      // Set up default mock responses
      mockPrismaService.prospects.count.mockResolvedValue(100);
      mockPrismaService.properties.count.mockResolvedValue(50);
      mockPrismaService.appointments.count.mockResolvedValue(20);
    });

    it('should generate a daily report', async () => {
      const result = await service.generateReport('user1', {
        reportType: 'daily',
        format: 'json',
      });

      expect(result).toBeDefined();
      expect(result.period).toBeDefined();
      expect(result.period.label).toBe("Aujourd'hui");
      expect(result.summary).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should generate a weekly report', async () => {
      const result = await service.generateReport('user1', {
        reportType: 'weekly',
        format: 'json',
      });

      expect(result).toBeDefined();
      expect(result.period.label).toBe('Cette semaine');
    });

    it('should generate a monthly report', async () => {
      const result = await service.generateReport('user1', {
        reportType: 'monthly',
        format: 'json',
      });

      expect(result).toBeDefined();
      expect(result.period.label).toBe('Ce mois');
    });

    it('should generate a custom report with date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      const result = await service.generateReport('user1', {
        reportType: 'custom',
        startDate,
        endDate,
        format: 'json',
      });

      expect(result).toBeDefined();
      expect(result.period.label).toBe('Période personnalisée');
    });

    it('should include summary statistics', async () => {
      mockPrismaService.prospects.count
        .mockResolvedValueOnce(150) // total
        .mockResolvedValueOnce(12) // new
        .mockResolvedValueOnce(8); // qualified

      mockPrismaService.properties.count
        .mockResolvedValueOnce(45) // total
        .mockResolvedValueOnce(3); // new

      mockPrismaService.appointments.count
        .mockResolvedValueOnce(18) // total
        .mockResolvedValueOnce(15); // completed

      const result = await service.generateReport('user1', {
        reportType: 'weekly',
        format: 'json',
      });

      expect(result.summary.totalProspects).toBe(150);
      expect(result.summary.newProspects).toBe(12);
      expect(result.summary.qualifiedProspects).toBe(8);
      expect(result.summary.totalProperties).toBe(45);
      expect(result.summary.newProperties).toBe(3);
      expect(result.summary.totalAppointments).toBe(18);
      expect(result.summary.completedAppointments).toBe(15);
    });

    it('should generate static insights when no new prospects', async () => {
      mockPrismaService.prospects.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(0) // no new
        .mockResolvedValueOnce(0);

      mockPrismaService.properties.count.mockResolvedValueOnce(50).mockResolvedValueOnce(0);

      mockPrismaService.appointments.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

      const result = await service.generateReport('user1', {
        reportType: 'daily',
        format: 'json',
      });

      expect(result.insights).toContain('Aucune activité significative pendant cette période');
    });

    it('should generate insights for active period', async () => {
      mockPrismaService.prospects.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(15)
        .mockResolvedValueOnce(10);

      mockPrismaService.properties.count.mockResolvedValueOnce(50).mockResolvedValueOnce(5);

      mockPrismaService.appointments.count.mockResolvedValueOnce(20).mockResolvedValueOnce(18);

      const result = await service.generateReport('user1', {
        reportType: 'weekly',
        format: 'json',
      });

      expect(result.insights.length).toBeGreaterThan(0);
      expect(result.insights.some((i) => i.includes('15 nouveaux prospects'))).toBe(true);
      expect(result.insights.some((i) => i.includes('66.7%'))).toBe(true); // Qualification rate
      expect(result.insights.some((i) => i.includes('5 nouvelles propriétés'))).toBe(true);
    });

    it('should generate recommendations based on data', async () => {
      mockPrismaService.prospects.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(2) // Few new prospects
        .mockResolvedValueOnce(0); // Low qualification

      mockPrismaService.properties.count.mockResolvedValueOnce(50).mockResolvedValueOnce(0);

      mockPrismaService.appointments.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

      const result = await service.generateReport('user1', {
        reportType: 'weekly',
        format: 'json',
      });

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(
        result.recommendations.some((r) =>
          r.includes('Intensifier la prospection'),
        ),
      ).toBe(true);
    });

    it('should calculate qualification rate correctly', async () => {
      mockPrismaService.prospects.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(15); // 75% qualification rate

      mockPrismaService.properties.count.mockResolvedValueOnce(50).mockResolvedValueOnce(3);

      mockPrismaService.appointments.count.mockResolvedValueOnce(10).mockResolvedValueOnce(8);

      const result = await service.generateReport('user1', {
        reportType: 'weekly',
        format: 'json',
      });

      // Should not recommend improving qualification since rate is good
      expect(
        result.recommendations.some((r) =>
          r.includes('Améliorer le processus de qualification'),
        ),
      ).toBe(false);
    });

    it('should format period dates correctly', async () => {
      const result = await service.generateReport('user1', {
        reportType: 'weekly',
        format: 'json',
      });

      expect(result.period.startDate).toBeInstanceOf(Date);
      expect(result.period.endDate).toBeInstanceOf(Date);
      expect(result.period.startDate.getTime()).toBeLessThanOrEqual(
        result.period.endDate.getTime(),
      );
    });
  });

  describe('getReportHistory', () => {
    it('should return empty array (not yet implemented)', async () => {
      const result = await service.getReportHistory('user1', 10);

      expect(result).toEqual([]);
    });

    it('should handle limit parameter', async () => {
      const result = await service.getReportHistory('user1', 5);

      expect(result).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrismaService.prospects.count.mockRejectedValue(new Error('DB error'));
      mockPrismaService.properties.count.mockRejectedValue(new Error('DB error'));
      mockPrismaService.appointments.count.mockRejectedValue(new Error('DB error'));

      await expect(
        service.generateReport('user1', {
          reportType: 'daily',
          format: 'json',
        }),
      ).rejects.toThrow();
    });
  });
});
