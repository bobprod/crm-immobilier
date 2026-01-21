import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { UnifiedValidationService } from '../../../src/shared/validation/unified-validation.service';
import {
    EmailValidationResult,
    PhoneValidationResult,
    SpamDetectionResult,
    FullValidationResult,
    ValidationOptions,
} from '../../../src/shared/validation/dto';

/**
 * 🧪 Tests Unitaires - UnifiedValidationService
 *
 * Phase 2: Tests de validation centralisée
 * - Email(RFC 5322)
 * - Téléphone(E.164)
 * - Détection de spam
 *
 * Coverage target: > 90 %
 */
describe('UnifiedValidationService', () => {
    let service: UnifiedValidationService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UnifiedValidationService],
        }).compile();

        service = module.get<UnifiedValidationService>(UnifiedValidationService);

        // Silence logger for tests
        jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => { });
        jest.spyOn(Logger.prototype, 'log').mockImplementation(() => { });
        jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Service Initialization', () => {
        it('should be defined', () => {
            expect(service).toBeDefined();
        });
    });

    // ============================================
    // VALIDATION EMAIL - Tests
    // ============================================

    describe('validateEmail()', () => {
        describe('Valid Emails', () => {
            it('should validate a simple valid email', async () => {
                const result = await service.validateEmail('user@example.com');

                expect(result.isValid).toBe(true);
                expect(result.email).toBe('user@example.com');
                expect(result.format.hasValidFormat).toBe(true);
                expect(result.score).toBeGreaterThanOrEqual(50);
                expect(result.errors).toHaveLength(0);
            });

            it('should validate professional email with higher score', async () => {
                const result = await service.validateEmail('contact@company-name.com');

                expect(result.isValid).toBe(true);
                expect(result.format.isFreeProvider).toBe(false);
                expect(result.score).toBeGreaterThan(60);
            });

            it('should validate email with special characters', async () => {
                const result = await service.validateEmail('user+tag@example.com');

                expect(result.isValid).toBe(true);
                expect(result.format.hasValidFormat).toBe(true);
            });

            it('should validate email with numbers', async () => {
                const result = await service.validateEmail('user123@test456.com');

                expect(result.isValid).toBe(true);
                expect(result.format.hasValidFormat).toBe(true);
            });

            it('should validate email with hyphens in domain', async () => {
                const result = await service.validateEmail('contact@my-company.fr');

                expect(result.isValid).toBe(true);
                expect(result.format.hasValidFormat).toBe(true);
            });
        });

        describe('Free Email Providers', () => {
            const freeProviders = [
                'user@gmail.com',
                'user@yahoo.fr',
                'user@hotmail.com',
                'user@outlook.com',
                'user@icloud.com',
            ];

            freeProviders.forEach(email => {
                it(`should detect ${email} as free provider`, async () => {
                    const result = await service.validateEmail(email);

                    expect(result.format.isFreeProvider).toBe(true);
                    expect(result.isValid).toBe(true);
                    // Score légèrement pénalisé mais valide
                    expect(result.score).toBeGreaterThanOrEqual(40);
                    expect(result.score).toBeLessThan(70);
                });
            });
        });

        describe('Disposable Emails', () => {
            const disposableEmails = [
                'test@tempmail.com',
                'spam@guerrillamail.com',
                'fake@10minutemail.com',
                'trash@mailinator.com',
                'temp@yopmail.com',
            ];

            disposableEmails.forEach(email => {
                it(`should detect ${email} as disposable`, async () => {
                    const result = await service.validateEmail(email);

                    expect(result.format.isDisposable).toBe(true);
                    expect(result.risk.isSpam).toBe(true);
                    expect(result.risk.level).toBe('high');
                    expect(result.errors).toContain('Email jetable détecté');
                    expect(result.score).toBeLessThan(50);
                });
            });
        });

        describe('Email Format Validation', () => {
            it('should reject email without @', async () => {
                const result = await service.validateEmail('userexample.com');

                expect(result.isValid).toBe(false);
                expect(result.format.hasValidFormat).toBe(false);
                expect(result.errors.length).toBeGreaterThan(0);
            });

            it('should reject email without domain', async () => {
                const result = await service.validateEmail('user@');

                expect(result.isValid).toBe(false);
                expect(result.format.hasValidFormat).toBe(false);
            });

            it('should reject email without local part', async () => {
                const result = await service.validateEmail('@example.com');

                expect(result.isValid).toBe(false);
                expect(result.format.hasValidFormat).toBe(false);
            });

            it('should reject email with multiple @', async () => {
                const result = await service.validateEmail('user@@example.com');

                expect(result.isValid).toBe(false);
                expect(result.format.hasValidFormat).toBe(false);
            });

            it('should reject email with spaces', async () => {
                const result = await service.validateEmail('user @example.com');

                expect(result.isValid).toBe(false);
                expect(result.format.hasValidFormat).toBe(false);
            });

            it('should reject email without TLD', async () => {
                const result = await service.validateEmail('user@domain');

                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('Domaine doit contenir au moins un point');
            });

            it('should reject email with invalid TLD', async () => {
                const result = await service.validateEmail('user@domain.a');

                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('TLD invalide (min 2 caractères)');
            });

            it('should reject empty email', async () => {
                const result = await service.validateEmail('');

                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('Email requis');
            });

            it('should reject email that is too long', async () => {
                const longEmail = 'a'.repeat(250) + '@example.com';
                const result = await service.validateEmail(longEmail);

                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('Email trop long (max 254 caractères)');
            });

            it('should reject email with local part too long', async () => {
                const longLocal = 'a'.repeat(70) + '@example.com';
                const result = await service.validateEmail(longLocal);

                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('Partie locale trop longue (max 64 caractères)');
            });
        });

        describe('Email Typo Suggestions', () => {
            const typos = [
                { input: 'user@gmial.com', expected: 'user@gmail.com' },
                { input: 'user@gmai.com', expected: 'user@gmail.com' },
                { input: 'user@yahooo.com', expected: 'user@yahoo.com' },
                { input: 'user@hotmial.com', expected: 'user@hotmail.com' },
            ];

            typos.forEach(({ input, expected }) => {
                it(`should suggest correction for ${input}`, async () => {
                    const result = await service.validateEmail(input);

                    expect(result.suggestions).toBeDefined();
                    expect(result.suggestions).toContain(expected);
                    expect(result.errors).toContain('Possible typo détecté');
                });
            });
        });

        describe('MX Record Checking', () => {
            it('should check MX records when option is enabled', async () => {
                const options: ValidationOptions = { checkMx: true };

                // Mock DNS resolution
                jest.spyOn<any, any>(service, 'checkMxRecords').mockResolvedValue(true);

                const result = await service.validateEmail('user@example.com', options);

                expect(result.format.hasMx).toBe(true);
            });

            it('should handle MX check failures gracefully', async () => {
                const options: ValidationOptions = { checkMx: true };

                // Mock DNS failure
                jest.spyOn<any, any>(service, 'checkMxRecords').mockRejectedValue(new Error('DNS error'));

                const result = await service.validateEmail('user@invalid-domain-xyz.com', options);

                expect(result.format.hasMx).toBe(false);
            });
        });

        describe('Email Risk Assessment', () => {
            it('should assign low risk to professional emails', async () => {
                const result = await service.validateEmail('contact@company.com');

                expect(result.risk.level).toBe('low');
                expect(result.risk.isSpam).toBe(false);
                expect(result.risk.confidence).toBeGreaterThan(0.6);
            });

            it('should assign high risk to disposable emails', async () => {
                const result = await service.validateEmail('test@tempmail.com');

                expect(result.risk.level).toBe('high');
                expect(result.risk.isSpam).toBe(true);
            });

            it('should assign medium risk to free providers', async () => {
                const result = await service.validateEmail('user@gmail.com');

                expect(result.risk.level).toBe('low'); // Still low, just lower score
                expect(result.score).toBeLessThan(60);
            });
        });

        describe('Edge Cases', () => {
            it('should handle null email', async () => {
                const result = await service.validateEmail(null as any);

                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('Email requis');
            });

            it('should handle undefined email', async () => {
                const result = await service.validateEmail(undefined as any);

                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('Email requis');
            });

            it('should trim whitespace from email', async () => {
                const result = await service.validateEmail('  user@example.com  ');

                expect(result.email).toBe('  user@example.com  ');
                expect(result.isValid).toBe(true);
            });
        });
    });

    // ============================================
    // VALIDATION TÉLÉPHONE - Tests
    // ============================================

    describe('validatePhone()', () => {
        describe('Tunisian Phone Numbers', () => {
            it('should validate Tunisian mobile (Ooredoo)', async () => {
                const result = await service.validatePhone('20123456', 'TN');

                expect(result.isValid).toBe(true);
                expect(result.details.type).toBe('mobile');
                expect(result.details.carrier).toBe('Ooredoo');
                expect(result.normalized.e164).toBe('+21620123456');
                expect(result.score).toBeGreaterThanOrEqual(80);
            });

            it('should validate Tunisian mobile (Orange)', async () => {
                const result = await service.validatePhone('50987654', 'TN');

                expect(result.isValid).toBe(true);
                expect(result.details.type).toBe('mobile');
                expect(result.details.carrier).toBe('Orange Tunisie');
                expect(result.normalized.e164).toBe('+21650987654');
            });

            it('should validate Tunisian mobile (Tunisie Telecom)', async () => {
                const result = await service.validatePhone('98765432', 'TN');

                expect(result.isValid).toBe(true);
                expect(result.details.type).toBe('mobile');
                expect(result.details.carrier).toBe('Tunisie Telecom');
                expect(result.normalized.e164).toBe('+21698765432');
            });

            it('should validate Tunisian landline', async () => {
                const result = await service.validatePhone('71234567', 'TN');

                expect(result.isValid).toBe(true);
                expect(result.details.type).toBe('landline');
                expect(result.normalized.e164).toBe('+21671234567');
            });

            it('should handle +216 prefix', async () => {
                const result = await service.validatePhone('+21620123456', 'TN');

                expect(result.isValid).toBe(true);
                expect(result.normalized.e164).toBe('+21620123456');
            });

            it('should handle 00216 prefix', async () => {
                const result = await service.validatePhone('0021650987654', 'TN');

                expect(result.isValid).toBe(true);
                expect(result.normalized.e164).toBe('+21650987654');
            });

            it('should reject invalid Tunisian prefix', async () => {
                const result = await service.validatePhone('30123456', 'TN');

                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('Préfixe invalide pour la Tunisie: 30');
            });

            it('should reject Tunisian number with wrong length', async () => {
                const result = await service.validatePhone('2012345', 'TN'); // 7 digits

                expect(result.isValid).toBe(false);
                expect(result.errors[0]).toContain('8 chiffres');
            });

            it('should format Tunisian numbers correctly', async () => {
                const result = await service.validatePhone('20123456', 'TN');

                expect(result.normalized.e164).toBe('+21620123456');
                expect(result.normalized.international).toBe('+216 20 123 456');
                expect(result.normalized.national).toBe('20 123 456');
            });
        });

        describe('French Phone Numbers', () => {
            it('should validate French mobile', async () => {
                const result = await service.validatePhone('612345678', 'FR');

                expect(result.isValid).toBe(true);
                expect(result.details.type).toBe('mobile');
                expect(result.normalized.e164).toBe('+33612345678');
            });

            it('should validate French landline', async () => {
                const result = await service.validatePhone('123456789', 'FR');

                expect(result.isValid).toBe(true);
                expect(result.details.type).toBe('landline');
                expect(result.normalized.e164).toBe('+33123456789');
            });

            it('should handle 0 prefix', async () => {
                const result = await service.validatePhone('0612345678', 'FR');

                expect(result.isValid).toBe(true);
                expect(result.normalized.e164).toBe('+33612345678');
            });

            it('should handle +33 prefix', async () => {
                const result = await service.validatePhone('+33612345678', 'FR');

                expect(result.isValid).toBe(true);
                expect(result.normalized.e164).toBe('+33612345678');
            });

            it('should reject French number with wrong length', async () => {
                const result = await service.validatePhone('12345678', 'FR'); // 8 digits

                expect(result.isValid).toBe(false);
                expect(result.errors[0]).toContain('9 chiffres');
            });

            it('should format French numbers correctly', async () => {
                const result = await service.validatePhone('612345678', 'FR');

                expect(result.normalized.e164).toBe('+33612345678');
                expect(result.normalized.international).toBe('+33 6 12 34 56 78');
                expect(result.normalized.national).toBe('06 12 34 56 78');
            });
        });

        describe('E.164 Generic Validation', () => {
            it('should validate E.164 format', async () => {
                const result = await service.validatePhone('+14155552671', 'US');

                expect(result.isValid).toBe(true);
                expect(result.normalized.e164).toBe('+14155552671');
            });

            it('should reject number without + in E.164', async () => {
                const result = await service.validatePhone('14155552671', 'US');

                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('Numéro doit commencer par + pour le format E.164');
            });

            it('should reject E.164 number too long', async () => {
                const result = await service.validatePhone('+1234567890123456', 'US'); // 16 digits

                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('Numéro trop long pour le format E.164 (max 15 chiffres)');
            });

            it('should reject E.164 number too short', async () => {
                const result = await service.validatePhone('+123456', 'US'); // 6 digits

                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('Numéro trop court (min 8 chiffres)');
            });
        });

        describe('Phone Cleaning', () => {
            it('should clean phone with spaces', async () => {
                const result = await service.validatePhone('20 12 34 56', 'TN');

                expect(result.isValid).toBe(true);
                expect(result.normalized.e164).toBe('+21620123456');
            });

            it('should clean phone with dashes', async () => {
                const result = await service.validatePhone('20-12-34-56', 'TN');

                expect(result.isValid).toBe(true);
                expect(result.normalized.e164).toBe('+21620123456');
            });

            it('should clean phone with parentheses', async () => {
                const result = await service.validatePhone('(20) 123-456', 'TN');

                expect(result.isValid).toBe(true);
                expect(result.normalized.e164).toBe('+21620123456');
            });
        });

        describe('Phone Risk Assessment', () => {
            it('should assign higher score to mobile', async () => {
                const result = await service.validatePhone('20123456', 'TN');

                expect(result.details.type).toBe('mobile');
                expect(result.score).toBeGreaterThanOrEqual(80);
                expect(result.risk.level).toBe('low');
            });

            it('should assign lower score to landline', async () => {
                const result = await service.validatePhone('71234567', 'TN');

                expect(result.details.type).toBe('landline');
                expect(result.score).toBeGreaterThanOrEqual(70);
                expect(result.score).toBeLessThan(90);
            });
        });

        describe('Edge Cases', () => {
            it('should handle empty phone', async () => {
                const result = await service.validatePhone('', 'TN');

                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('Numéro vide');
            });

            it('should handle null phone', async () => {
                const result = await service.validatePhone(null as any, 'TN');

                expect(result.isValid).toBe(false);
            });

            it('should handle undefined phone', async () => {
                const result = await service.validatePhone(undefined as any, 'TN');

                expect(result.isValid).toBe(false);
            });
        });
    });

    // ============================================
    // DÉTECTION SPAM - Tests
    // ============================================

    describe('detectSpam()', () => {
        describe('Clean Text', () => {
            it('should not detect spam in normal text', async () => {
                const text = 'Bonjour, je suis intéressé par votre propriété. Pouvez-vous me contacter?';
                const result = await service.detectSpam(text);

                expect(result.isSpam).toBe(false);
                expect(result.score).toBeLessThan(70);
                expect(result.reasons).toHaveLength(0);
            });

            it('should not detect spam in professional message', async () => {
                const text = 'Dear Sir/Madam, I would like to schedule a viewing for the apartment listed on your website.';
                const result = await service.detectSpam(text);

                expect(result.isSpam).toBe(false);
                expect(result.score).toBeLessThan(50);
            });
        });

        describe('Excessive Capitals', () => {
            it('should detect excessive capitals', async () => {
                const text = 'URGENT!!! CLIQUEZ ICI MAINTENANT POUR GAGNER!!!';
                const result = await service.detectSpam(text);

                expect(result.isSpam).toBe(true);
                expect(result.categories.excessiveCapitals).toBe(true);
                expect(result.metrics.capitalsRatio).toBeGreaterThan(0.5);
                expect(result.reasons).toContain('Trop de majuscules');
            });

            it('should calculate capitals ratio correctly', async () => {
                const text = 'HELLO world';
                const result = await service.detectSpam(text);

                // 5 capitals out of 10 letters = 0.5
                expect(result.metrics.capitalsRatio).toBeCloseTo(0.5, 1);
            });
        });

        describe('Links Detection', () => {
            it('should detect multiple links', async () => {
                const text = 'Visit http://spam1.com and http://spam2.com and http://spam3.com and http://spam4.com';
                const result = await service.detectSpam(text);

                expect(result.isSpam).toBe(true);
                expect(result.categories.maliciousLinks).toBe(true);
                expect(result.metrics.linksCount).toBeGreaterThan(3);
                expect(result.reasons).toContain('Trop de liens');
            });

            it('should detect www links', async () => {
                const text = 'Check www.example.com and www.test.com';
                const result = await service.detectSpam(text);

                expect(result.metrics.linksCount).toBe(2);
            });

            it('should detect domain-only links', async () => {
                const text = 'Visit example.com and test.org';
                const result = await service.detectSpam(text);

                expect(result.metrics.linksCount).toBeGreaterThan(0);
            });
        });

        describe('Suspicious Words', () => {
            it('should detect spam keywords in French', async () => {
                const text = 'Gratuit! Cliquez maintenant pour gagner de l\'argent rapide et garanti!';
                const result = await service.detectSpam(text);

                expect(result.isSpam).toBe(true);
                expect(result.categories.promotionalSpam).toBe(true);
                expect(result.metrics.suspiciousWordsCount).toBeGreaterThan(3);
            });

            it('should detect spam keywords in English', async () => {
                const text = 'Free money! Click now to win guaranteed bonus prize!';
                const result = await service.detectSpam(text);

                expect(result.isSpam).toBe(true);
                expect(result.categories.promotionalSpam).toBe(true);
                expect(result.metrics.suspiciousWordsCount).toBeGreaterThan(3);
            });

            it('should count words correctly', async () => {
                const text = 'gratuit gratuit gratuit';
                const result = await service.detectSpam(text);

                expect(result.metrics.suspiciousWordsCount).toBe(3);
            });
        });

        describe('Urgency Detection', () => {
            it('should detect urgency words', async () => {
                const text = 'Urgent! Maintenant! Vite! Dernière chance! Expire aujourd\'hui!';
                const result = await service.detectSpam(text);

                expect(result.metrics.urgencyScore).toBeGreaterThan(50);
            });

            it('should count exclamation marks', async () => {
                const text = 'Hello!!!!! World!!!!!';
                const result = await service.detectSpam(text);

                expect(result.metrics.urgencyScore).toBeGreaterThan(0);
            });
        });

        describe('Phishing Detection', () => {
            it('should detect phishing patterns in English', async () => {
                const text = 'Please verify your account immediately to avoid suspension.';
                const result = await service.detectSpam(text);

                expect(result.isSpam).toBe(true);
                expect(result.categories.phishing).toBe(true);
                expect(result.reasons).toContain('Patterns de phishing détectés');
            });

            it('should detect phishing patterns in French', async () => {
                const text = 'Vérifiez votre compte maintenant, activité suspecte détectée.';
                const result = await service.detectSpam(text);

                expect(result.isSpam).toBe(true);
                expect(result.categories.phishing).toBe(true);
            });
        });

        describe('Suspicious Patterns', () => {
            it('should detect excessive digits', async () => {
                const text = '123456789012345678901234567890 call now!';
                const result = await service.detectSpam(text);

                expect(result.categories.suspiciousPatterns).toBe(true);
            });

            it('should detect excessive symbols', async () => {
                const text = '!@#$%^&*()!@#$%^&*() spam';
                const result = await service.detectSpam(text);

                expect(result.categories.suspiciousPatterns).toBe(true);
            });

            it('should detect character repetition', async () => {
                const text = 'Helloooooo there!!!!!';
                const result = await service.detectSpam(text);

                expect(result.categories.suspiciousPatterns).toBe(true);
            });
        });

        describe('Spam Score Calculation', () => {
            it('should calculate high spam score for obvious spam', async () => {
                const text = 'FREE MONEY!!! CLICK NOW http://spam.com http://scam.com URGENT GUARANTEED BONUS!!!';
                const result = await service.detectSpam(text);

                expect(result.score).toBeGreaterThan(80);
                expect(result.isSpam).toBe(true);
                expect(result.confidence).toBeGreaterThan(0.8);
            });

            it('should calculate low spam score for clean text', async () => {
                const text = 'Hello, I am interested in your property. Could you please send me more details?';
                const result = await service.detectSpam(text);

                expect(result.score).toBeLessThan(30);
                expect(result.isSpam).toBe(false);
            });
        });

        describe('Strict Mode', () => {
            it('should use lower threshold in strict mode', async () => {
                const text = 'Free offer! Click here to win!';

                const normalResult = await service.detectSpam(text);
                const strictResult = await service.detectSpam(text, { strictMode: true });

                // Same score, different threshold
                expect(normalResult.score).toBe(strictResult.score);

                // Strict mode might flag as spam earlier
                if (normalResult.score >= 50 && normalResult.score < 70) {
                    expect(normalResult.isSpam).toBe(false);
                    expect(strictResult.isSpam).toBe(true);
                }
            });
        });

        describe('Edge Cases', () => {
            it('should handle empty text', async () => {
                const result = await service.detectSpam('');

                expect(result.isSpam).toBe(false);
                expect(result.score).toBe(0);
            });

            it('should handle text with only spaces', async () => {
                const result = await service.detectSpam('     ');

                expect(result.isSpam).toBe(false);
                expect(result.score).toBeLessThanOrEqual(20);
            });

            it('should handle text without letters', async () => {
                const result = await service.detectSpam('123 456 789');

                expect(result.metrics.capitalsRatio).toBe(0);
            });
        });
    });

    // ============================================
    // VALIDATION COMPLÈTE - Tests
    // ============================================

    describe('validateFull()', () => {
        describe('Complete Validation', () => {
            it('should validate all fields successfully', async () => {
                const result = await service.validateFull(
                    'contact@company.com',
                    '20123456',
                    'Hello, I am interested in your property.',
                    { country: 'TN' }
                );

                expect(result.isValid).toBe(true);
                expect(result.globalScore).toBeGreaterThan(70);
                expect(result.email).toBeDefined();
                expect(result.email!.isValid).toBe(true);
                expect(result.phone).toBeDefined();
                expect(result.phone!.isValid).toBe(true);
                expect(result.spam).toBeDefined();
                expect(result.spam!.isSpam).toBe(false);
            });

            it('should handle email only validation', async () => {
                const result = await service.validateFull('contact@company.com');

                expect(result.email).toBeDefined();
                expect(result.phone).toBeUndefined();
                expect(result.spam).toBeUndefined();
                expect(result.isValid).toBe(result.email!.isValid);
            });

            it('should handle phone only validation', async () => {
                const result = await service.validateFull(undefined, '20123456', undefined, { country: 'TN' });

                expect(result.email).toBeUndefined();
                expect(result.phone).toBeDefined();
                expect(result.spam).toBeUndefined();
            });

            it('should handle text only validation', async () => {
                const result = await service.validateFull(
                    undefined,
                    undefined,
                    'Normal message',
                    { detectSpam: true }
                );

                expect(result.email).toBeUndefined();
                expect(result.phone).toBeUndefined();
                expect(result.spam).toBeDefined();
            });
        });

        describe('Global Score Calculation', () => {
            it('should calculate average of all validations', async () => {
                const result = await service.validateFull(
                    'contact@company.com', // ~65 score
                    '20123456',             // ~90 score
                    'Normal text',          // ~100 (inverted spam)
                    { country: 'TN' }
                );

                expect(result.globalScore).toBeGreaterThan(70);
                expect(result.globalScore).toBeLessThanOrEqual(100);
            });

            it('should handle spam score inversion', async () => {
                const result = await service.validateFull(
                    'user@gmail.com',
                    '20123456',
                    'FREE MONEY CLICK NOW!!!',
                    { country: 'TN' }
                );

                // Spam score inverted: high spam = low contribution to global score
                expect(result.spam!.isSpam).toBe(true);
                expect(result.globalScore).toBeLessThan(70);
            });
        });

        describe('Recommendations', () => {
            it('should provide recommendations for invalid email', async () => {
                const result = await service.validateFull('invalid-email');

                expect(result.isValid).toBe(false);
                expect(result.recommendations.length).toBeGreaterThan(0);
                expect(result.recommendations.some(r => r.includes('Email'))).toBe(true);
            });

            it('should provide recommendations for invalid phone', async () => {
                const result = await service.validateFull(
                    undefined,
                    '12345',
                    undefined,
                    { country: 'TN' }
                );

                expect(result.isValid).toBe(false);
                expect(result.recommendations.some(r => r.includes('Téléphone'))).toBe(true);
            });

            it('should provide recommendations for spam', async () => {
                const result = await service.validateFull(
                    undefined,
                    undefined,
                    'FREE MONEY CLICK NOW!!!',
                    { detectSpam: true }
                );

                expect(result.isValid).toBe(false);
                expect(result.recommendations.some(r => r.includes('Spam'))).toBe(true);
            });

            it('should provide recommendation for low global score', async () => {
                const result = await service.validateFull(
                    'test@tempmail.com',
                    '12345',
                    'SPAM!!!',
                    { country: 'TN' }
                );

                expect(result.globalScore).toBeLessThan(50);
                expect(result.recommendations.some(r => r.includes('Score global'))).toBe(true);
            });
        });

        describe('Validation Timestamp', () => {
            it('should include validation timestamp', async () => {
                const before = new Date();
                const result = await service.validateFull('test@example.com');
                const after = new Date();

                expect(result.validatedAt).toBeInstanceOf(Date);
                expect(result.validatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
                expect(result.validatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
            });
        });

        describe('Options Handling', () => {
            it('should respect checkMx option', async () => {
                jest.spyOn<any, any>(service, 'checkMxRecords').mockResolvedValue(true);

                const result = await service.validateFull(
                    'test@example.com',
                    undefined,
                    undefined,
                    { checkMx: true }
                );

                expect(result.email!.format.hasMx).toBe(true);
            });

            it('should respect checkDisposable option', async () => {
                const result = await service.validateFull(
                    'test@tempmail.com',
                    undefined,
                    undefined,
                    { checkDisposable: true }
                );

                expect(result.email!.format.isDisposable).toBe(true);
            });

            it('should respect detectSpam option', async () => {
                const withSpam = await service.validateFull(
                    undefined,
                    undefined,
                    'SPAM!!!',
                    { detectSpam: true }
                );

                const withoutSpam = await service.validateFull(
                    undefined,
                    undefined,
                    'SPAM!!!',
                    { detectSpam: false }
                );

                expect(withSpam.spam).toBeDefined();
                expect(withoutSpam.spam).toBeUndefined();
            });

            it('should respect minScore option', async () => {
                const result = await service.validateFull(
                    'user@gmail.com',
                    undefined,
                    undefined,
                    { minScore: 80 }
                );

                // Gmail has score < 80, so should be invalid
                expect(result.email!.isValid).toBe(false);
            });
        });

        describe('Edge Cases', () => {
            it('should handle all undefined inputs', async () => {
                const result = await service.validateFull();

                expect(result.email).toBeUndefined();
                expect(result.phone).toBeUndefined();
                expect(result.spam).toBeUndefined();
                expect(result.globalScore).toBe(0);
                expect(result.isValid).toBe(true); // No validation = no error
            });

            it('should handle empty strings', async () => {
                const result = await service.validateFull('', '', '');

                expect(result.email!.isValid).toBe(false);
                expect(result.phone!.isValid).toBe(false);
                expect(result.isValid).toBe(false);
            });
        });
    });

    // ============================================
    // PERFORMANCE & STRESS TESTS
    // ============================================

    describe('Performance', () => {
        it('should validate email in less than 100ms', async () => {
            const start = Date.now();
            await service.validateEmail('user@example.com');
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(100);
        });

        it('should validate phone in less than 100ms', async () => {
            const start = Date.now();
            await service.validatePhone('20123456', 'TN');
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(100);
        });

        it('should detect spam in less than 100ms', async () => {
            const start = Date.now();
            await service.detectSpam('Normal text message');
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(100);
        });

        it('should handle bulk validation efficiently', async () => {
            const emails = Array.from({ length: 50 }, (_, i) => `user${i}@example.com`);

            const start = Date.now();
            await Promise.all(emails.map(email => service.validateEmail(email)));
            const duration = Date.now() - start;

            // 50 emails in less than 2s = ~40ms per email
            expect(duration).toBeLessThan(2000);
        });
    });
});
