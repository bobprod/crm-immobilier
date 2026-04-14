import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { ApifyService } from './apify.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ApifyService', () => {
  let service: ApifyService;
  let configService: jest.Mocked<ConfigService>;

  const mockApiKey = 'apify_api_test123';
  const mockUserId = 'user-123';

  beforeEach(async () => {
    const mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'APIFY_API_KEY') return mockApiKey;
        if (key === `APIFY_API_KEY_${mockUserId}`) return `user_${mockApiKey}`;
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApifyService,
        {
          provide: ConfigService,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<ApifyService>(ApifyService);
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;

    // Suppress logs
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('testApiKey', () => {
    it('should return true when API key is valid', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { data: { username: 'testuser' } },
      });

      const result = await service.testApiKey();

      expect(result).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/users/me'),
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockApiKey}` },
        }),
      );
    });

    it('should return false when API key is invalid', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Unauthorized'));

      const result = await service.testApiKey();

      expect(result).toBe(false);
    });

    it('should use tenant-specific API key when provided', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { data: { username: 'testuser' } },
      });

      await service.testApiKey(undefined, mockUserId);

      expect(configService.get).toHaveBeenCalledWith(`APIFY_API_KEY_${mockUserId}`);
    });

    it('should return false when no API key is configured', async () => {
      configService.get.mockReturnValue(null);

      const result = await service.testApiKey();

      expect(result).toBe(false);
    });
  });

  describe('runActor', () => {
    const mockActorId = 'apify/test-actor';
    const mockInput = { test: 'data' };
    const mockRunId = 'run-123';

    it('should successfully run actor and return results', async () => {
      const mockResults = [{ result: 'data1' }, { result: 'data2' }];

      // Mock run creation
      mockedAxios.post.mockResolvedValue({
        data: {
          data: {
            id: mockRunId,
            status: 'SUCCEEDED',
          },
        },
      });

      // Mock results fetch
      mockedAxios.get.mockResolvedValue({
        data: mockResults,
      });

      const results = await service.runActor(mockActorId, mockInput);

      expect(results).toEqual(mockResults);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining(`/acts/${mockActorId}/runs`),
        mockInput,
        expect.any(Object),
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/acts/${mockActorId}/runs/${mockRunId}/dataset/items`),
        expect.any(Object),
      );
    });

    it('should throw error when run fails', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          data: {
            id: mockRunId,
            status: 'FAILED',
          },
        },
      });

      await expect(service.runActor(mockActorId, mockInput)).rejects.toThrow(
        'Scraping échoué avec le status: FAILED',
      );
    });

    it('should throw error when API key is not configured', async () => {
      configService.get.mockReturnValue(null);

      await expect(service.runActor(mockActorId, mockInput)).rejects.toThrow(
        'Clé API Apify non configurée',
      );
    });
  });

  describe('scrapeZillow', () => {
    it('should scrape Zillow with correct parameters', async () => {
      const mockResults = [{ address: '123 Main St', price: '$500,000' }];

      mockedAxios.post.mockResolvedValue({
        data: { data: { id: 'run-123', status: 'SUCCEEDED' } },
      });

      mockedAxios.get.mockResolvedValue({
        data: mockResults,
      });

      const results = await service.scrapeZillow({
        location: 'San Francisco, CA',
        maxItems: 50,
        listingType: 'for_sale',
      });

      expect(results).toEqual(mockResults);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/acts/apify/zillow-scraper/runs'),
        expect.objectContaining({
          startUrls: expect.arrayContaining([
            expect.objectContaining({ url: expect.stringContaining('zillow.com') }),
          ]),
          maxItems: 50,
        }),
        expect.any(Object),
      );
    });

    it('should use default maxItems when not provided', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { data: { id: 'run-123', status: 'SUCCEEDED' } },
      });

      mockedAxios.get.mockResolvedValue({ data: [] });

      await service.scrapeZillow({ location: 'New York' });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ maxItems: 100 }),
        expect.any(Object),
      );
    });
  });

  describe('scrapeGoogleMaps', () => {
    it('should scrape Google Maps with correct parameters', async () => {
      const mockAgents = [
        { name: 'Agent 1', phone: '+123456789' },
        { name: 'Agent 2', phone: '+987654321' },
      ];

      mockedAxios.post.mockResolvedValue({
        data: { data: { id: 'run-123', status: 'SUCCEEDED' } },
      });

      mockedAxios.get.mockResolvedValue({
        data: mockAgents,
      });

      const results = await service.scrapeGoogleMaps({
        searchQuery: 'real estate agent Paris',
        maxItems: 50,
      });

      expect(results).toEqual(mockAgents);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/acts/compass/crawler-google-places/runs'),
        expect.objectContaining({
          searchStringsArray: ['real estate agent Paris'],
          maxCrawledPlacesPerSearch: 50,
          language: 'fr',
        }),
        expect.any(Object),
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle network timeout', async () => {
      mockedAxios.post.mockRejectedValue(new Error('ECONNABORTED'));

      await expect(
        service.runActor('test/actor', { test: 'data' }),
      ).rejects.toThrow();
    });

    it('should handle invalid actor ID', async () => {
      mockedAxios.post.mockRejectedValue({
        response: { status: 404, data: { error: 'Actor not found' } },
      });

      await expect(
        service.runActor('invalid/actor', { test: 'data' }),
      ).rejects.toThrow();
    });

    it('should handle API rate limit', async () => {
      mockedAxios.post.mockRejectedValue({
        response: { status: 429, data: { error: 'Rate limit exceeded' } },
      });

      await expect(
        service.runActor('test/actor', { test: 'data' }),
      ).rejects.toThrow();
    });
  });
});
