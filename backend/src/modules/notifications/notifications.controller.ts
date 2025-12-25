import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SmartNotificationsService } from './smart-notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly smartNotificationsService: SmartNotificationsService,
  ) {}

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
   * Supprimer une notification
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.notificationsService.deleteNotification(id);
  }

  // ============================================
  // 🤖 SMART AI NOTIFICATION ENDPOINTS
  // ============================================

  /**
   * Récupérer les préférences de notification de l'utilisateur
   */
  @Get('settings')
  @ApiOperation({ summary: 'Récupérer les préférences de notification' })
  async getSettings(@Request() req) {
    const userId = req.user.userId;
    return this.smartNotificationsService.getUserPreferences(userId);
  }

  /**
   * Mettre à jour les préférences de notification
   */
  @Put('settings')
  @ApiOperation({ summary: 'Mettre à jour les préférences de notification' })
  async updateSettings(@Request() req, @Body() data: any) {
    const userId = req.user.userId;
    return this.smartNotificationsService.updateUserPreferences(userId, data);
  }

  /**
   * Récupérer les statistiques par canal
   */
  @Get('analytics/channels')
  @ApiOperation({ summary: 'Statistiques par canal de notification' })
  async getChannelAnalytics(@Request() req, @Query('days') days?: string) {
    const userId = req.user.userId;
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.smartNotificationsService.getChannelStatistics(userId, daysNum);
  }

  /**
   * Tester la configuration Smart AI pour l'utilisateur
   */
  @Get('analytics/test')
  @ApiOperation({ summary: 'Tester la configuration Smart AI' })
  async testSmartConfiguration(@Request() req) {
    const userId = req.user.userId;

    // Récupérer les préférences
    const preferences = await this.smartNotificationsService.getUserPreferences(userId);

    // Tester si on peut envoyer maintenant
    const canSendNow = await this.smartNotificationsService.canSendNow(userId);
    const withinRateLimit = await this.smartNotificationsService.isWithinRateLimit(userId);

    // Tester le canal optimal pour différents types
    const optimalChannels = {
      appointment: await this.smartNotificationsService.selectOptimalChannel(userId, 'appointment'),
      task: await this.smartNotificationsService.selectOptimalChannel(userId, 'task'),
      lead: await this.smartNotificationsService.selectOptimalChannel(userId, 'lead'),
      system: await this.smartNotificationsService.selectOptimalChannel(userId, 'system'),
    };

    return {
      preferences,
      status: {
        canSendNow,
        withinRateLimit,
        aiOptimizationActive: preferences?.aiOptimization || false,
      },
      optimalChannels,
    };
  }

  /**
   * Récupérer les analytics globales
   */
  @Get('analytics')
  @ApiOperation({ summary: 'Analytics globales des notifications' })
  async getAnalytics(@Request() req, @Query('days') days?: string) {
    const userId = req.user.userId;
    const daysNum = days ? parseInt(days, 10) : 30;

    // Stats par canal
    const channelStats = await this.smartNotificationsService.getChannelStatistics(userId, daysNum);

    // Compter les notifications totales
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const totalNotifications = await this.notificationsService['prisma'].notification.count({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
    });

    const unreadCount = await this.notificationsService.countUnreadNotifications(userId);

    return {
      period: `${daysNum} days`,
      total: totalNotifications,
      unread: unreadCount,
      byChannel: channelStats,
    };
  }
}
