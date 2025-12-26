import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { SmartFormsService } from './smart-forms.service';
import { FormSuggestionQueryDto } from './dto/form-suggestion.dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

@Controller('smart-forms')
@UseGuards(JwtAuthGuard)
export class SmartFormsController {
  constructor(private readonly smartFormsService: SmartFormsService) {}

  /**
   * Obtenir des suggestions pour un champ
   */
  @Get('suggestions')
  async getFieldSuggestions(
    @Request() req,
    @Query() query: FormSuggestionQueryDto,
  ) {
    const userId = req.user.userId;
    const suggestions = await this.smartFormsService.getFieldSuggestions(
      userId,
      query,
    );
    return {
      fieldName: query.fieldName,
      suggestions,
    };
  }

  /**
   * Auto-fill complet pour un prospect
   */
  @Get('autofill/prospect')
  async getProspectAutoFill(
    @Request() req,
    @Query('name') name: string,
  ) {
    const userId = req.user.userId;
    return this.smartFormsService.getProspectAutoFill(userId, name);
  }
}
