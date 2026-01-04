import { Test, TestingModule } from '@nestjs/testing';
import { MarketingTrackingController } from './tracking.controller';
import { TrackingConfigService } from './services/tracking-config.service';
import { TrackingEventsService } from './services/tracking-events.service';
import {
  TrackingPlatform,
  CreateTrackingConfigDto,
  MetaPixelConfig,
  PublicTrackingEventDto,
} from './dto/tracking.dto';

describe('MarketingTrackingController', () => {
  let controller: MarketingTrackingController;
  let configService: TrackingConfigService;
  let eventsService: TrackingEventsService;

  const mockConfigService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    testConnection: jest.fn(),
    getActiveConfigs: jest.fn(),
  };

  const mockEventsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    getStats: jest.fn(),
    getRecentEvents: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketingTrackingController],
      providers: [
        {
          provide: TrackingConfigService,
          useValue: mockConfigService,
        },
        {
          provide: TrackingEventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    controller = module.get<MarketingTrackingController>(
      MarketingTrackingController
    );
    configService = module.get<TrackingConfigService>(TrackingConfigService);
    eventsService = module.get<TrackingEventsService>(TrackingEventsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createConfig', () => {
    it('should create a new tracking configuration', async () => {
      const req = { user: { userId: 'test-user-id' } };
      const metaConfig: MetaPixelConfig = {
        pixelId: '123456789012345',
        accessToken: 'EAAtest',
      };

      const createDto: CreateTrackingConfigDto = {
        platform: TrackingPlatform.FACEBOOK,
        config: metaConfig,
        isActive: true,
        useServerSide: true,
      };

      const expectedResult = {
        id: '1',
        userId: 'test-user-id',
        platform: TrackingPlatform.FACEBOOK,
        config: metaConfig,
        isActive: true,
        useServerSide: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockConfigService.create.mockResolvedValue(expectedResult);

      const result = await controller.createConfig(req, createDto);

      expect(result).toEqual(expectedResult);
      expect(configService.create).toHaveBeenCalledWith(
        'test-user-id',
        createDto
      );
    });

    it('should handle multiple platforms', async () => {
      const req = { user: { userId: 'test-user-id' } };

      // Test Meta Pixel
      const metaDto: CreateTrackingConfigDto = {
        platform: TrackingPlatform.FACEBOOK,
        config: { pixelId: '123456789012345' },
        isActive: true,
      };

      mockConfigService.create.mockResolvedValue({
        id: '1',
        userId: 'test-user-id',
        ...metaDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await controller.createConfig(req, metaDto);

      // Test GTM
      const gtmDto: CreateTrackingConfigDto = {
        platform: TrackingPlatform.GTM,
        config: { containerId: 'GTM-XXXXXXX' },
        isActive: true,
      };

      mockConfigService.create.mockResolvedValue({
        id: '2',
        userId: 'test-user-id',
        ...gtmDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await controller.createConfig(req, gtmDto);

      expect(configService.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAllConfigs', () => {
    it('should return all tracking configurations', async () => {
      const req = { user: { userId: 'test-user-id' } };
      const expectedConfigs = [
        {
          id: '1',
          userId: 'test-user-id',
          platform: TrackingPlatform.FACEBOOK,
          config: { pixelId: '123456789012345' },
          isActive: true,
          useServerSide: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          userId: 'test-user-id',
          platform: TrackingPlatform.GTM,
          config: { containerId: 'GTM-XXXXXXX' },
          isActive: true,
          useServerSide: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockConfigService.findAll.mockResolvedValue(expectedConfigs);

      const result = await controller.getAllConfigs(req);

      expect(result).toEqual(expectedConfigs);
      expect(result).toHaveLength(2);
      expect(configService.findAll).toHaveBeenCalledWith('test-user-id');
    });
  });

  describe('getConfig', () => {
    it('should return a specific platform configuration', async () => {
      const req = { user: { userId: 'test-user-id' } };
      const platform = TrackingPlatform.FACEBOOK;

      const expectedConfig = {
        id: '1',
        userId: 'test-user-id',
        platform,
        config: { pixelId: '123456789012345' },
        isActive: true,
        useServerSide: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockConfigService.findOne.mockResolvedValue(expectedConfig);

      const result = await controller.getConfig(req, platform);

      expect(result).toEqual(expectedConfig);
      expect(configService.findOne).toHaveBeenCalledWith(
        'test-user-id',
        platform
      );
    });

    it('should return null for non-existent configuration', async () => {
      const req = { user: { userId: 'test-user-id' } };
      const platform = TrackingPlatform.SNAPCHAT;

      mockConfigService.findOne.mockResolvedValue(null);

      const result = await controller.getConfig(req, platform);

      expect(result).toBeNull();
    });
  });

  describe('deleteConfig', () => {
    it('should delete a tracking configuration', async () => {
      const req = { user: { userId: 'test-user-id' } };
      const platform = TrackingPlatform.TIKTOK;

      const deletedConfig = {
        id: '1',
        userId: 'test-user-id',
        platform,
        config: { pixelId: 'XXXXXXXXXXXXX' },
        isActive: true,
        useServerSide: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockConfigService.delete.mockResolvedValue(deletedConfig);

      const result = await controller.deleteConfig(req, platform);

      expect(result).toEqual(deletedConfig);
      expect(configService.delete).toHaveBeenCalledWith(
        'test-user-id',
        platform
      );
    });
  });

  describe('testConfig', () => {
    it('should test Meta Pixel connection successfully', async () => {
      const req = { user: { userId: 'test-user-id' } };
      const platform = TrackingPlatform.FACEBOOK;

      const testResult = {
        success: true,
        message: 'Meta Pixel connection successful',
        details: {
          pixelId: '123456789012345',
          valid: true,
        },
      };

      mockConfigService.testConnection.mockResolvedValue(testResult);

      const result = await controller.testConfig(req, platform);

      expect(result.success).toBe(true);
      expect(result.message).toContain('successful');
    });

    it('should return error for invalid configuration', async () => {
      const req = { user: { userId: 'test-user-id' } };
      const platform = TrackingPlatform.FACEBOOK;

      const testResult = {
        success: false,
        message: 'Invalid Pixel ID format',
      };

      mockConfigService.testConnection.mockResolvedValue(testResult);

      const result = await controller.testConfig(req, platform);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid');
    });
  });

  describe('createEvent', () => {
    it('should create a tracking event', async () => {
      const req = { user: { userId: 'test-user-id' } };
      const eventDto: PublicTrackingEventDto = {
        eventName: 'Lead',
        data: {
          propertyId: '123',
          leadType: 'contact_form',
        },
        sessionId: 'session-123',
        url: 'https://example.com/property/123',
      };

      const expectedEvent = {
        id: '1',
        userId: 'test-user-id',
        eventName: 'Lead',
        eventType: 'standard',
        platform: TrackingPlatform.FACEBOOK,
        data: eventDto.data,
        sessionId: eventDto.sessionId,
        url: eventDto.url,
        createdAt: new Date(),
      };

      mockEventsService.create.mockResolvedValue(expectedEvent);

      const result = await controller.createEvent(req, eventDto);

      expect(result).toEqual(expectedEvent);
      expect(eventsService.create).toHaveBeenCalledWith(
        'test-user-id',
        eventDto
      );
    });
  });

  describe('getEvents', () => {
    it('should return tracking events for user', async () => {
      const req = { user: { userId: 'test-user-id' } };
      const expectedEvents = [
        {
          id: '1',
          userId: 'test-user-id',
          eventName: 'PageView',
          eventType: 'standard',
          platform: TrackingPlatform.GA4,
          data: { url: '/property/123' },
          createdAt: new Date(),
        },
        {
          id: '2',
          userId: 'test-user-id',
          eventName: 'Lead',
          eventType: 'standard',
          platform: TrackingPlatform.FACEBOOK,
          data: { leadType: 'contact_form' },
          createdAt: new Date(),
        },
      ];

      mockEventsService.findAll.mockResolvedValue(expectedEvents);

      const result = await controller.getEvents(req);

      expect(result).toEqual(expectedEvents);
      expect(result).toHaveLength(2);
      expect(eventsService.findAll).toHaveBeenCalledWith('test-user-id');
    });
  });

  describe('getEventsStats', () => {
    it('should return tracking events statistics', async () => {
      const req = { user: { userId: 'test-user-id' } };
      const expectedStats = {
        totalEvents: 150,
        eventsByPlatform: {
          [TrackingPlatform.FACEBOOK]: 50,
          [TrackingPlatform.GA4]: 70,
          [TrackingPlatform.GTM]: 30,
        },
        eventsByType: {
          PageView: 80,
          Lead: 40,
          Contact: 30,
        },
        conversionRate: 26.67,
        avgLeadScore: 75.5,
        topEvents: [
          { eventName: 'PageView', count: 80, conversionRate: 20 },
          { eventName: 'Lead', count: 40, conversionRate: 50 },
        ],
        recentEvents: [],
      };

      mockEventsService.getStats.mockResolvedValue(expectedStats);

      const result = await controller.getEventsStats(req);

      expect(result).toEqual(expectedStats);
      expect(result.totalEvents).toBe(150);
      expect(result.conversionRate).toBe(26.67);
      expect(eventsService.getStats).toHaveBeenCalledWith('test-user-id');
    });
  });

  describe('Validation', () => {
    it('should validate CreateTrackingConfigDto', async () => {
      const req = { user: { userId: 'test-user-id' } };

      // Valid DTO
      const validDto: CreateTrackingConfigDto = {
        platform: TrackingPlatform.FACEBOOK,
        config: { pixelId: '123456789012345' },
        isActive: true,
      };

      expect(validDto.platform).toBe(TrackingPlatform.FACEBOOK);
      expect(validDto.isActive).toBe(true);
    });

    it('should reject invalid platform enum', () => {
      const invalidPlatform = 'invalid_platform';

      expect(Object.values(TrackingPlatform)).not.toContain(invalidPlatform);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const req = { user: { userId: 'test-user-id' } };
      const createDto: CreateTrackingConfigDto = {
        platform: TrackingPlatform.FACEBOOK,
        config: { pixelId: '123456789012345' },
        isActive: true,
      };

      mockConfigService.create.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(controller.createConfig(req, createDto)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle missing user context', async () => {
      const req = { user: null };

      await expect(controller.getAllConfigs(req as any)).rejects.toThrow();
    });
  });
});
