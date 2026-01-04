import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
  HttpStatus,
  Ip,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { VitrineService } from './vitrine.service';
import { VitrineTrackingService } from './services/vitrine-tracking.service';
import { UpdateVitrineConfigDto, UpdatePublishedPropertyDto } from './dto';

@ApiTags('Vitrine Publique')
@Controller('vitrine')
export class VitrineController {
  constructor(
    private readonly vitrineService: VitrineService,
    private readonly vitrineTrackingService: VitrineTrackingService,
  ) {}

  // ============================================
  // ROUTES PRIVÉES (Authentifiées)
  // ============================================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('config')
  @ApiOperation({ summary: 'Get vitrine configuration' })
  async getConfig(@Request() req) {
    return this.vitrineService.getConfig(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('config')
  @ApiOperation({ summary: 'Update vitrine configuration' })
  async updateConfig(@Request() req, @Body() dto: UpdateVitrineConfigDto) {
    return this.vitrineService.updateConfig(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('published-properties')
  @ApiOperation({ summary: 'Get published properties' })
  async getPublishedProperties(@Request() req) {
    return this.vitrineService.getPublishedProperties(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('properties/:id/publish')
  @ApiOperation({ summary: 'Publish a property' })
  async publishProperty(
    @Request() req,
    @Param('id') propertyId: string,
    @Body() dto: UpdatePublishedPropertyDto,
  ) {
    return this.vitrineService.publishProperty(req.user.userId, propertyId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('properties/:id/unpublish')
  @ApiOperation({ summary: 'Unpublish a property' })
  async unpublishProperty(@Request() req, @Param('id') propertyId: string) {
    return this.vitrineService.unpublishProperty(req.user.userId, propertyId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('analytics')
  @ApiOperation({ summary: 'Get vitrine analytics' })
  async getAnalytics(@Request() req, @Query('period') period?: string) {
    return this.vitrineService.getAnalytics(req.user.userId, period);
  }

  // ============================================
  // ROUTES PUBLIQUES (Sans authentification)
  // ============================================

  @Get('public/:userId')
  @ApiOperation({ summary: 'Get public vitrine (no auth required)' })
  async getPublicVitrine(@Param('userId') userId: string) {
    return this.vitrineService.getPublicVitrine(userId);
  }

  @Get('tracking-script/:userId')
  @ApiOperation({
    summary: 'Get tracking pixels script for vitrine (no auth required)',
    description:
      'Retourne le script JavaScript contenant tous les pixels de tracking configurés pour cette agence',
  })
  async getTrackingScript(@Param('userId') userId: string, @Res() res: Response) {
    const script = await this.vitrineTrackingService.generateTrackingScript(userId);

    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache 5 minutes
    res.status(HttpStatus.OK).send(script);
  }

  @Post('track-event')
  @ApiOperation({
    summary: 'Track a vitrine event (no auth required)',
    description: 'Enregistre un événement de tracking depuis une page vitrine publique',
  })
  async trackEvent(
    @Body()
    body: {
      userId: string;
      eventName: string;
      eventData: Record<string, any>;
      sessionId?: string;
    },
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    await this.vitrineTrackingService.trackVitrineEvent(body.userId, body.eventName, {
      ...body.eventData,
      sessionId: body.sessionId,
      userAgent,
      ipAddress,
    });

    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('tracking-stats')
  @ApiOperation({ summary: 'Get vitrine tracking statistics' })
  async getTrackingStats(@Request() req, @Query('period') period?: 'day' | 'week' | 'month') {
    return this.vitrineTrackingService.getVitrineTrackingStats(req.user.userId, period);
  }
}
