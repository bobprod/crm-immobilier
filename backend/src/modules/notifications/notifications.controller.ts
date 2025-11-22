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
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
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
}
