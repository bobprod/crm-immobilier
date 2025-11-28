import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WordPressService } from './wordpress.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

@Controller('integrations/wordpress')
@UseGuards(JwtAuthGuard)
export class WordPressController {
  constructor(private readonly wordpressService: WordPressService) {}

  /**
   * Synchroniser une propriété vers WordPress
   */
  @Post('sync/property/:id')
  async syncProperty(@Param('id') id: string) {
    return this.wordpressService.syncProperty(id);
  }

  /**
   * Synchroniser toutes les propriétés de l'utilisateur
   */
  @Post('sync/properties/all')
  async syncAllProperties(@Request() req) {
    const userId = req.user.userId;
    return this.wordpressService.syncAllProperties(userId);
  }

  /**
   * Supprimer une propriété de WordPress
   */
  @Delete('property/:id')
  async deleteProperty(@Param('id') id: string) {
    return this.wordpressService.deleteProperty(id);
  }

  /**
   * Récupérer le statut de synchronisation
   */
  @Get('sync/status/:propertyId')
  async getSyncStatus(@Param('propertyId') propertyId: string) {
    return this.wordpressService.getSyncStatus(propertyId);
  }

  /**
   * Tester la connexion WordPress
   */
  @Post('test-connection')
  async testConnection(@Body() config: {
    url: string;
    username: string;
    password: string;
  }) {
    const isConnected = await this.wordpressService.testConnection(config);
    return {
      success: isConnected,
      message: isConnected
        ? 'Connexion WordPress réussie'
        : 'Échec de la connexion WordPress',
    };
  }
}
