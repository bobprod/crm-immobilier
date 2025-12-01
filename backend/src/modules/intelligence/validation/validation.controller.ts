import {
  Controller,
  Get,
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
import { ValidationService } from './validation.service';
import { ValidationAIService } from './validation-ai.service';
import {
  ValidateEmailDto,
  ValidateEmailsDto,
  ValidatePhoneDto,
  AddToBlacklistDto,
  AddToWhitelistDto,
  ValidateEmailAIDto,
  DetectSpamAIDto,
  EnrichContactAIDto,
  ValidationHistoryFiltersDto,
} from './dto';

@ApiTags('Validation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('validation')
export class ValidationController {
  constructor(
    private validationService: ValidationService,
    private validationAIService: ValidationAIService,
  ) {}

  // ============================================
  // VALIDATION EMAIL
  // ============================================

  @Post('email')
  @ApiOperation({ summary: 'Valider un email' })
  async validateEmail(@Request() req, @Body() body: ValidateEmailDto) {
    return this.validationService.validateEmail(req.user.userId, body.email, body.prospectId);
  }

  @Post('emails')
  @ApiOperation({ summary: 'Valider plusieurs emails' })
  async validateEmails(@Request() req, @Body() body: ValidateEmailsDto) {
    return this.validationService.validateEmails(req.user.userId, body.emails);
  }

  // ============================================
  // VALIDATION TÉLÉPHONE
  // ============================================

  @Post('phone')
  @ApiOperation({ summary: 'Valider un téléphone' })
  async validatePhone(@Request() req, @Body() body: ValidatePhoneDto) {
    return this.validationService.validatePhone(req.user.userId, body.phone, body.prospectId);
  }

  // ============================================
  // BLACKLIST
  // ============================================

  @Get('blacklist')
  @ApiOperation({ summary: 'Obtenir la blacklist' })
  async getBlacklist(@Query('type') type?: string) {
    return this.validationService.getBlacklist(type);
  }

  @Post('blacklist')
  @ApiOperation({ summary: 'Ajouter à la blacklist' })
  async addToBlacklist(@Request() req, @Body() body: AddToBlacklistDto) {
    return this.validationService.addToBlacklist(
      body.type,
      body.value,
      body.reason,
      req.user.userId,
    );
  }

  @Delete('blacklist/:id')
  @ApiOperation({ summary: 'Retirer de la blacklist' })
  async removeFromBlacklist(@Param('id') id: string) {
    return this.validationService.removeFromBlacklist(id);
  }

  // ============================================
  // WHITELIST
  // ============================================

  @Get('whitelist')
  @ApiOperation({ summary: 'Obtenir la whitelist' })
  async getWhitelist(@Query('type') type?: string) {
    return this.validationService.getWhitelist(type);
  }

  @Post('whitelist')
  @ApiOperation({ summary: 'Ajouter à la whitelist' })
  async addToWhitelist(@Request() req, @Body() body: AddToWhitelistDto) {
    return this.validationService.addToWhitelist(body.type, body.value, req.user.userId);
  }

  // ============================================
  // HISTORIQUE & STATS
  // ============================================

  @Get('history')
  @ApiOperation({ summary: 'Historique des validations' })
  async getHistory(@Request() req, @Query() filters: ValidationHistoryFiltersDto) {
    return this.validationService.getValidationHistory(req.user.userId, filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques de validation' })
  async getStats(@Request() req) {
    return this.validationService.getValidationStats(req.user.userId);
  }

  // ============================================
  // VALIDATION AI
  // ============================================

  @Post('email/ai')
  @ApiOperation({ summary: 'Valider un email avec AI' })
  async validateEmailWithAI(@Request() req, @Body() body: ValidateEmailAIDto) {
    return this.validationAIService.validateEmailWithAI(req.user.userId, body.email, body.context);
  }

  @Post('spam/ai')
  @ApiOperation({ summary: 'Détecter spam avec AI' })
  async detectSpamWithAI(@Request() req, @Body() body: DetectSpamAIDto) {
    return this.validationAIService.detectSpamWithAI(
      req.user.userId,
      body.email,
      body.name,
      body.message,
    );
  }

  @Post('enrich/ai')
  @ApiOperation({ summary: 'Enrichir contact avec AI' })
  async enrichContactWithAI(@Request() req, @Body() body: EnrichContactAIDto) {
    return this.validationAIService.enrichContactDataWithAI(
      req.user.userId,
      body.email,
      body.phone,
      body.name,
    );
  }
}
