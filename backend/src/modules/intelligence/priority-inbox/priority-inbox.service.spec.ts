import { Test, TestingModule } from '@nestjs/testing';
import { PriorityInboxService } from './priority-inbox.service';
import { PrismaService } from '../../../shared/database/prisma.service';

describe('PriorityInboxService', () => {
  let service: PriorityInboxService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    prospects: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    appointments: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriorityInboxService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PriorityInboxService>(PriorityInboxService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPriorityInbox', () => {
    it('should return prioritized prospects with scores', async () => {
      const mockProspects = [
        {
          id: 'p1',
          firstName: 'Ahmed',
          lastName: 'Ben Ali',
          phone: '+216 98 123 456',
          email: 'ahmed@email.com',
          budget: 500000,
          city: 'La Marsa',
          status: 'new',
          notes: 'urgent',
          createdAt: new Date(),
        },
      ];

      mockPrismaService.prospects.findMany.mockResolvedValue(mockProspects);
      mockPrismaService.appointments.findMany.mockResolvedValue([]);

      const result = await service.getPriorityInbox('user1', { type: 'all', limit: 20 });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'p1',
        type: 'prospect',
        title: 'Ahmed Ben Ali',
      });
      expect(result[0].priorityScore).toBeGreaterThan(0);
      expect(result[0].urgencyLevel).toBeDefined();
      expect(result[0].reasons).toBeDefined();
    });

    it('should calculate high priority for urgent prospects', async () => {
      const mockProspects = [
        {
          id: 'p1',
          firstName: 'Ahmed',
          lastName: 'Test',
          phone: '+216',
          email: 'test@test.com',
          budget: 600000, // High budget
          city: 'Tunis',
          status: 'qualified', // High engagement
          notes: 'urgent immédiat', // Urgent keywords
          createdAt: new Date(), // New prospect
        },
      ];

      mockPrismaService.prospects.findMany.mockResolvedValue(mockProspects);
      mockPrismaService.appointments.findMany.mockResolvedValue([]);

      const result = await service.getPriorityInbox('user1', { type: 'prospects' });

      expect(result[0].priorityScore).toBeGreaterThanOrEqual(80);
      expect(result[0].urgencyLevel).toBe('critical');
      expect(result[0].reasons).toContain('Contient des mots-clés urgents');
      expect(result[0].reasons).toContain('Budget élevé');
    });

    it('should calculate low priority for old prospects without urgency', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 30);

      const mockProspects = [
        {
          id: 'p1',
          firstName: 'Old',
          lastName: 'Prospect',
          phone: '+216',
          email: 'old@test.com',
          budget: 50000, // Low budget
          city: 'Tunis',
          status: 'new',
          notes: null,
          createdAt: oldDate,
        },
      ];

      mockPrismaService.prospects.findMany.mockResolvedValue(mockProspects);
      mockPrismaService.appointments.findMany.mockResolvedValue([]);

      const result = await service.getPriorityInbox('user1', { type: 'prospects' });

      expect(result[0].priorityScore).toBeLessThan(40);
      expect(result[0].urgencyLevel).toBe('low');
    });

    it('should prioritize upcoming appointments', async () => {
      const soon = new Date();
      soon.setHours(soon.getHours() + 1); // 1 hour from now

      const mockAppointments = [
        {
          id: 'a1',
          title: 'Meeting urgent',
          location: 'Office',
          startTime: soon,
          endTime: new Date(soon.getTime() + 3600000),
          status: 'scheduled',
          notes: 'Important',
          userId: 'user1',
          createdAt: new Date(),
        },
      ];

      mockPrismaService.prospects.findMany.mockResolvedValue([]);
      mockPrismaService.appointments.findMany.mockResolvedValue(mockAppointments);

      const result = await service.getPriorityInbox('user1', { type: 'tasks' });

      expect(result).toHaveLength(1);
      expect(result[0].urgencyLevel).toBe('critical');
      expect(result[0].priorityScore).toBeGreaterThanOrEqual(50);
    });

    it('should filter by type', async () => {
      mockPrismaService.prospects.findMany.mockResolvedValue([
        {
          id: 'p1',
          firstName: 'Test',
          lastName: 'Prospect',
          phone: '+216',
          email: 'test@test.com',
          budget: 100000,
          city: 'Tunis',
          status: 'new',
          notes: null,
          createdAt: new Date(),
        },
      ]);
      mockPrismaService.appointments.findMany.mockResolvedValue([]);

      const result = await service.getPriorityInbox('user1', { type: 'prospects' });

      expect(result.every((item) => item.type === 'prospect')).toBe(true);
      expect(mockPrismaService.appointments.findMany).not.toHaveBeenCalled();
    });

    it('should sort by priority score descending', async () => {
      const mockProspects = [
        {
          id: 'p1',
          firstName: 'Low',
          lastName: 'Priority',
          phone: '+216',
          email: 'low@test.com',
          budget: 50000,
          city: 'Tunis',
          status: 'new',
          notes: null,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'p2',
          firstName: 'High',
          lastName: 'Priority',
          phone: '+216',
          email: 'high@test.com',
          budget: 700000,
          city: 'Tunis',
          status: 'qualified',
          notes: 'urgent',
          createdAt: new Date(),
        },
      ];

      mockPrismaService.prospects.findMany.mockResolvedValue(mockProspects);
      mockPrismaService.appointments.findMany.mockResolvedValue([]);

      const result = await service.getPriorityInbox('user1', { type: 'all' });

      expect(result[0].id).toBe('p2'); // High priority first
      expect(result[0].priorityScore).toBeGreaterThan(result[1].priorityScore);
    });

    it('should limit results', async () => {
      const mockProspects = Array.from({ length: 50 }, (_, i) => ({
        id: `p${i}`,
        firstName: `Person`,
        lastName: `${i}`,
        phone: '+216',
        email: `person${i}@test.com`,
        budget: 100000,
        city: 'Tunis',
        status: 'new',
        notes: null,
        createdAt: new Date(),
      }));

      mockPrismaService.prospects.findMany.mockResolvedValue(mockProspects);
      mockPrismaService.appointments.findMany.mockResolvedValue([]);

      const result = await service.getPriorityInbox('user1', { type: 'all', limit: 10 });

      expect(result).toHaveLength(10);
    });
  });

  describe('getPriorityStats', () => {
    it('should return statistics about priority items', async () => {
      const mockProspects = [
        {
          id: 'p1',
          firstName: 'Critical',
          lastName: 'Prospect',
          phone: '+216',
          email: 'critical@test.com',
          budget: 600000,
          city: 'Tunis',
          status: 'qualified',
          notes: 'urgent',
          createdAt: new Date(),
        },
        {
          id: 'p2',
          firstName: 'Low',
          lastName: 'Prospect',
          phone: '+216',
          email: 'low@test.com',
          budget: 50000,
          city: 'Tunis',
          status: 'new',
          notes: null,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      ];

      mockPrismaService.prospects.findMany.mockResolvedValue(mockProspects);
      mockPrismaService.appointments.findMany.mockResolvedValue([]);

      const stats = await service.getPriorityStats('user1');

      expect(stats).toBeDefined();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.critical).toBeGreaterThanOrEqual(0);
      expect(stats.high).toBeGreaterThanOrEqual(0);
      expect(stats.medium).toBeGreaterThanOrEqual(0);
      expect(stats.low).toBeGreaterThanOrEqual(0);
      expect(stats.byType).toBeDefined();
      expect(stats.byType.prospects).toBeGreaterThanOrEqual(0);
      expect(stats.byType.appointments).toBeGreaterThanOrEqual(0);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrismaService.prospects.findMany.mockRejectedValue(new Error('DB error'));
      mockPrismaService.appointments.findMany.mockRejectedValue(new Error('DB error'));

      const result = await service.getPriorityInbox('user1', { type: 'all' });

      expect(result).toEqual([]);
    });
  });
});
