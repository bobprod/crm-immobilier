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
import { TemplatesService } from './templates.service';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateFiltersDto,
  TemplateResponseDto,
  TemplatesListResponseDto,
  TemplateStatsDto,
} from './dto';

@ApiTags('WhatsApp Templates')
@ApiBearerAuth()
@Controller('whatsapp/templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  // ═══════════════════════════════════════════════════════════════
  // CRUD OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 templates per minute
  @ApiOperation({
    summary: 'Create a new WhatsApp template',
    description:
      'Creates a new message template for WhatsApp Business. Templates must be approved by Meta before use.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Template created successfully',
    type: TemplateResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid template data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Template with this name already exists',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'WhatsApp configuration not found',
  })
  async createTemplate(
    @Req() req: any,
    @Body() dto: CreateTemplateDto,
  ): Promise<TemplateResponseDto> {
    return this.templatesService.createTemplate(req.user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all templates',
    description:
      'Retrieves all WhatsApp templates with optional filtering, searching, and pagination.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Templates retrieved successfully',
    type: TemplatesListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'WhatsApp configuration not found',
  })
  async getTemplates(
    @Req() req: any,
    @Query() filters: TemplateFiltersDto,
  ): Promise<TemplatesListResponseDto> {
    return this.templatesService.getTemplates(req.user.id, filters);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get template by ID',
    description: 'Retrieves a single WhatsApp template by its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'Template unique identifier',
    example: 'clxxx123456789',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template retrieved successfully',
    type: TemplateResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  async getTemplate(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<TemplateResponseDto> {
    return this.templatesService.getTemplate(req.user.id, id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update template',
    description:
      'Updates an existing WhatsApp template. Changing content will reset status to pending.',
  })
  @ApiParam({
    name: 'id',
    description: 'Template unique identifier',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template updated successfully',
    type: TemplateResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid update data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Template name already exists',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  async updateTemplate(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ): Promise<TemplateResponseDto> {
    return this.templatesService.updateTemplate(req.user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete template',
    description: 'Permanently deletes a WhatsApp template.',
  })
  @ApiParam({
    name: 'id',
    description: 'Template unique identifier',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Template deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  async deleteTemplate(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<void> {
    return this.templatesService.deleteTemplate(req.user.id, id);
  }

  // ═══════════════════════════════════════════════════════════════
  // ADDITIONAL OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  @Post(':id/duplicate')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 duplications per minute
  @ApiOperation({
    summary: 'Duplicate template',
    description:
      'Creates a copy of an existing template with "_copy" suffix. Status will be reset to pending.',
  })
  @ApiParam({
    name: 'id',
    description: 'Template unique identifier to duplicate',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Template duplicated successfully',
    type: TemplateResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  async duplicateTemplate(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<TemplateResponseDto> {
    return this.templatesService.duplicateTemplate(req.user.id, id);
  }

  @Get(':id/stats')
  @ApiOperation({
    summary: 'Get template statistics',
    description:
      'Retrieves performance statistics for a specific template (sent, delivered, read rates).',
  })
  @ApiParam({
    name: 'id',
    description: 'Template unique identifier',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template statistics retrieved successfully',
    type: TemplateStatsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  async getTemplateStats(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<TemplateStatsDto> {
    return this.templatesService.getTemplateStats(req.user.id, id);
  }
}
