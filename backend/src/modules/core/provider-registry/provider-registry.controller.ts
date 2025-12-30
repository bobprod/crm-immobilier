import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { ProviderRegistryService } from './services/provider-registry.service';
import {
  CreateProviderConfigDto,
  UpdateProviderConfigDto,
  TestProviderDto,
} from './dto';
import { ProviderType, ProviderStatus } from '@prisma/client';

@ApiTags('provider-registry')
@ApiBearerAuth()
@Controller('provider-registry')
@UseGuards(JwtAuthGuard)
export class ProviderRegistryController {
  constructor(private readonly providerRegistryService: ProviderRegistryService) {}

  // ═════════════════════════════════════════════════════════════════
  // CRUD ENDPOINTS
  // ═════════════════════════════════════════════════════════════════

  @Post()
  @ApiOperation({
    summary: 'Créer un nouveau provider',
    description: 'Configure un nouveau provider (scraping, LLM, storage, etc.)',
  })
  async create(@Request() req, @Body() dto: CreateProviderConfigDto) {
    const userId = req.user.userId;
    const agencyId = req.user.agencyId;
    return this.providerRegistryService.create(userId, dto, agencyId);
  }

  @Get()
  @ApiOperation({
    summary: 'Lister tous les providers de l\'utilisateur',
    description: 'Récupère tous les providers configurés avec filtres optionnels',
  })
  @ApiQuery({ name: 'type', enum: ProviderType, required: false })
  @ApiQuery({ name: 'isActive', type: Boolean, required: false })
  @ApiQuery({ name: 'status', enum: ProviderStatus, required: false })
  async findAll(
    @Request() req,
    @Query('type') type?: ProviderType,
    @Query('isActive') isActive?: string,
    @Query('status') status?: ProviderStatus,
  ) {
    const userId = req.user.userId;
    return this.providerRegistryService.findAllByUser(userId, {
      type,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      status,
    });
  }

  @Get('available/:type')
  @ApiOperation({
    summary: 'Liste des providers disponibles pour un type',
    description: 'Retourne les providers avec leurs métriques (pour affichage UI)',
  })
  async getAvailable(@Request() req, @Param('type') type: ProviderType) {
    const userId = req.user.userId;
    return this.providerRegistryService.getAvailableProviders(userId, type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un provider par ID' })
  async findOne(@Request() req, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.providerRegistryService.findOne(id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un provider' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateProviderConfigDto,
  ) {
    const userId = req.user.userId;
    return this.providerRegistryService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un provider' })
  async delete(@Request() req, @Param('id') id: string) {
    const userId = req.user.userId;
    await this.providerRegistryService.delete(id, userId);
    return { message: 'Provider deleted successfully' };
  }

  // ═════════════════════════════════════════════════════════════════
  // PROVIDER TESTING & HEALTH CHECK
  // ═════════════════════════════════════════════════════════════════

  @Post(':id/test')
  @ApiOperation({
    summary: 'Tester la connexion d\'un provider',
    description: 'Vérifie que le provider est correctement configuré et accessible',
  })
  async testProvider(@Request() req, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.providerRegistryService.testProvider(id, userId);
  }

  // ═════════════════════════════════════════════════════════════════
  // PROVIDER SELECTION - Pour utilisation par d'autres modules
  // ═════════════════════════════════════════════════════════════════

  @Get('select/:type')
  @ApiOperation({
    summary: 'Sélectionner le meilleur provider',
    description: 'Routing intelligent basé sur priorité, performance, et budget',
  })
  @ApiQuery({ name: 'operationType', required: false })
  @ApiQuery({ name: 'minSuccessRate', type: Number, required: false })
  @ApiQuery({ name: 'requiresApiKey', type: Boolean, required: false })
  async selectBest(
    @Request() req,
    @Param('type') type: ProviderType,
    @Query('operationType') operationType?: string,
    @Query('minSuccessRate') minSuccessRate?: string,
    @Query('requiresApiKey') requiresApiKey?: string,
  ) {
    const userId = req.user.userId;
    return this.providerRegistryService.selectBestProvider(userId, type, {
      operationType,
      minSuccessRate: minSuccessRate ? parseFloat(minSuccessRate) : undefined,
      requiresApiKey: requiresApiKey === 'true',
    });
  }
}
