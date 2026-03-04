import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ValidationService } from './validation.service';
import { PrismaService } from '../../../shared/database/prisma.service';

describe('ValidationService', () => {
    let service: ValidationService;
    let prismaService: jest.Mocked<PrismaService>;

    const mockUserId = 'user-123';
    const mockProspectId = 'prospect-456';

    beforeEach(async () => {
        // Mock PrismaService
        const mockPrisma = {
            disposable_domains: {
                findMany: jest.fn().mockResolvedValue([
                    { domain: 'tempmail.com', isActive: true },
                    { domain: 'guerrillamail.com', isActive: true },
                ]),
            },
            validation_history: {
                create: jest.fn(),
                findMany: jest.fn(),
            },
            blacklist: {
                findFirst: jest.fn(),
            },
            whitelist: {
                findFirst: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ValidationService,
                {
                    provide: PrismaService,
                    useValue: mockPrisma,
                },
            ],
        }).compile();

        service = module.get<ValidationService>(ValidationService);
        prismaService = module.get(PrismaService) as jest.Mocked<PrismaService>;

        // Suppress logs during tests
        jest.spyOn(Logger.prototype, 'log').mockImplementation();
        jest.spyOn(Logger.prototype, 'error').mockImplementation();
        jest.spyOn(Logger.prototype, 'warn').mockImplementation();

        // Wait for disposable domains to load
        await new Promise(resolve => setTimeout(resolve, 100));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Email Validation - Syntax', () => {
        it('should validate correct email format', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue(null);
            prismaService.whitelist.findFirst.mockResolvedValue(null);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            const result = await service.validateEmail(mockUserId, 'john.doe@example.com');

            expect(result.email).toBe('john.doe@example.com');
            expect(result.score).toBeGreaterThan(0);
            expect(result.metadata.domain).toBe('example.com');
        });

        it('should reject invalid email format - no @', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue(null);
            prismaService.whitelist.findFirst.mockResolvedValue(null);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            const result = await service.validateEmail(mockUserId, 'invalidemail.com');

            expect(result.isValid).toBe(false);
            expect(result.reason).toContain('Format email invalide');
            expect(result.score).toBe(0);
        });

        it('should reject invalid email format - multiple @', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue(null);
            prismaService.whitelist.findFirst.mockResolvedValue(null);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            const result = await service.validateEmail(mockUserId, 'invalid@@example.com');

            expect(result.isValid).toBe(false);
            expect(result.reason).toContain('Format email invalide');
        });

        it('should reject email with spaces', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue(null);
            prismaService.whitelist.findFirst.mockResolvedValue(null);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            const result = await service.validateEmail(mockUserId, 'john doe@example.com');

            expect(result.isValid).toBe(false);
        });
    });

    describe('Email Validation - Disposable Domains', () => {
        it('should reject disposable email addresses', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue(null);
            prismaService.whitelist.findFirst.mockResolvedValue(null);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            const result = await service.validateEmail(mockUserId, 'test@tempmail.com');

            expect(result.isDisposable).toBe(true);
            expect(result.isSpam).toBe(true);
            expect(result.reason).toContain('jetable');
        });

        it('should accept non-disposable email addresses', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue(null);
            prismaService.whitelist.findFirst.mockResolvedValue(null);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            const result = await service.validateEmail(mockUserId, 'contact@gmail.com');

            expect(result.isDisposable).toBe(false);
        });

        it('should handle case-insensitive disposable domain check', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue(null);
            prismaService.whitelist.findFirst.mockResolvedValue(null);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            const result = await service.validateEmail(mockUserId, 'test@TempMail.COM');

            expect(result.isDisposable).toBe(true);
            expect(result.isSpam).toBe(true);
        });
    });

    describe('Email Validation - Spam Detection', () => {
        it('should detect spam keyword "test"', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue(null);
            prismaService.whitelist.findFirst.mockResolvedValue(null);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            const result = await service.validateEmail(mockUserId, 'test@example.com');

            expect(result.isSpam).toBe(true);
            expect(result.reason).toContain('spam');
        });

        it('should detect spam keyword "noreply"', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue(null);
            prismaService.whitelist.findFirst.mockResolvedValue(null);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            const result = await service.validateEmail(mockUserId, 'noreply@example.com');

            expect(result.isSpam).toBe(true);
        });

        it('should detect spam keyword "info@"', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue(null);
            prismaService.whitelist.findFirst.mockResolvedValue(null);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            const result = await service.validateEmail(mockUserId, 'info@example.com');

            expect(result.isSpam).toBe(true);
        });

        it('should accept legitimate emails without spam keywords', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue(null);
            prismaService.whitelist.findFirst.mockResolvedValue(null);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            const result = await service.validateEmail(mockUserId, 'john.doe@gmail.com');

            expect(result.isSpam).toBe(false);
        });
    });

    describe('Email Validation - Blacklist/Whitelist', () => {
        it('should reject blacklisted email', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue({
                id: 1,
                type: 'email',
                value: 'blacklisted@example.com',
            } as any);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            const result = await service.validateEmail(mockUserId, 'blacklisted@example.com');

            expect(result.isSpam).toBe(true);
            expect(result.reason).toContain('blacklisté');
        });

        it('should accept whitelisted email with perfect score', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue(null);
            prismaService.whitelist.findFirst.mockResolvedValue({
                id: 1,
                type: 'email',
                value: 'whitelisted@example.com',
            } as any);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            const result = await service.validateEmail(mockUserId, 'whitelisted@example.com');

            expect(result.isValid).toBe(true);
            expect(result.score).toBe(100);
            expect(result.validationMethod).toBe('whitelist');
        });
    });

    describe('Email Validation - Provider Detection', () => {
        it('should detect Gmail provider', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue(null);
            prismaService.whitelist.findFirst.mockResolvedValue(null);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            const result = await service.validateEmail(mockUserId, 'user@gmail.com');

            expect(result.provider).toBe('Gmail');
        });

        it('should detect Outlook provider', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue(null);
            prismaService.whitelist.findFirst.mockResolvedValue(null);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            const result = await service.validateEmail(mockUserId, 'user@outlook.com');

            expect(result.provider).toBe('Outlook');
        });

        it('should detect Yahoo provider', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue(null);
            prismaService.whitelist.findFirst.mockResolvedValue(null);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            const result = await service.validateEmail(mockUserId, 'user@yahoo.fr');

            expect(result.provider).toBe('Yahoo');
        });

        it('should handle unknown provider', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue(null);
            prismaService.whitelist.findFirst.mockResolvedValue(null);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            const result = await service.validateEmail(mockUserId, 'user@unknown-domain-xyz.com');

            expect(result.provider).toBeNull();
        });
    });

    describe('Phone Validation', () => {
        it('should validate Tunisian phone number (+216 format)', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue(null);
            prismaService.whitelist.findFirst.mockResolvedValue(null);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            const result = await service.validatePhone(mockUserId, '+21612345678');

            expect(result.isValid).toBe(true);
            expect(result.metadata.country).toBe('TN');
        });

        it('should validate French phone number (+33 format)', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue(null);
            prismaService.whitelist.findFirst.mockResolvedValue(null);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            const result = await service.validatePhone(mockUserId, '+33612345678');

            expect(result.isValid).toBe(true);
            expect(result.metadata.country).toBe('FR');
        });

        it('should normalize Tunisian phone without country code', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue(null);
            prismaService.whitelist.findFirst.mockResolvedValue(null);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            const result = await service.validatePhone(mockUserId, '12345678');

            expect(result.metadata.normalized).toContain('+216');
        });

        it('should reject invalid phone number format', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue(null);
            prismaService.whitelist.findFirst.mockResolvedValue(null);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            const result = await service.validatePhone(mockUserId, 'abc123');

            expect(result.isValid).toBe(false);
        });

        it('should detect blacklisted phone number', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue({
                id: 1,
                type: 'phone',
                value: '+21612345678',
            } as any);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            const result = await service.validatePhone(mockUserId, '+21612345678');

            expect(result.isSpam).toBe(true);
            expect(result.reason).toContain('blacklisté');
        });
    });

    describe('Spam Detection', () => {
        it('should detect spam in text with multiple spam keywords', async () => {
            const spamText = 'URGENT! Buy now! Click here for FREE money! Limited offer!';

            const result = await service.detectSpam(spamText);

            expect(result.isSpam).toBe(true);
            expect(result.score).toBeGreaterThan(70);
            expect(result.matchedKeywords.length).toBeGreaterThan(2);
        });

        it('should not flag legitimate text as spam', async () => {
            const legitimateText = 'Hello, I am interested in renting your apartment. Can we schedule a visit?';

            const result = await service.detectSpam(legitimateText);

            expect(result.isSpam).toBe(false);
            expect(result.score).toBeLessThan(50);
        });

        it('should detect spam with excessive capitalization', async () => {
            const spamText = 'BUY NOW!!! AMAZING DEAL!!!';

            const result = await service.detectSpam(spamText);

            expect(result.isSpam).toBe(true);
        });

        it('should handle empty text gracefully', async () => {
            const result = await service.detectSpam('');

            expect(result.isSpam).toBe(false);
            expect(result.score).toBe(0);
        });
    });

    describe('Edge Cases', () => {
        it('should handle null email gracefully', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue(null);
            prismaService.whitelist.findFirst.mockResolvedValue(null);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            const result = await service.validateEmail(mockUserId, null as any);

            expect(result.isValid).toBe(false);
        });

        it('should handle empty string email', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue(null);
            prismaService.whitelist.findFirst.mockResolvedValue(null);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            const result = await service.validateEmail(mockUserId, '');

            expect(result.isValid).toBe(false);
        });

        it('should handle very long email addresses', async () => {
            const longEmail = 'a'.repeat(300) + '@example.com';
            prismaService.blacklist.findFirst.mockResolvedValue(null);
            prismaService.whitelist.findFirst.mockResolvedValue(null);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            const result = await service.validateEmail(mockUserId, longEmail);

            expect(result.isValid).toBe(false);
        });

        it('should handle special characters in email', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue(null);
            prismaService.whitelist.findFirst.mockResolvedValue(null);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            const result = await service.validateEmail(mockUserId, 'user+tag@example.com');

            // + is valid in email addresses
            expect(result.score).toBeGreaterThan(0);
        });
    });

    describe('Validation History', () => {
        it('should save validation history to database', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue(null);
            prismaService.whitelist.findFirst.mockResolvedValue(null);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            await service.validateEmail(mockUserId, 'test@example.com', mockProspectId);

            expect(prismaService.validation_history.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: mockUserId,
                    type: 'email',
                    value: 'test@example.com',
                    prospectId: mockProspectId,
                }),
            });
        });

        it('should save validation history without prospectId', async () => {
            prismaService.blacklist.findFirst.mockResolvedValue(null);
            prismaService.whitelist.findFirst.mockResolvedValue(null);
            prismaService.validation_history.create.mockResolvedValue({} as any);

            await service.validateEmail(mockUserId, 'test@example.com');

            expect(prismaService.validation_history.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: mockUserId,
                    type: 'email',
                    value: 'test@example.com',
                }),
            });
        });
    });
});
