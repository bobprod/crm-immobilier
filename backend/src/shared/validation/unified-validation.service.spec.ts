import { UnifiedValidationService } from './unified-validation.service';

describe('UnifiedValidationService - Unit Tests', () => {
    let service: UnifiedValidationService;

    beforeEach(() => {
        service = new UnifiedValidationService();
    });

    describe('Email Validation', () => {
        it('should validate correct email', async () => {
            const result = await service.validateEmail('test@example.com');
            expect(result.isValid).toBe(true);
            expect(result.format.hasValidFormat).toBe(true);
        });

        it('should detect invalid email', async () => {
            const result = await service.validateEmail('invalid-email');
            expect(result.isValid).toBe(false);
        });

        it('should detect disposable email', async () => {
            const result = await service.validateEmail('test@tempmail.com');
            expect(result.format.isDisposable).toBe(true);
            expect(result.risk.isSpam).toBe(true);
        });
    });

    describe('Phone Validation', () => {
        it('should validate Tunisian mobile', async () => {
            const result = await service.validatePhone('20123456', 'TN');
            expect(result.isValid).toBe(true);
            expect(result.details.type).toBe('mobile');
            expect(result.normalized.e164).toBe('+21620123456');
        });

        it('should detect carrier', async () => {
            const result = await service.validatePhone('50987654', 'TN');
            expect(result.details.carrier).toBe('Orange Tunisie');
        });
    });

    describe('Spam Detection', () => {
        it('should detect obvious spam', async () => {
            const result = await service.detectSpam('FREE MONEY CLICK NOW!!!');
            expect(result.isSpam).toBe(true);
            expect(result.score).toBeGreaterThan(70);
        });

        it('should not flag clean text', async () => {
            const result = await service.detectSpam('Hello, I am interested');
            expect(result.isSpam).toBe(false);
            expect(result.score).toBeLessThan(50);
        });
    });

    describe('Full Validation', () => {
        it('should validate all fields', async () => {
            const result = await service.validateFull(
                'contact@company.com',
                '20123456',
                'Normal message',
                { country: 'TN' }
            );

            expect(result.isValid).toBe(true);
            expect(result.globalScore).toBeGreaterThan(70);
            expect(result.email).toBeDefined();
            expect(result.phone).toBeDefined();
            expect(result.spam).toBeDefined();
        });
    });
});
