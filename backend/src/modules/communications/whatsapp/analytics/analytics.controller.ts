import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import {
  AnalyticsPeriodDto,
  AnalyticsMetricsDto,
  AnalyticsChartDataDto,
  TemplatePerformanceDto,
  ConversationStatsDto,
  AnalyticsReportDto,
  ExportFormat,
  ExportResultDto,
} from './dto';

@ApiTags('WhatsApp Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('whatsapp/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ═══════════════════════════════════════════════════════════════
  // ANALYTICS ENDPOINTS
  // ═══════════════════════════════════════════════════════════════

  @Get('metrics')
  @ApiOperation({
    summary: 'Get analytics metrics',
    description:
      'Retrieves comprehensive analytics metrics for messages, conversations, templates, and engagement.',
  })
  @ApiQuery({
    name: 'start',
    description: 'Start date (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'end',
    description: 'End date (ISO 8601)',
    example: '2024-01-31T23:59:59Z',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Metrics retrieved successfully',
    type: AnalyticsMetricsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'WhatsApp configuration not found',
  })
  async getMetrics(
    @Req() req: any,
    @Query() period: AnalyticsPeriodDto,
  ): Promise<AnalyticsMetricsDto> {
    return this.analyticsService.getMetrics(req.user.userId, period);
  }

  @Get('charts')
  @ApiOperation({
    summary: 'Get chart data',
    description:
      'Retrieves time series data for messages, conversations, and response time charts.',
  })
  @ApiQuery({
    name: 'start',
    description: 'Start date (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'end',
    description: 'End date (ISO 8601)',
    example: '2024-01-31T23:59:59Z',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Chart data retrieved successfully',
    type: AnalyticsChartDataDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'WhatsApp configuration not found',
  })
  async getChartData(
    @Req() req: any,
    @Query() period: AnalyticsPeriodDto,
  ): Promise<AnalyticsChartDataDto> {
    return this.analyticsService.getChartData(req.user.userId, period);
  }

  @Get('templates/performance')
  @ApiOperation({
    summary: 'Get template performance',
    description:
      'Retrieves performance metrics for all templates (sent, delivered, read rates).',
  })
  @ApiQuery({
    name: 'start',
    description: 'Start date (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'end',
    description: 'End date (ISO 8601)',
    example: '2024-01-31T23:59:59Z',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template performance retrieved successfully',
    type: [TemplatePerformanceDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'WhatsApp configuration not found',
  })
  async getTemplatePerformance(
    @Req() req: any,
    @Query() period: AnalyticsPeriodDto,
  ): Promise<TemplatePerformanceDto[]> {
    return this.analyticsService.getTemplatePerformance(req.user.userId, period);
  }

  @Get('conversations/by-hour')
  @ApiOperation({
    summary: 'Get conversation stats by hour',
    description:
      'Retrieves conversation distribution by hour of day (0-23) for the specified period.',
  })
  @ApiQuery({
    name: 'start',
    description: 'Start date (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'end',
    description: 'End date (ISO 8601)',
    example: '2024-01-31T23:59:59Z',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation stats retrieved successfully',
    type: [ConversationStatsDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'WhatsApp configuration not found',
  })
  async getConversationStatsByHour(
    @Req() req: any,
    @Query() period: AnalyticsPeriodDto,
  ): Promise<ConversationStatsDto[]> {
    return this.analyticsService.getConversationStatsByHour(
      req.user.userId,
      period,
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // REPORTS
  // ═══════════════════════════════════════════════════════════════

  @Get('report')
  @ApiOperation({
    summary: 'Generate analytics report',
    description:
      'Generates a complete analytics report with all metrics, charts, and template performance.',
  })
  @ApiQuery({
    name: 'start',
    description: 'Start date (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'end',
    description: 'End date (ISO 8601)',
    example: '2024-01-31T23:59:59Z',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report generated successfully',
    type: AnalyticsReportDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'WhatsApp configuration not found',
  })
  async generateReport(
    @Req() req: any,
    @Query() period: AnalyticsPeriodDto,
  ): Promise<AnalyticsReportDto> {
    return this.analyticsService.generateReport(req.user.userId, period);
  }

  @Get('report/export')
  @ApiOperation({
    summary: 'Export analytics report',
    description:
      'Exports analytics report in specified format (PDF, CSV, Excel, JSON). Returns base64 encoded data.',
  })
  @ApiQuery({
    name: 'start',
    description: 'Start date (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'end',
    description: 'End date (ISO 8601)',
    example: '2024-01-31T23:59:59Z',
  })
  @ApiQuery({
    name: 'format',
    description: 'Export format',
    enum: ExportFormat,
    required: false,
    example: ExportFormat.CSV,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report exported successfully',
    type: ExportResultDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'WhatsApp configuration not found',
  })
  async exportReport(
    @Req() req: any,
    @Query() period: AnalyticsPeriodDto,
    @Query('format') format?: ExportFormat,
  ): Promise<ExportResultDto> {
    return this.analyticsService.exportReport(
      req.user.userId,
      period,
      format || ExportFormat.JSON,
    );
  }
}
