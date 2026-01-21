import { Module } from '@nestjs/common';
import { UnifiedValidationService } from './unified-validation.service';
import { ValidationController } from './validation.controller';
import { ValidationMetricsController } from './validation-metrics.controller';
import { PrismaModule } from '../database/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ValidationController, ValidationMetricsController],
    providers: [UnifiedValidationService],
    exports: [UnifiedValidationService],
})
export class ValidationModule { }
