import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { PriorityInboxService } from './priority-inbox.service';
import { PriorityInboxQueryDto } from './dto/priority-inbox.dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

@Controller('priority-inbox')
@UseGuards(JwtAuthGuard)
export class PriorityInboxController {
  constructor(private readonly priorityInboxService: PriorityInboxService) {}

  /**
   * Obtenir la boîte de réception prioritaire
   */
  @Get()
  async getPriorityInbox(
    @Request() req,
    @Query() query: PriorityInboxQueryDto,
  ) {
    const userId = req.user.userId;
    return this.priorityInboxService.getPriorityInbox(userId, query);
  }

  /**
   * Obtenir les statistiques de priorité
   */
  @Get('stats')
  async getPriorityStats(@Request() req) {
    const userId = req.user.userId;
    return this.priorityInboxService.getPriorityStats(userId);
  }
}
