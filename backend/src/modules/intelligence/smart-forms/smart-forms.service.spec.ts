import { Test, TestingModule } from '@nestjs/testing';
import { SmartFormsService } from './smart-forms.service';
import { PrismaService } from '../../../shared/database/prisma.service';

describe('SmartFormsService', () => {
  let service: SmartFormsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    prospects: {
      findMany: jest.fn(),
    },
    properties: {
      findMany: jest.fn(),
    },
    appointments: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmartFormsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SmartFormsService>(SmartFormsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFieldSuggestions', () => {
    it('should return empty array for short input (<2 chars)', async () => {
      const result = await service.getFieldSuggestions('user1', {
        fieldName: 'city',
        partialValue: 'L',
        formType: 'prospect',
      });

      expect(result).toEqual([]);
      expect(mockPrismaService.prospects.findMany).not.toHaveBeenCalled();
    });

    it('should return suggestions for prospect city field', async () => {
      const mockProspects = [
        { city: 'La Marsa', createdAt: new Date('2024-01-01') },
        { city: 'La Marsa', createdAt: new Date('2024-01-02') },
        { city: 'La Soukra', createdAt: new Date('2024-01-03') },
      ];

      mockPrismaService.prospects.findMany.mockResolvedValue(mockProspects);

      const result = await service.getFieldSuggestions('user1', {
        fieldName: 'city',
        partialValue: 'La',
        formType: 'prospect',
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        value: 'La Marsa',
        label: 'La Marsa',
        frequency: 2,
      });
      expect(result[1]).toMatchObject({
        value: 'La Soukra',
        label: 'La Soukra',
        frequency: 1,
      });
    });

    it('should reject unauthorized field names', async () => {
      const result = await service.getFieldSuggestions('user1', {
        fieldName: 'password', // Not in whitelist
        partialValue: 'test',
        formType: 'prospect',
      });

      expect(result).toEqual([]);
      expect(mockPrismaService.prospects.findMany).not.toHaveBeenCalled();
    });

    it('should sort suggestions by frequency', async () => {
      const mockProspects = [
        { city: 'Tunis', createdAt: new Date('2024-01-01') },
        { city: 'La Marsa', createdAt: new Date('2024-01-02') },
        { city: 'La Marsa', createdAt: new Date('2024-01-03') },
        { city: 'Tunis', createdAt: new Date('2024-01-04') },
        { city: 'Tunis', createdAt: new Date('2024-01-05') },
      ];

      mockPrismaService.prospects.findMany.mockResolvedValue(mockProspects);

      const result = await service.getFieldSuggestions('user1', {
        fieldName: 'city',
        partialValue: 'T',
        formType: 'prospect',
      });

      expect(result[0].value).toBe('Tunis');
      expect(result[0].frequency).toBe(3);
      expect(result[1].value).toBe('La Marsa');
      expect(result[1].frequency).toBe(2);
    });
  });

  describe('getProspectAutoFill', () => {
    it('should return matching prospects by name', async () => {
      const mockProspects = [
        {
          id: 'p1',
          firstName: 'Ahmed',
          lastName: 'Ben Ali',
          phone: '+216 98 123 456',
          email: 'ahmed@email.com',
          city: 'La Marsa',
          budget: 350000,
        },
      ];

      mockPrismaService.prospects.findMany.mockResolvedValue(mockProspects);

      const result = await service.getProspectAutoFill('user1', 'Ahmed');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'p1',
        firstName: 'Ahmed',
        lastName: 'Ben Ali',
        phone: '+216 98 123 456',
      });
    });

    it('should limit results to 5', async () => {
      const mockProspects = Array.from({ length: 10 }, (_, i) => ({
        id: `p${i}`,
        firstName: 'Ahmed',
        lastName: `Person ${i}`,
        phone: `+216 ${i}`,
        email: `person${i}@email.com`,
        city: 'Tunis',
        budget: 100000,
      }));

      mockPrismaService.prospects.findMany.mockResolvedValue(mockProspects.slice(0, 5));

      const result = await service.getProspectAutoFill('user1', 'Ahmed');

      expect(result).toHaveLength(5);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrismaService.prospects.findMany.mockRejectedValue(new Error('DB error'));

      const result = await service.getFieldSuggestions('user1', {
        fieldName: 'city',
        partialValue: 'La',
        formType: 'prospect',
      });

      expect(result).toEqual([]);
    });
  });
});
