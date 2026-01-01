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
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CampaignsService } from './campaigns.service';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignFiltersDto,
  CampaignResponseDto,
  CampaignsListResponseDto,
  CampaignStatsDto,
} from './dto';

@ApiTags('WhatsApp Campaigns')
@ApiBearerAuth()
@Controller('whatsapp/campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  // ═══════════════════════════════════════════════════════════════
  // CRUD OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 campaigns per minute
  @ApiOperation({
    summary: 'Create a new WhatsApp campaign',
    description:
      'Creates a new broadcast campaign with template and recipients.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Campaign created successfully',
    type: CampaignResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid campaign data or template not approved',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'WhatsApp configuration or template not found',
  })
  async createCampaign(
    @Req() req: any,
    @Body() dto: CreateCampaignDto,
  ): Promise<CampaignResponseDto> {
    return this.campaignsService.createCampaign(req.user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all campaigns',
    description:
      'Retrieves all WhatsApp campaigns with optional filtering and pagination.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Campaigns retrieved successfully',
    type: CampaignsListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'WhatsApp configuration not found',
  })
  async getCampaigns(
    @Req() req: any,
    @Query() filters: CampaignFiltersDto,
  ): Promise<CampaignsListResponseDto> {
    return this.campaignsService.getCampaigns(req.user.id, filters);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get campaign by ID',
    description:
      'Retrieves a single WhatsApp campaign with all recipients details.',
  })
  @ApiParam({
    name: 'id',
    description: 'Campaign unique identifier',
    example: 'clxxx123456789',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Campaign retrieved successfully',
    type: CampaignResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Campaign not found',
  })
  async getCampaign(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<CampaignResponseDto> {
    return this.campaignsService.getCampaign(req.user.id, id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update campaign',
    description:
      'Updates a campaign. Only draft and scheduled campaigns can be updated.',
  })
  @ApiParam({
    name: 'id',
    description: 'Campaign unique identifier',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Campaign updated successfully',
    type: CampaignResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot update campaign in current status',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Campaign not found',
  })
  async updateCampaign(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ): Promise<CampaignResponseDto> {
    return this.campaignsService.updateCampaign(req.user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete campaign',
    description: 'Permanently deletes a campaign. Cannot delete running campaigns.',
  })
  @ApiParam({
    name: 'id',
    description: 'Campaign unique identifier',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Campaign deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete running campaign',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Campaign not found',
  })
  async deleteCampaign(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<void> {
    return this.campaignsService.deleteCampaign(req.user.id, id);
  }

  // ═══════════════════════════════════════════════════════════════
  // CAMPAIGN ACTIONS
  // ═══════════════════════════════════════════════════════════════

  @Post(':id/launch')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 launches per minute
  @ApiOperation({
    summary: 'Launch campaign',
    description:
      'Launches a campaign and starts sending messages to all recipients.',
  })
  @ApiParam({
    name: 'id',
    description: 'Campaign unique identifier',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Campaign launched successfully',
    type: CampaignResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Campaign cannot be launched in current status',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Campaign not found',
  })
  async launchCampaign(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<CampaignResponseDto> {
    return this.campaignsService.launchCampaign(req.user.id, id);
  }

  @Post(':id/pause')
  @ApiOperation({
    summary: 'Pause campaign',
    description: 'Pauses a running campaign. Can be resumed later.',
  })
  @ApiParam({
    name: 'id',
    description: 'Campaign unique identifier',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Campaign paused successfully',
    type: CampaignResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Can only pause running campaigns',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Campaign not found',
  })
  async pauseCampaign(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<CampaignResponseDto> {
    return this.campaignsService.pauseCampaign(req.user.id, id);
  }

  @Post(':id/resume')
  @ApiOperation({
    summary: 'Resume campaign',
    description: 'Resumes a paused campaign.',
  })
  @ApiParam({
    name: 'id',
    description: 'Campaign unique identifier',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Campaign resumed successfully',
    type: CampaignResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Can only resume paused campaigns',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Campaign not found',
  })
  async resumeCampaign(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<CampaignResponseDto> {
    return this.campaignsService.resumeCampaign(req.user.id, id);
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Cancel campaign',
    description: 'Cancels a campaign. Cannot be undone.',
  })
  @ApiParam({
    name: 'id',
    description: 'Campaign unique identifier',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Campaign cancelled successfully',
    type: CampaignResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Campaign cannot be cancelled in current status',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Campaign not found',
  })
  async cancelCampaign(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<CampaignResponseDto> {
    return this.campaignsService.cancelCampaign(req.user.id, id);
  }

  // ═══════════════════════════════════════════════════════════════
  // STATISTICS
  // ═══════════════════════════════════════════════════════════════

  @Get(':id/stats')
  @ApiOperation({
    summary: 'Get campaign statistics',
    description:
      'Retrieves detailed statistics for a specific campaign (sent, delivered, read rates).',
  })
  @ApiParam({
    name: 'id',
    description: 'Campaign unique identifier',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Campaign statistics retrieved successfully',
    type: CampaignStatsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Campaign not found',
  })
  async getCampaignStats(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<CampaignStatsDto> {
    return this.campaignsService.getCampaignStats(req.user.id, id);
  }
}
