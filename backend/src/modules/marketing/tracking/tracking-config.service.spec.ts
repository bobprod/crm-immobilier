import { Test, TestingModule } from '@nestjs/testing';
import { TrackingConfigService } from './services/tracking-config.service';
import { PrismaService } from '../../shared/database/prisma.service';
import { ConfigService } from '@nestjs/config';
import {
  TrackingPlatform,
  CreateTrackingConfigDto,
  MetaPixelConfig,
  GTMConfig,
} from './dto/tracking.dto';

describe('TrackingConfigService', () => {
  let service: TrackingConfigService;
  let prismaService: PrismaService;
  let configService: ConfigService;

  const mockPrismaService = {
    trackingConfig: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingConfigService,
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

    service = module.get<TrackingConfigService>(TrackingConfigService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a Meta Pixel configuration', async () => {
      const userId = 'test-user-id';
      const metaConfig: MetaPixelConfig = {
        pixelId: '123456789012345',
        accessToken: 'EAAtest',
        testEventCode: 'TEST12345',
      };

      const createDto: CreateTrackingConfigDto = {
        platform: TrackingPlatform.FACEBOOK,
        config: metaConfig,
        isActive: true,
        useServerSide: true,
      };

      const expectedResult = {
        id: '1',
        userId,
        platform: TrackingPlatform.FACEBOOK,
        config: metaConfig,
        isActive: true,
        useServerSide: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.trackingConfig.upsert.mockResolvedValue(expectedResult);

      const result = await service.create(userId, createDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.trackingConfig.upsert).toHaveBeenCalledWith({
        where: {
          userId_platform: {
            userId,
            platform: TrackingPlatform.FACEBOOK,
          },
        },
        create: {
          userId,
          platform: TrackingPlatform.FACEBOOK,
          config: metaConfig,
          isActive: true,
          useServerSide: true,
        },
        update: {
          config: metaConfig,
          isActive: true,
          useServerSide: true,
        },
      });
    });

    it('should create a Google Tag Manager configuration', async () => {
      const userId = 'test-user-id';
      const gtmConfig: GTMConfig = {
        containerId: 'GTM-XXXXXXX',
        serverContainerUrl: 'https://gtm-server.example.com',
      };

      const createDto: CreateTrackingConfigDto = {
        platform: TrackingPlatform.GTM,
        config: gtmConfig,
        isActive: true,
      };

      const expectedResult = {
        id: '2',
        userId,
        platform: TrackingPlatform.GTM,
        config: gtmConfig,
        isActive: true,
        useServerSide: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.trackingConfig.upsert.mockResolvedValue(expectedResult);

      const result = await service.create(userId, createDto);

      expect(result).toEqual(expectedResult);
      expect(result.platform).toBe(TrackingPlatform.GTM);
    });
  });

  describe('findAll', () => {
    it('should return all tracking configurations for a user', async () => {
      const userId = 'test-user-id';
      const expectedConfigs = [
        {
          id: '1',
          userId,
          platform: TrackingPlatform.FACEBOOK,
          config: { pixelId: '123456789012345' },
          isActive: true,
          useServerSide: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          userId,
          platform: TrackingPlatform.GTM,
          config: { containerId: 'GTM-XXXXXXX' },
          isActive: true,
          useServerSide: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.trackingConfig.findMany.mockResolvedValue(expectedConfigs);

      const result = await service.findAll(userId);

      expect(result).toEqual(expectedConfigs);
      expect(result).toHaveLength(2);
      expect(mockPrismaService.trackingConfig.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should return empty array when no configurations exist', async () => {
      const userId = 'test-user-id';

      mockPrismaService.trackingConfig.findMany.mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a specific tracking configuration', async () => {
      const userId = 'test-user-id';
      const platform = TrackingPlatform.FACEBOOK;

      const expectedConfig = {
        id: '1',
        userId,
        platform,
        config: { pixelId: '123456789012345' },
        isActive: true,
        useServerSide: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.trackingConfig.findUnique.mockResolvedValue(expectedConfig);

      const result = await service.findOne(userId, platform);

      expect(result).toEqual(expectedConfig);
      expect(mockPrismaService.trackingConfig.findUnique).toHaveBeenCalledWith({
        where: {
          userId_platform: {
            userId,
            platform,
          },
        },
      });
    });

    it('should return null when configuration does not exist', async () => {
      const userId = 'test-user-id';
      const platform = TrackingPlatform.TIKTOK;

      mockPrismaService.trackingConfig.findUnique.mockResolvedValue(null);

      const result = await service.findOne(userId, platform);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an existing tracking configuration', async () => {
      const userId = 'test-user-id';
      const platform = TrackingPlatform.FACEBOOK;
      const updateData = {
        config: { pixelId: '999999999999999' },
        isActive: false,
      };

      const updatedConfig = {
        id: '1',
        userId,
        platform,
        ...updateData,
        useServerSide: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.trackingConfig.update.mockResolvedValue(updatedConfig);

      const result = await service.update(userId, platform, updateData);

      expect(result).toEqual(updatedConfig);
      expect(result.isActive).toBe(false);
      expect(mockPrismaService.trackingConfig.update).toHaveBeenCalledWith({
        where: {
          userId_platform: {
            userId,
            platform,
          },
        },
        data: updateData,
      });
    });
  });

  describe('delete', () => {
    it('should delete a tracking configuration', async () => {
      const userId = 'test-user-id';
      const platform = TrackingPlatform.LINKEDIN;

      const deletedConfig = {
        id: '1',
        userId,
        platform,
        config: { partnerId: '123456' },
        isActive: true,
        useServerSide: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.trackingConfig.delete.mockResolvedValue(deletedConfig);

      const result = await service.delete(userId, platform);

      expect(result).toEqual(deletedConfig);
      expect(mockPrismaService.trackingConfig.delete).toHaveBeenCalledWith({
        where: {
          userId_platform: {
            userId,
            platform,
          },
        },
      });
    });
  });

  describe('testConnection', () => {
    it('should validate Meta Pixel configuration', async () => {
      const platform = TrackingPlatform.FACEBOOK;
      const config: MetaPixelConfig = {
        pixelId: '123456789012345',
        accessToken: 'EAAtest',
      };

      const result = await service.testConnection(platform, config);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(typeof result.success).toBe('boolean');
    });

    it('should validate GTM configuration', async () => {
      const platform = TrackingPlatform.GTM;
      const config: GTMConfig = {
        containerId: 'GTM-XXXXXXX',
      };

      const result = await service.testConnection(platform, config);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
    });

    it('should return error for invalid pixel ID format', async () => {
      const platform = TrackingPlatform.FACEBOOK;
      const config: MetaPixelConfig = {
        pixelId: 'invalid', // Invalid format
      };

      const result = await service.testConnection(platform, config);

      expect(result.success).toBe(false);
      expect(result.message).toContain('invalid');
    });
  });

  describe('getActiveConfigs', () => {
    it('should return only active configurations', async () => {
      const userId = 'test-user-id';
      const configs = [
        {
          id: '1',
          userId,
          platform: TrackingPlatform.FACEBOOK,
          config: { pixelId: '123456789012345' },
          isActive: true,
          useServerSide: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          userId,
          platform: TrackingPlatform.GTM,
          config: { containerId: 'GTM-XXXXXXX' },
          isActive: false,
          useServerSide: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.trackingConfig.findMany.mockResolvedValue(
        configs.filter((c) => c.isActive)
      );

      const result = await service.getActiveConfigs(userId);

      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
      expect(mockPrismaService.trackingConfig.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          isActive: true,
        },
      });
    });
  });

  describe('getPlatformConfig', () => {
    it('should return platform-specific configuration from env', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const configs = {
          'tracking.meta.pixelId': '123456789012345',
          'tracking.meta.conversionApiToken': 'EAAtest',
          'tracking.gtm.containerId': 'GTM-XXXXXXX',
        };
        return configs[key];
      });

      const metaConfig = await service.getPlatformConfig(TrackingPlatform.FACEBOOK);
      expect(metaConfig).toHaveProperty('pixelId');

      const gtmConfig = await service.getPlatformConfig(TrackingPlatform.GTM);
      expect(gtmConfig).toHaveProperty('containerId');
    });
  });
});
