import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AutoReportsService } from './auto-reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

@Controller('auto-reports')
@UseGuards(JwtAuthGuard)
export class AutoReportsController {
  constructor(private readonly autoReportsService: AutoReportsService) {}

  /**
   * Générer un nouveau rapport
   */
  @Post('generate')
  async generateReport(
    @Request() req,
    @Body() dto: GenerateReportDto,
  ) {
    const userId = req.user.userId;
    return this.autoReportsService.generateReport(userId, dto);
  }

  /**
   * Obtenir l'historique des rapports
   */
  @Get('history')
  async getReportHistory(
    @Request() req,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.userId;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.autoReportsService.getReportHistory(userId, limitNum);
  }
}
