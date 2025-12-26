import { Test, TestingModule } from '@nestjs/testing';
import { SemanticSearchService } from './semantic-search.service';
import { PrismaService } from '../../../shared/database/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('SemanticSearchService', () => {
  let service: SemanticSearchService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    properties: {
      findMany: jest.fn(),
    },
    prospects: {
      findMany: jest.fn(),
    },
    appointments: {
      findMany: jest.fn(),
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
        SemanticSearchService,
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

    service = module.get<SemanticSearchService>(SemanticSearchService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('semanticSearch', () => {
    it('should search properties with fallback intent analysis', async () => {
      const mockProperties = [
        {
          id: 'prop1',
          title: 'Appartement vue mer La Marsa',
          description: 'Magnifique appartement',
          address: '123 Avenue',
          city: 'La Marsa',
          type: 'apartment',
          price: 450000,
          surface: 120,
          rooms: 3,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.properties.findMany.mockResolvedValue(mockProperties);
      mockPrismaService.prospects.findMany.mockResolvedValue([]);
      mockPrismaService.appointments.findMany.mockResolvedValue([]);

      const result = await service.semanticSearch('user1', {
        query: 'appartement vue mer',
        searchType: 'properties',
        limit: 10,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'prop1',
        type: 'property',
        title: 'Appartement vue mer La Marsa',
      });
      expect(result[0].relevanceScore).toBeGreaterThan(0);
    });

    it('should return empty array for short queries (<3 chars)', async () => {
      const result = await service.semanticSearch('user1', {
        query: 'ab',
        searchType: 'all',
      });

      expect(result).toEqual([]);
      expect(mockPrismaService.properties.findMany).not.toHaveBeenCalled();
    });

    it('should search across all entity types', async () => {
      mockPrismaService.properties.findMany.mockResolvedValue([
        {
          id: 'prop1',
          title: 'Villa',
          description: '',
          address: '',
          city: 'Tunis',
          type: 'villa',
          price: 500000,
          surface: 200,
          rooms: 4,
          createdAt: new Date(),
        },
      ]);

      mockPrismaService.prospects.findMany.mockResolvedValue([
        {
          id: 'prospect1',
          firstName: 'Ahmed',
          lastName: 'Ben Ali',
          email: 'ahmed@email.com',
          phone: '+216 98 123 456',
          city: 'Tunis',
          budget: 300000,
          createdAt: new Date(),
        },
      ]);

      mockPrismaService.appointments.findMany.mockResolvedValue([]);

      const result = await service.semanticSearch('user1', {
        query: 'Tunis',
        searchType: 'all',
        limit: 10,
      });

      expect(result.length).toBeGreaterThan(0);
      const types = result.map((r) => r.type);
      expect(types).toContain('property');
      expect(types).toContain('prospect');
    });

    it('should sort results by relevance score', async () => {
      const mockProperties = [
        {
          id: 'prop1',
          title: 'Villa Tunis',
          description: 'villa villa villa',
          address: '',
          city: 'Tunis',
          type: 'villa',
          price: 500000,
          surface: 200,
          rooms: 4,
          createdAt: new Date(),
        },
        {
          id: 'prop2',
          title: 'Appartement',
          description: 'villa',
          address: '',
          city: 'Sousse',
          type: 'apartment',
          price: 300000,
          surface: 100,
          rooms: 2,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.properties.findMany.mockResolvedValue(mockProperties);
      mockPrismaService.prospects.findMany.mockResolvedValue([]);
      mockPrismaService.appointments.findMany.mockResolvedValue([]);

      const result = await service.semanticSearch('user1', {
        query: 'villa',
        searchType: 'properties',
        limit: 10,
      });

      expect(result[0].relevanceScore).toBeGreaterThanOrEqual(result[1].relevanceScore);
    });

    it('should limit results', async () => {
      const mockProperties = Array.from({ length: 20 }, (_, i) => ({
        id: `prop${i}`,
        title: `Property ${i}`,
        description: 'Test',
        address: '',
        city: 'Tunis',
        type: 'apartment',
        price: 100000,
        surface: 100,
        rooms: 2,
        createdAt: new Date(),
      }));

      mockPrismaService.properties.findMany.mockResolvedValue(mockProperties);
      mockPrismaService.prospects.findMany.mockResolvedValue([]);
      mockPrismaService.appointments.findMany.mockResolvedValue([]);

      const result = await service.semanticSearch('user1', {
        query: 'Test',
        searchType: 'all',
        limit: 5,
      });

      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getSearchSuggestions', () => {
    it('should return matching suggestions', async () => {
      const result = await service.getSearchSuggestions('user1', 'appartement');

      expect(result).toContain('appartement vue mer');
      expect(result).toContain('appartement 3 pièces');
    });

    it('should return empty array for empty query', async () => {
      const result = await service.getSearchSuggestions('user1', '');

      expect(result).toEqual([]);
    });

    it('should limit suggestions to 5', async () => {
      const result = await service.getSearchSuggestions('user1', 'v');

      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe('calculateRelevanceScore', () => {
    it('should calculate score based on keyword occurrences', async () => {
      const mockProperties = [
        {
          id: 'prop1',
          title: 'Villa moderne villa',
          description: 'villa',
          address: '',
          city: 'Tunis',
          type: 'villa',
          price: 500000,
          surface: 200,
          rooms: 4,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.properties.findMany.mockResolvedValue(mockProperties);
      mockPrismaService.prospects.findMany.mockResolvedValue([]);
      mockPrismaService.appointments.findMany.mockResolvedValue([]);

      const result = await service.semanticSearch('user1', {
        query: 'villa',
        searchType: 'properties',
      });

      expect(result[0].relevanceScore).toBeGreaterThan(0);
      expect(result[0].relevanceScore).toBeLessThanOrEqual(100);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrismaService.properties.findMany.mockRejectedValue(new Error('DB error'));
      mockPrismaService.prospects.findMany.mockRejectedValue(new Error('DB error'));
      mockPrismaService.appointments.findMany.mockRejectedValue(new Error('DB error'));

      const result = await service.semanticSearch('user1', {
        query: 'test query',
        searchType: 'all',
      });

      expect(result).toEqual([]);
    });
  });
});
