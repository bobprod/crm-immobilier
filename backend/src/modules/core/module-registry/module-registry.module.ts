import { Module } from '@nestjs/common';
import { ModuleRegistryService } from './module-registry.service';
import { ModuleRegistryController } from './module-registry.controller';
import { PrismaService } from '../../../shared/database/prisma.service';

@Module({
  controllers: [ModuleRegistryController],
  providers: [ModuleRegistryService, PrismaService],
  exports: [ModuleRegistryService],
})
export class ModuleRegistryModule {}
