import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  Logger,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Créer une nouvelle notification
   */
  @Post()
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.createNotification(createNotificationDto);
  }

  /**
   * Récupérer les notifications de l'utilisateur connecté
   */
  @Get()
  async findAll(@Request() req, @Query('limit') limit?: string) {
    const userId = req.user.userId;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.notificationsService.getUserNotifications(userId, limitNum);
  }

  /**
   * Récupérer les notifications paginées
   */
  @Get('paginated')
  async findPaginated(@Request() req, @Query() query: PaginationQueryDto) {
    const userId = req.user.userId;
    return this.notificationsService.getUserNotificationsPaginated(userId, query);
  }

  /**
   * Récupérer les notifications non lues
   */
  @Get('unread')
  async findUnread(@Request() req) {
    const userId = req.user.userId;
    return this.notificationsService.getUnreadNotifications(userId);
  }

  /**
   * Compter les notifications non lues
   */
  @Get('unread/count')
  async countUnread(@Request() req) {
    const userId = req.user.userId;
    const count = await this.notificationsService.countUnreadNotifications(userId);
    return { count };
  }

  /**
   * Marquer une notification comme lue
   */
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  @Patch('read-all')
  async markAllAsRead(@Request() req) {
    const userId = req.user.userId;
    return this.notificationsService.markAllAsRead(userId);
  }

  /**
   * Mettre à jour une notification
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto) {
    return this.notificationsService.updateNotification(id, updateNotificationDto);
  }

  /**
   * Supprimer une notification
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.notificationsService.deleteNotification(id);
  }

  /**
   * Restaurer une notification supprimée
   */
  @Patch(':id/restore')
  async restore(@Param('id') id: string) {
    return this.notificationsService.restoreNotification(id);
  }

  /**
   * Obtenir les statistiques de lecture
   */
  @Get('stats/reading')
  async getReadingStats(@Request() req) {
    const userId = req.user.userId;
    return this.notificationsService.getReadingStats(userId);
  }

  /**
   * Obtenir les paramètres de notification de l'utilisateur
   */
  @Get('settings')
  async getSettings(@Request() req) {
    const userId = req.user.userId;
    // Return default settings for now, can be extended to store in DB
    return {
      preferredChannel: 'push',
      optimalTimingEnabled: true,
      preferredHours: [9, 10, 11, 14, 15, 16],
      enablePush: true,
      enableEmail: true,
      enableSMS: false,
      enableWhatsApp: false,
      frequency: 'normal',
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
    };
  }

  /**
   * Sauvegarder les paramètres de notification
   */
  @Post('settings')
  async saveSettings(@Request() req, @Body() settings: any) {
    const userId = req.user.userId;
    // Save settings logic here (store in DB or cache)
    this.logger.log(`Settings saved for user ${userId}`);
    return { success: true, settings };
  }

  /**
   * Obtenir les statistiques d'engagement
   */
  @Get('stats/engagement')
  async getEngagementStats(@Request() req) {
    const userId = req.user.userId;
    const stats = await this.notificationsService.getEngagementStats(userId);
    return stats;
  }
}
