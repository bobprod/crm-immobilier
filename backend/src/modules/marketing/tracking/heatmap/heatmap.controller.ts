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
}
