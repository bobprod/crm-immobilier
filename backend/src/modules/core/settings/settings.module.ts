import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { ApiKeysController } from './api-keys.controller';
import { SettingsService } from './settings.service';
import { PrismaService } from '../../../shared/database/prisma.service';

@Module({
  controllers: [SettingsController, ApiKeysController],
  providers: [SettingsService, PrismaService],
  exports: [SettingsService],
})
export class SettingsModule { }
