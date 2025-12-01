import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { IntegrationsService } from './integrations.service';
import { CreateIntegrationDto, ToggleIntegrationDto } from './dto';

@ApiTags('Integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private integrationsService: IntegrationsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer ou mettre à jour une intégration' })
  create(@Request() req, @Body() dto: CreateIntegrationDto) {
    return this.integrationsService.create(req.user.userId, dto.type, dto.apiKey, dto.config);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les intégrations' })
  findAll(@Request() req) {
    return this.integrationsService.findAll(req.user.userId);
  }

  @Get(':type')
  @ApiOperation({ summary: 'Obtenir une intégration par type' })
  findOne(@Request() req, @Param('type') type: string) {
    return this.integrationsService.findOne(req.user.userId, type);
  }

  @Put(':type/toggle')
  @ApiOperation({ summary: 'Activer/Désactiver une intégration' })
  toggleActive(@Request() req, @Param('type') type: string, @Body() dto: ToggleIntegrationDto) {
    return this.integrationsService.toggleActive(req.user.userId, type, dto.isActive);
  }

  @Delete(':type')
  @ApiOperation({ summary: 'Supprimer une intégration' })
  delete(@Request() req, @Param('type') type: string) {
    return this.integrationsService.delete(req.user.userId, type);
  }

  @Post(':type/test')
  @ApiOperation({ summary: 'Tester une intégration' })
  testIntegration(@Request() req, @Param('type') type: string) {
    return this.integrationsService.testIntegration(req.user.userId, type);
  }
}
