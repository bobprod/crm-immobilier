import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SetSettingDto, BulkUpdateSettingsDto, SettingResponseDto, TestConnectionResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtenir tous les paramètres' })
  getAllSettings(@Request() req) {
    return this.settingsService.getAllSettings(req.user.userId);
  }

  @Get(':section')
  @ApiOperation({ summary: 'Obtenir les paramètres d\'une section' })
  getSectionSettings(@Request() req, @Param('section') section: string) {
    return this.settingsService.getSectionSettings(req.user.userId, section);
  }

  @Get(':section/:key')
  @ApiOperation({ summary: 'Obtenir un paramètre spécifique' })
  getSetting(
    @Request() req,
    @Param('section') section: string,
    @Param('key') key: string,
  ) {
    return this.settingsService.getSetting(req.user.userId, section, key);
  }

  @Post(':section/:key')
  @ApiOperation({ summary: 'Définir un paramètre' })
  @ApiResponse({ status: 200, type: SettingResponseDto })
  setSetting(
    @Request() req,
    @Param('section') section: string,
    @Param('key') key: string,
    @Body() data: SetSettingDto,
  ) {
    return this.settingsService.setSetting(
      req.user.userId,
      section,
      key,
      data.value,
      data.encrypted,
      data.description,
    );
  }

  @Post(':section/bulk')
  @ApiOperation({ summary: 'Mettre à jour plusieurs paramètres' })
  @ApiResponse({ status: 200, type: [SettingResponseDto] })
  updateSectionSettings(
    @Request() req,
    @Param('section') section: string,
    @Body() data: BulkUpdateSettingsDto,
  ) {
    return this.settingsService.updateSectionSettings(
      req.user.userId,
      section,
      data.settings,
    );
  }

  @Delete(':section/:key')
  @ApiOperation({ summary: 'Supprimer un paramètre' })
  deleteSetting(
    @Request() req,
    @Param('section') section: string,
    @Param('key') key: string,
  ) {
    return this.settingsService.deleteSetting(req.user.userId, section, key);
  }

  @Delete(':section')
  @ApiOperation({ summary: 'Supprimer une section' })
  deleteSection(@Request() req, @Param('section') section: string) {
    return this.settingsService.deleteSection(req.user.userId, section);
  }

  @Post(':section/test')
  @ApiOperation({ summary: 'Tester une connexion' })
  @ApiResponse({ status: 200, type: TestConnectionResponseDto })
  testConnection(@Request() req, @Param('section') section: string) {
    return this.settingsService.testConnection(req.user.userId, section);
  }

  @Get('pica-ai/config')
  @ApiOperation({ summary: 'Obtenir la configuration Pica AI complète' })
  getPicaAIConfig(@Request() req) {
    return this.settingsService.getPicaAIConfig(req.user.userId);
  }
}
