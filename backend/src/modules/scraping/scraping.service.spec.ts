import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScrapingService } from './scraping.service';
import { PrismaService } from '../../shared/database/prisma.service';
import { UpdateScrapingConfigDto } from './dto';

describe('ScrapingService', () => {
    let service: ScrapingService;
    let prismaService: jest.Mocked<PrismaService>;
    let configService: jest.Mocked<ConfigService>;

    const mockUserId = 'user-123';

    const mockScrapingConfig = {
        pica: { enabled: true, apiKey: 'pica-key-123', rateLimit: 100 },
        serpApi: { enabled: true, apiKey: 'serp-key-456', rateLimit: 100 },
        scrapingBee: { enabled: false, apiKey: '', rateLimit: 50 },
        browserless: { enabled: true, apiKey: 'browserless-key-789', endpoint: 'https://chrome.browserless.io' },
    };

    beforeEach(async () => {
        const mockPrisma = {
            settings: {
                findFirst: jest.fn(),
                upsert: jest.fn(),
            },
        };

        const mockConfig = {
            get: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ScrapingService,
                {
                    provide: PrismaService,
                    useValue: mockPrisma,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfig,
                },
            ],
        }).compile();

        service = module.get<ScrapingService>(ScrapingService);
        prismaService = module.get(PrismaService) as jest.Mocked<PrismaService>;
        configService = module.get(ConfigService) as jest.Mocked<ConfigService>;

        // Suppress logs during tests
        jest.spyOn(Logger.prototype, 'log').mockImplementation();
        jest.spyOn(Logger.prototype, 'error').mockImplementation();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getScrapingConfig', () => {
        it('should return scraping configuration from database when it exists', async () => {
            prismaService.settings.findFirst.mockResolvedValue({
                id: 1,
                userId: mockUserId,
                key: 'scraping_config',
                value: mockScrapingConfig,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

            const result = await service.getScrapingConfig(mockUserId);

            expect(result).toEqual(mockScrapingConfig);
            expect(prismaService.settings.findFirst).toHaveBeenCalledWith({
                where: {
                    userId: mockUserId,
                    key: 'scraping_config',
                },
            });
        });

        it('should return default configuration when no config exists in database', async () => {
            prismaService.settings.findFirst.mockResolvedValue(null);

            const result = await service.getScrapingConfig(mockUserId);

            expect(result).toEqual({
                pica: { enabled: false, apiKey: '', rateLimit: 100 },
                serpApi: { enabled: false, apiKey: '', rateLimit: 100 },
                scrapingBee: { enabled: false, apiKey: '', rateLimit: 50 },
                browserless: { enabled: false, apiKey: '', endpoint: 'https://chrome.browserless.io' },
            });
        });

        it('should handle database errors gracefully', async () => {
            prismaService.settings.findFirst.mockRejectedValue(new Error('Database connection error'));

            await expect(service.getScrapingConfig(mockUserId)).rejects.toThrow('Database connection error');
        });

        it('should return config.value when settings exists but value is null', async () => {
            prismaService.settings.findFirst.mockResolvedValue({
                id: 1,
                userId: mockUserId,
                key: 'scraping_config',
                value: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

            const result = await service.getScrapingConfig(mockUserId);

            // Should return default config
            expect(result.pica.enabled).toBe(false);
            expect(result.serpApi.enabled).toBe(false);
        });
    });

    describe('updateScrapingConfig', () => {
        const updateDto: UpdateScrapingConfigDto = {
            pica: { enabled: true, apiKey: 'new-pica-key', rateLimit: 200 },
            serpApi: { enabled: true, apiKey: 'new-serp-key', rateLimit: 150 },
        };

        it('should create new configuration when it does not exist', async () => {
            const mockCreatedConfig = {
                id: 1,
                userId: mockUserId,
                key: 'scraping_config',
                value: updateDto,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            prismaService.settings.upsert.mockResolvedValue(mockCreatedConfig as any);

            const result = await service.updateScrapingConfig(mockUserId, updateDto);

            expect(result).toEqual(mockCreatedConfig);
            expect(prismaService.settings.upsert).toHaveBeenCalledWith({
                where: {
                    userId_key: {
                        userId: mockUserId,
                        key: 'scraping_config',
                    },
                },
                update: {
                    value: updateDto,
                },
                create: {
                    userId: mockUserId,
                    key: 'scraping_config',
                    value: updateDto,
                },
            });
        });

        it('should update existing configuration', async () => {
            const mockUpdatedConfig = {
                id: 1,
                userId: mockUserId,
                key: 'scraping_config',
                value: updateDto,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            prismaService.settings.upsert.mockResolvedValue(mockUpdatedConfig as any);

            const result = await service.updateScrapingConfig(mockUserId, updateDto);

            expect(result).toEqual(mockUpdatedConfig);
            expect(result.value).toEqual(updateDto);
        });

        it('should handle update errors gracefully', async () => {
            prismaService.settings.upsert.mockRejectedValue(new Error('Upsert failed'));

            await expect(service.updateScrapingConfig(mockUserId, updateDto)).rejects.toThrow('Upsert failed');
        });

        it('should allow partial configuration updates', async () => {
            const partialUpdate = {
                pica: { enabled: true, apiKey: 'only-pica-updated', rateLimit: 50 },
            };

            prismaService.settings.upsert.mockResolvedValue({
                id: 1,
                userId: mockUserId,
                key: 'scraping_config',
                value: partialUpdate,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

            const result = await service.updateScrapingConfig(mockUserId, partialUpdate as any);

            expect(result.value.pica.apiKey).toBe('only-pica-updated');
        });
    });

    describe('testProvider', () => {
        it('should return success when provider is configured correctly', async () => {
            prismaService.settings.findFirst.mockResolvedValue({
                id: 1,
                userId: mockUserId,
                key: 'scraping_config',
                value: mockScrapingConfig,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

            const result = await service.testProvider(mockUserId, 'pica');

            expect(result.success).toBe(true);
            expect(result.message).toContain('Provider pica is configured');
            expect(result.warning).toBeDefined();
        });

        it('should return failure when provider is not enabled', async () => {
            const disabledConfig = {
                ...mockScrapingConfig,
                scrapingBee: { enabled: false, apiKey: 'key-123', rateLimit: 50 },
            };

            prismaService.settings.findFirst.mockResolvedValue({
                id: 1,
                userId: mockUserId,
                key: 'scraping_config',
                value: disabledConfig,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

            const result = await service.testProvider(mockUserId, 'scrapingBee');

            expect(result.success).toBe(false);
            expect(result.message).toContain('not configured or not enabled');
        });

        it('should return failure when API key is missing', async () => {
            const noApiKeyConfig = {
                ...mockScrapingConfig,
                serpApi: { enabled: true, apiKey: '', rateLimit: 100 },
            };

            prismaService.settings.findFirst.mockResolvedValue({
                id: 1,
                userId: mockUserId,
                key: 'scraping_config',
                value: noApiKeyConfig,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

            const result = await service.testProvider(mockUserId, 'serpApi');

            expect(result.success).toBe(false);
            expect(result.message).toContain('API key is missing');
        });

        it('should return failure when provider does not exist in config', async () => {
            prismaService.settings.findFirst.mockResolvedValue({
                id: 1,
                userId: mockUserId,
                key: 'scraping_config',
                value: mockScrapingConfig,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

            const result = await service.testProvider(mockUserId, 'nonExistentProvider');

            expect(result.success).toBe(false);
        });

        it('should handle errors during provider test gracefully', async () => {
            prismaService.settings.findFirst.mockRejectedValue(new Error('Database error'));

            const result = await service.testProvider(mockUserId, 'pica');

            expect(result.success).toBe(false);
            expect(result.message).toContain('Database error');
        });

        it('should test browserless provider with custom endpoint', async () => {
            prismaService.settings.findFirst.mockResolvedValue({
                id: 1,
                userId: mockUserId,
                key: 'scraping_config',
                value: mockScrapingConfig,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

            const result = await service.testProvider(mockUserId, 'browserless');

            expect(result.success).toBe(true);
            expect(result.message).toContain('Provider browserless is configured');
        });
    });

    describe('Provider Configuration Edge Cases', () => {
        it('should handle empty configuration gracefully', async () => {
            prismaService.settings.findFirst.mockResolvedValue({
                id: 1,
                userId: mockUserId,
                key: 'scraping_config',
                value: {},
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

            const result = await service.getScrapingConfig(mockUserId);

            expect(result).toBeDefined();
        });

        it('should handle malformed configuration data', async () => {
            prismaService.settings.findFirst.mockResolvedValue({
                id: 1,
                userId: mockUserId,
                key: 'scraping_config',
                value: { invalid: 'data' },
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

            const result = await service.getScrapingConfig(mockUserId);

            expect(result).toBeDefined();
        });

        it('should handle multiple providers enabled simultaneously', async () => {
            const allEnabledConfig = {
                pica: { enabled: true, apiKey: 'pica-key', rateLimit: 100 },
                serpApi: { enabled: true, apiKey: 'serp-key', rateLimit: 100 },
                scrapingBee: { enabled: true, apiKey: 'bee-key', rateLimit: 50 },
                browserless: { enabled: true, apiKey: 'browser-key', endpoint: 'https://example.com' },
            };

            prismaService.settings.findFirst.mockResolvedValue({
                id: 1,
                userId: mockUserId,
                key: 'scraping_config',
                value: allEnabledConfig,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

            const result = await service.getScrapingConfig(mockUserId);

            expect(result.pica.enabled).toBe(true);
            expect(result.serpApi.enabled).toBe(true);
            expect(result.scrapingBee.enabled).toBe(true);
            expect(result.browserless.enabled).toBe(true);
        });
    });
});
