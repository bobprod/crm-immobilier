import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ScrapingService } from './scraping.service';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { UpdateScrapingConfigDto } from './dto';

@Controller('scraping')
@UseGuards(JwtAuthGuard)
export class ScrapingController {
  constructor(private readonly scrapingService: ScrapingService) {}

  /**
   * Get scraping configuration for the authenticated user
   */
  @Get('config')
  async getConfig(@Request() req) {
    const userId = req.user.userId;
    return this.scrapingService.getScrapingConfig(userId);
  }

  /**
   * Update scraping configuration
   */
  @Post('config')
  async updateConfig(@Request() req, @Body() config: UpdateScrapingConfigDto) {
    const userId = req.user.userId;
    return this.scrapingService.updateScrapingConfig(userId, config);
  }

  /**
   * Test a scraping provider connection
   */
  @Get('test/:provider')
  async testProvider(@Request() req, @Param('provider') provider: string) {
    const userId = req.user.userId;
    return this.scrapingService.testProvider(userId, provider);
  }
}
