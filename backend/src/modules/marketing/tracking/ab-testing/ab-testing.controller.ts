import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/core/auth/guards/jwt-auth.guard';
import { ABTestingService } from './ab-testing.service';

@ApiTags('A/B Testing')
@Controller('marketing-tracking/ab-tests')
export class ABTestingController {
  constructor(private readonly abTestingService: ABTestingService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new A/B test' })
  async createTest(
    @Request() req,
    @Body()
    body: {
      name: string;
      description?: string;
      variantA: any;
      variantB: any;
      trafficSplit: number;
      duration: number;
    },
  ) {
    return this.abTestingService.createABTest(req.user.userId, {
      name: body.name,
      description: body.description,
      variantA: body.variantA,
      variantB: body.variantB,
      trafficSplit: body.trafficSplit,
      duration: body.duration,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Get all A/B tests for the current user' })
  async getTests(@Request() req) {
    return this.abTestingService.getUserTests(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get A/B test details' })
  async getTest(@Request() req, @Param('id') testId: string) {
    // TODO: Vérifier que le test appartient bien à l'utilisateur
    const test = await this.abTestingService.getTestStats(testId);
    return test;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id/stats')
  @ApiOperation({ summary: 'Get A/B test statistics' })
  async getTestStats(@Request() req, @Param('id') testId: string) {
    return this.abTestingService.getTestStats(testId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(':id/stop')
  @ApiOperation({ summary: 'Stop an A/B test' })
  async stopTest(@Request() req, @Param('id') testId: string) {
    return this.abTestingService.stopTest(testId);
  }

  @Get(':testId/variant/:sessionId')
  @ApiOperation({
    summary: 'Get variant for a session (public endpoint for vitrines)',
  })
  async getVariant(
    @Param('testId') testId: string,
    @Param('sessionId') sessionId: string,
  ) {
    const variant = await this.abTestingService.getVariantForSession(
      testId,
      sessionId,
    );
    return { variant };
  }

  @Post(':testId/conversion')
  @ApiOperation({
    summary: 'Record a conversion for an A/B test (public endpoint)',
  })
  async recordConversion(
    @Param('testId') testId: string,
    @Body()
    body: {
      sessionId: string;
      eventName: string;
      value?: number;
    },
  ) {
    return this.abTestingService.recordConversion(
      testId,
      body.sessionId,
      body.eventName,
      body.value,
    );
  }
}
