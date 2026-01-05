import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/core/auth/guards/jwt-auth.guard';
import { HeatmapService } from './heatmap.service';

@ApiTags('Heatmap Tracking')
@Controller('marketing-tracking/heatmap')
export class HeatmapController {
  constructor(private readonly heatmapService: HeatmapService) {}

  @Post('record')
  @ApiOperation({ summary: 'Record heatmap event (public endpoint for vitrines)' })
  async recordEvent(
    @Body()
    body: {
      userId: string;
      pageUrl: string;
      x: number;
      y: number;
      type: 'click' | 'move' | 'scroll';
      sessionId: string;
      deviceType?: string;
      screenWidth?: number;
      screenHeight?: number;
      element?: string;
    },
  ) {
    return this.heatmapService.recordHeatmapEvent(body.userId, body);
  }

  @Post('record-batch')
  @ApiOperation({ summary: 'Record multiple heatmap events at once' })
  async recordBatch(
    @Body()
    body: {
      userId: string;
      events: Array<{
        pageUrl: string;
        x: number;
        y: number;
        type: 'click' | 'move' | 'scroll';
        sessionId: string;
        deviceType?: string;
        screenWidth?: number;
        screenHeight?: number;
        element?: string;
      }>;
    },
  ) {
    return this.heatmapService.recordBatchHeatmapEvents(body.userId, body.events);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('data')
  @ApiOperation({ summary: 'Get heatmap data for a page' })
  async getHeatmapData(
    @Request() req,
    @Query('pageUrl') pageUrl: string,
    @Query('type') type?: 'click' | 'move' | 'scroll',
    @Query('deviceType') deviceType?: 'desktop' | 'mobile' | 'tablet',
  ) {
    return this.heatmapService.getHeatmapData(req.user.userId, pageUrl, {
      type,
      deviceType,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('stats')
  @ApiOperation({ summary: 'Get heatmap statistics for a page' })
  async getStats(@Request() req, @Query('pageUrl') pageUrl: string) {
    return this.heatmapService.getHeatmapStats(req.user.userId, pageUrl);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('pages')
  @ApiOperation({ summary: 'Get all pages with heatmap data' })
  async getPages(@Request() req) {
    return this.heatmapService.getHeatmapPages(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('scroll-depth')
  @ApiOperation({ summary: 'Get scroll depth analytics for a page' })
  async getScrollDepth(@Request() req, @Query('pageUrl') pageUrl: string) {
    return this.heatmapService.getScrollDepth(req.user.userId, pageUrl);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('property/:propertyId')
  @ApiOperation({ summary: 'Get heatmap data for a specific property' })
  async getPropertyHeatmap(
    @Request() req,
    @Param('propertyId') propertyId: string,
    @Query('type') type?: 'click' | 'move' | 'scroll',
    @Query('deviceType') deviceType?: 'desktop' | 'mobile' | 'tablet',
  ) {
    // Récupérer tous les événements heatmap avec le propertyId dans le contexte
    const prisma = (this.heatmapService as any).prisma;

    const events = await prisma.heatmapEvent.findMany({
      where: {
        userId: req.user.userId,
        ...(type && { type }),
        ...(deviceType && { deviceType }),
      },
    });

    // Filtrer les événements qui ont le propertyId dans les données contextuelles
    // Note: le champ 'element' peut contenir le JSON avec propertyId
    const propertyEvents = events.filter((event: any) => {
      // Essayer de parser l'élément comme JSON pour vérifier propertyId
      try {
        if (event.element && event.element.includes('propertyId')) {
          return event.element.includes(propertyId);
        }
      } catch (e) {
        // Ignore
      }
      return false;
    });

    // Agréger les données
    const gridSize = 20; // pixels
    const heatmapData = new Map<string, { x: number; y: number; value: number }>();

    propertyEvents.forEach((event: any) => {
      const gridX = Math.floor(event.x / gridSize) * gridSize;
      const gridY = Math.floor(event.y / gridSize) * gridSize;
      const key = `${gridX},${gridY}`;

      if (heatmapData.has(key)) {
        heatmapData.get(key)!.value++;
      } else {
        heatmapData.set(key, { x: gridX, y: gridY, value: 1 });
      }
    });

    return {
      propertyId,
      totalEvents: propertyEvents.length,
      heatmapData: Array.from(heatmapData.values()),
      filters: { type, deviceType },
    };
  }
}
