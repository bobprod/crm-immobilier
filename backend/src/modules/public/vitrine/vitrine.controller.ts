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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { VitrineService } from './vitrine.service';
import { UpdateVitrineConfigDto, UpdatePublishedPropertyDto } from './dto';

@ApiTags('Vitrine Publique')
@Controller('vitrine')
export class VitrineController {
  constructor(private readonly vitrineService: VitrineService) {}

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

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('leads')
  @ApiOperation({ summary: 'Get leads captured via vitrine' })
  async getVitrineLeads(@Request() req) {
    return this.vitrineService.getVitrineLeads(req.user.userId);
  }

  // ============================================
  // ROUTES PUBLIQUES (Sans authentification)
  // ============================================

  @Get('public/:userId')
  @ApiOperation({ summary: 'Get public vitrine (no auth required)' })
  async getPublicVitrine(@Param('userId') userId: string) {
    return this.vitrineService.getPublicVitrine(userId);
  }
}
