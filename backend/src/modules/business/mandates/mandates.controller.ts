import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { MandatesService } from './mandates.service';
import { CreateMandateDto } from './dto/create-mandate.dto';
import { UpdateMandateDto } from './dto/update-mandate.dto';

@ApiTags('Mandates')
@ApiBearerAuth()
@Controller('mandates')
@UseGuards(JwtAuthGuard)
export class MandatesController {
  constructor(private readonly mandatesService: MandatesService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new mandate' })
  create(@Request() req, @Body() createMandateDto: CreateMandateDto) {
    return this.mandatesService.create(req.user.sub, createMandateDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all mandates' })
  findAll(
    @Request() req,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('ownerId') ownerId?: string,
    @Query('propertyId') propertyId?: string,
    @Query('expiringInDays') expiringInDays?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (category) filters.category = category;
    if (ownerId) filters.ownerId = ownerId;
    if (propertyId) filters.propertyId = propertyId;
    if (expiringInDays) filters.expiringInDays = parseInt(expiringInDays);

    return this.mandatesService.findAll(req.user.sub, filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get mandate statistics' })
  getStats(@Request() req) {
    return this.mandatesService.getStats(req.user.sub);
  }

  @Get('check-expired')
  @ApiOperation({ summary: 'Check and update expired mandates' })
  checkExpired(@Request() req) {
    return this.mandatesService.checkExpiredMandates(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get mandate by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.mandatesService.findOne(id, req.user.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update mandate' })
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateMandateDto: UpdateMandateDto,
  ) {
    return this.mandatesService.update(id, req.user.sub, updateMandateDto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel mandate' })
  cancel(
    @Param('id') id: string,
    @Request() req,
    @Body('reason') reason: string,
  ) {
    return this.mandatesService.cancel(id, req.user.sub, reason);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete mandate' })
  remove(@Param('id') id: string, @Request() req) {
    return this.mandatesService.remove(id, req.user.sub);
  }
}
