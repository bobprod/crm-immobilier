import { Controller, Post, Body, UseGuards, Logger, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { OrchestratorRateLimitGuard } from './guards/orchestrator-rate-limit.guard';
import { AiOrchestratorService } from './services/ai-orchestrator.service';
import { OrchestrationRequestDto, OrchestrationResponseDto } from './dto';

/**
 * Controller de l'orchestrateur IA
 */
@ApiTags('ai-orchestrator')
@ApiBearerAuth()
@Controller('ai/orchestrate')
@UseGuards(JwtAuthGuard, OrchestratorRateLimitGuard)
export class AiOrchestratorController {
  private readonly logger = new Logger(AiOrchestratorController.name);

  constructor(private readonly orchestratorService: AiOrchestratorService) {}

  /**
   * POST /api/ai/orchestrate
   *
   * Orchestrer une demande IA
   */
  @Post()
  @ApiOperation({ summary: 'Orchestrate an AI task' })
  @ApiHeader({ name: 'X-RateLimit-Limit', description: 'Nombre max de requêtes par fenêtre' })
  @ApiHeader({ name: 'X-RateLimit-Remaining', description: 'Nombre de requêtes restantes' })
  @ApiHeader({ name: 'X-RateLimit-Reset', description: 'Date de reset du compteur' })
  async orchestrate(
    @Request() req,
    @Body() request: OrchestrationRequestDto,
  ): Promise<OrchestrationResponseDto> {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId || userId; // Fallback au userId si pas de tenantId

    this.logger.log(`Orchestration request from user ${userId}, tenant ${tenantId}`);

    // Injecter tenantId et userId depuis req.user
    request.tenantId = tenantId;
    request.userId = userId;

    return this.orchestratorService.orchestrate(request);
  }
}
