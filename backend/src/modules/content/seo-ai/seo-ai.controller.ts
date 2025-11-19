import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SeoAiService } from './seo-ai.service';
import { JwtAuthGuard } from '@/modules/core/auth/guards/jwt-auth.guard';
import { GenerateAltTextDto, OptimizeBatchDto } from './dto';

/**
 * Controller pour le module SEO AI
 * 
 * Permet l'optimisation automatique du SEO des biens immobiliers
 * via intelligence artificielle (Multi-Provider: Claude, GPT, Gemini, etc.)
 */
@Controller('seo-ai')
@UseGuards(JwtAuthGuard)
export class SeoAiController {
  constructor(private readonly seoAiService: SeoAiService) {}

  /**
   * Optimiser automatiquement un bien pour le SEO
   * POST /seo-ai/optimize/:propertyId
   */
  @Post('optimize/:propertyId')
  async optimizeProperty(
    @Request() req,
    @Param('propertyId') propertyId: string,
  ) {
    return this.seoAiService.optimizeProperty(propertyId, req.user.userId);
  }

  /**
   * Récupérer le SEO d'un bien
   * GET /seo-ai/property/:propertyId
   */
  @Get('property/:propertyId')
  async getPropertySeo(
    @Request() req,
    @Param('propertyId') propertyId: string,
  ) {
    return this.seoAiService.getPropertySeo(propertyId);
  }

  /**
   * Générer un alt text pour une image
   * POST /seo-ai/generate/alt-text
   */
  @Post('generate/alt-text')
  async generateAltText(
    @Request() req,
    @Body() body: GenerateAltTextDto,
  ) {
    return this.seoAiService.generateAltText(
      body.propertyId,
      req.user.userId,
      body.imageUrl,
      body.imageIndex,
    );
  }

  /**
   * Optimiser plusieurs biens en batch
   * POST /seo-ai/optimize/batch
   */
  @Post('optimize/batch')
  async optimizeBatch(
    @Request() req,
    @Body() body: OptimizeBatchDto,
  ) {
    return this.seoAiService.bulkOptimize(req.user.userId, body.propertyIds);
  }
}
