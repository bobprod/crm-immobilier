import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ScrapingService } from './scraping.service';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { UpdateScrapingConfigDto } from './dto';

@ApiTags('scraping')
@ApiBearerAuth()
@Controller('scraping')
@UseGuards(JwtAuthGuard)
export class ScrapingController {
  constructor(private readonly scrapingService: ScrapingService) {}

  /**
   * Get scraping configuration for the authenticated user
   */
  @Get('config')
  @ApiOperation({ summary: 'Get scraping configuration' })
  @ApiResponse({ status: 200, description: 'Returns the scraping configuration for the authenticated user' })
  async getConfig(@Request() req) {
    const userId = req.user.userId;
    return this.scrapingService.getScrapingConfig(userId);
  }

  /**
   * Update scraping configuration
   */
  @Post('config')
  @ApiOperation({ summary: 'Update scraping configuration' })
  @ApiResponse({ status: 200, description: 'Scraping configuration updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid configuration data' })
  async updateConfig(@Request() req, @Body() config: UpdateScrapingConfigDto) {
    const userId = req.user.userId;
    return this.scrapingService.updateScrapingConfig(userId, config);
  }

  /**
   * Test a scraping provider connection
   */
  @Get('test/:provider')
  @ApiOperation({ summary: 'Test a scraping provider connection' })
  @ApiParam({ name: 'provider', description: 'Provider name (pica, serpApi, scrapingBee, browserless)', enum: ['pica', 'serpApi', 'scrapingBee', 'browserless'] })
  @ApiResponse({ status: 200, description: 'Test result with success status and message' })
  async testProvider(@Request() req, @Param('provider') provider: string) {
    const userId = req.user.userId;
    return this.scrapingService.testProvider(userId, provider);
  }
}
