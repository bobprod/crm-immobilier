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
import { PersonnelService } from './personnel.service';
import {
  CreateAgentProfileDto,
  UpdateAgentProfileDto,
  UpdateCommissionConfigDto,
  UpdateAgentCommissionOverrideDto,
  UpdateAnnualBonusConfigDto,
  UpsertMonthlyPerformanceDto,
} from './dto/personnel.dto';

@ApiTags('Personnel')
@ApiBearerAuth()
@Controller('personnel')
@UseGuards(JwtAuthGuard)
export class PersonnelController {
  constructor(private readonly personnelService: PersonnelService) {}

  // ─────────────────────────────────────────────
  // AGENT PROFILES
  // ─────────────────────────────────────────────

  @Get('agents')
  @ApiOperation({ summary: 'Get all agents/staff for the current agency' })
  findAllAgents(@Request() req) {
    return this.personnelService.findAllAgents(req.user.sub);
  }

  @Get('agents/:id')
  @ApiOperation({ summary: 'Get a single agent profile with performance history' })
  findOneAgent(@Param('id') id: string, @Request() req) {
    return this.personnelService.findOneAgent(id, req.user.sub);
  }

  @Post('agents')
  @ApiOperation({ summary: 'Create an agent profile for an existing user' })
  createAgentProfile(@Request() req, @Body() dto: CreateAgentProfileDto) {
    return this.personnelService.createAgentProfile(req.user.sub, dto);
  }

  @Put('agents/:id')
  @ApiOperation({ summary: 'Update an agent profile' })
  updateAgentProfile(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdateAgentProfileDto,
  ) {
    return this.personnelService.updateAgentProfile(id, req.user.sub, dto);
  }

  @Delete('agents/:id')
  @ApiOperation({ summary: 'Delete an agent profile' })
  deleteAgentProfile(@Param('id') id: string, @Request() req) {
    return this.personnelService.deleteAgentProfile(id, req.user.sub);
  }

  // ─────────────────────────────────────────────
  // COMMISSION CONFIG (agency-level)
  // ─────────────────────────────────────────────

  @Get('commission-config')
  @ApiOperation({ summary: 'Get agency commission configuration' })
  getCommissionConfig(@Request() req) {
    return this.personnelService.getCommissionConfig(req.user.sub);
  }

  @Put('commission-config')
  @ApiOperation({ summary: 'Create or update agency commission configuration' })
  upsertCommissionConfig(@Request() req, @Body() dto: UpdateCommissionConfigDto) {
    return this.personnelService.upsertCommissionConfig(req.user.sub, dto);
  }

  // ─────────────────────────────────────────────
  // AGENT COMMISSION OVERRIDE (per-agent)
  // ─────────────────────────────────────────────

  @Get('agents/:id/commission-override')
  @ApiOperation({ summary: 'Get per-agent commission override' })
  getAgentCommissionOverride(@Param('id') id: string, @Request() req) {
    return this.personnelService.getAgentCommissionOverride(id, req.user.sub);
  }

  @Put('agents/:id/commission-override')
  @ApiOperation({ summary: 'Create or update per-agent commission override' })
  upsertAgentCommissionOverride(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdateAgentCommissionOverrideDto,
  ) {
    return this.personnelService.upsertAgentCommissionOverride(id, req.user.sub, dto);
  }

  @Delete('agents/:id/commission-override')
  @ApiOperation({ summary: 'Remove per-agent commission override (revert to agency config)' })
  deleteAgentCommissionOverride(@Param('id') id: string, @Request() req) {
    return this.personnelService.deleteAgentCommissionOverride(id, req.user.sub);
  }

  // ─────────────────────────────────────────────
  // ANNUAL BONUS CONFIG (agency-level)
  // ─────────────────────────────────────────────

  @Get('annual-bonus-config')
  @ApiOperation({ summary: 'Get agency annual bonus configuration' })
  getAnnualBonusConfig(@Request() req) {
    return this.personnelService.getAnnualBonusConfig(req.user.sub);
  }

  @Put('annual-bonus-config')
  @ApiOperation({ summary: 'Create or update agency annual bonus configuration' })
  upsertAnnualBonusConfig(@Request() req, @Body() dto: UpdateAnnualBonusConfigDto) {
    return this.personnelService.upsertAnnualBonusConfig(req.user.sub, dto);
  }

  // ─────────────────────────────────────────────
  // MONTHLY PERFORMANCE
  // ─────────────────────────────────────────────

  @Get('agents/:id/performance')
  @ApiOperation({ summary: 'Get monthly performances for an agent' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  getMonthlyPerformances(
    @Param('id') id: string,
    @Request() req,
    @Query('year') year?: string,
  ) {
    return this.personnelService.getMonthlyPerformances(
      id,
      req.user.sub,
      year ? parseInt(year, 10) : undefined,
    );
  }

  @Put('agents/:id/performance')
  @ApiOperation({ summary: 'Create or update monthly performance (auto-calculates commission)' })
  upsertMonthlyPerformance(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpsertMonthlyPerformanceDto,
  ) {
    return this.personnelService.upsertMonthlyPerformance(id, req.user.sub, dto);
  }

  // ─────────────────────────────────────────────
  // ANNUAL SUMMARY
  // ─────────────────────────────────────────────

  @Get('agents/:id/annual-summary')
  @ApiOperation({ summary: 'Get annual CA summary + bonus calculation for an agent' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  getAnnualSummary(
    @Param('id') id: string,
    @Request() req,
    @Query('year') year?: string,
  ) {
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.personnelService.getAnnualSummary(id, req.user.sub, targetYear);
  }

  // ─────────────────────────────────────────────
  // AGENCY STATS
  // ─────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Get agency-wide personnel statistics for a year' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  getAgencyPersonnelStats(@Request() req, @Query('year') year?: string) {
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.personnelService.getAgencyPersonnelStats(req.user.sub, targetYear);
  }
}
