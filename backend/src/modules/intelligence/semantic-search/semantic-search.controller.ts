import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { SemanticSearchService } from './semantic-search.service';
import { SemanticSearchQueryDto } from './dto/semantic-search.dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

@Controller('semantic-search')
@UseGuards(JwtAuthGuard)
export class SemanticSearchController {
  constructor(private readonly semanticSearchService: SemanticSearchService) {}

  /**
   * Effectuer une recherche sémantique
   */
  @Get()
  async search(@Request() req, @Query() query: SemanticSearchQueryDto) {
    const userId = req.user.userId;
    return this.semanticSearchService.semanticSearch(userId, query);
  }

  /**
   * Obtenir des suggestions de recherche
   */
  @Get('suggestions')
  async getSuggestions(
    @Request() req,
    @Query('q') partialQuery: string,
  ) {
    const userId = req.user.userId;
    return this.semanticSearchService.getSearchSuggestions(userId, partialQuery);
  }
}
