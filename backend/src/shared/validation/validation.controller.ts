import { Controller, Post, Body, Get } from '@nestjs/common';
import { UnifiedValidationService } from './unified-validation.service';
import type { ValidationOptions } from './dto/validation.dto';

@Controller('api/validation')
export class ValidationController {
    constructor(private readonly validationService: UnifiedValidationService) { }

    @Get('health')
    health() {
        return { status: 'ok', service: 'UnifiedValidationService' };
    }

    @Post('email')
    async validateEmail(
        @Body('email') email: string,
        @Body('options') options?: ValidationOptions,
    ) {
        const result = await this.validationService.validateEmail(email, options || {});
        return result;
    }

    @Post('phone')
    async validatePhone(
        @Body('phone') phone: string,
        @Body('options') options?: ValidationOptions,
    ) {
        const country = options?.country || 'TN';
        const result = await this.validationService.validatePhone(phone, country, options || {});
        return result;
    }

    @Post('spam')
    detectSpam(
        @Body('text') text: string,
        @Body('options') options?: ValidationOptions,
    ) {
        const result = this.validationService.detectSpam(text, options || {});
        return result;
    }

    @Post('full')
    async validateFull(
        @Body('email') email?: string,
        @Body('phone') phone?: string,
        @Body('text') text?: string,
        @Body('options') options?: ValidationOptions,
    ) {
        const result = await this.validationService.validateFull(
            email,
            phone,
            text,
            options || {},
        );
        return result;
    }
}
