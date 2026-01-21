import { Test, TestingModule } from '@nestjs/testing';
import { UnifiedValidationService } from '../../src/shared/validation/unified-validation.service';

describe('UnifiedValidationService - Quick Test', () => {
    let service: UnifiedValidationService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UnifiedValidationService],
        }).compile();

        service = module.get<UnifiedValidationService>(UnifiedValidationService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should validate a simple email', async () => {
        const result = await service.validateEmail('test@example.com');
        expect(result).toBeDefined();
        expect(result.email).toBe('test@example.com');
        expect(result.format.hasValidFormat).toBe(true);
    });

    it('should validate a Tunisian phone', async () => {
        const result = await service.validatePhone('20123456', 'TN');
        expect(result).toBeDefined();
        expect(result.isValid).toBe(true);
        expect(result.details.type).toBe('mobile');
    });

    it('should detect spam', async () => {
        const result = await service.detectSpam('FREE MONEY CLICK NOW!!!');
        expect(result).toBeDefined();
        expect(result.isSpam).toBe(true);
    });
});
