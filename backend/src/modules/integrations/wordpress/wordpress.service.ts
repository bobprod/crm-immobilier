import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import axios, { AxiosInstance } from 'axios';

interface WordPressConfig {
  url: string;
  username: string;
  password: string; // Application password
}

interface WordPressProperty {
  title: string;
  content: string;
  status: 'publish' | 'draft' | 'pending';
  featured_media?: number;
  meta?: Record<string, any>;
  categories?: number[];
  tags?: number[];
}

@Injectable()
export class WordPressService {
  private readonly logger = new Logger(WordPressService.name);
  private wpClient: AxiosInstance | null = null;

  constructor(private prisma: PrismaService) {}

  /**
   * Initialiser le client WordPress avec les credentials
   */
  private initializeClient(config: WordPressConfig): AxiosInstance {
    const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');

    return axios.create({
      baseURL: `${config.url}/wp-json/wp/v2`,
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Synchroniser une propriété vers WordPress
   */
  async syncProperty(propertyId: string): Promise<any> {
    try {
      this.logger.log(`Syncing property ${propertyId} to WordPress`);

      // Récupérer la propriété
      const property = await this.prisma.property.findUnique({
        where: { id: propertyId },
        include: {
          user: {
            select: {
              wordpressUrl: true,
              wordpressUsername: true,
              wordpressPassword: true,
            },
          },
        },
      });

      if (!property) {
        throw new Error(`Property ${propertyId} not found`);
      }

      // Vérifier la configuration WordPress
      const { user } = property;
      if (!user.wordpressUrl || !user.wordpressUsername || !user.wordpressPassword) {
        throw new Error('WordPress configuration not found for user');
      }

      // Initialiser le client
      const client = this.initializeClient({
        url: user.wordpressUrl,
        username: user.wordpressUsername,
        password: user.wordpressPassword,
      });

      // Préparer les données pour WordPress
      const wpData: WordPressProperty = {
        title: property.title,
        content: this.generatePropertyContent(property),
        status: property.status === 'available' ? 'publish' : 'draft',
        meta: {
          price: property.price,
          surface: property.surface,
          rooms: property.rooms,
          address: property.address,
          city: property.city,
          zipCode: property.zipCode,
          type: property.type,
        },
      };

      // Vérifier si la propriété existe déjà dans WordPress
      const wordpressId = property.wordpressId;

      let response;
      if (wordpressId) {
        // Mise à jour
        this.logger.log(`Updating existing WordPress post ${wordpressId}`);
        response = await client.put(`/posts/${wordpressId}`, wpData);
      } else {
        // Création
        this.logger.log('Creating new WordPress post');
        response = await client.post('/posts', wpData);

        // Sauvegarder l'ID WordPress
        await this.prisma.property.update({
          where: { id: propertyId },
          data: { wordpressId: response.data.id.toString() },
        });
      }

      // Synchroniser les images
      if (property.images && property.images.length > 0) {
        await this.syncPropertyImages(client, response.data.id, property.images);
      }

      // Enregistrer le log de synchronisation
      await this.prisma.syncLog.create({
        data: {
          entityType: 'property',
          entityId: propertyId,
          platform: 'wordpress',
          status: 'success',
          externalId: response.data.id.toString(),
          syncedAt: new Date(),
        },
      });

      this.logger.log(`Property ${propertyId} successfully synced to WordPress`);
      return response.data;
    } catch (error) {
      this.logger.error(`Error syncing property to WordPress: ${error.message}`);

      // Enregistrer l'erreur dans les logs
      await this.prisma.syncLog.create({
        data: {
          entityType: 'property',
          entityId: propertyId,
          platform: 'wordpress',
          status: 'error',
          errorMessage: error.message,
          syncedAt: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Générer le contenu HTML pour WordPress
   */
  private generatePropertyContent(property: any): string {
    return `
      <div class="property-details">
        <h2>Description</h2>
        <p>${property.description || 'Aucune description disponible.'}</p>

        <h3>Caractéristiques</h3>
        <ul>
          <li><strong>Type:</strong> ${property.type}</li>
          <li><strong>Prix:</strong> ${property.price.toLocaleString()} €</li>
          <li><strong>Surface:</strong> ${property.surface} m²</li>
          <li><strong>Pièces:</strong> ${property.rooms}</li>
          ${property.bedrooms ? `<li><strong>Chambres:</strong> ${property.bedrooms}</li>` : ''}
          ${property.bathrooms ? `<li><strong>Salles de bain:</strong> ${property.bathrooms}</li>` : ''}
        </ul>

        <h3>Localisation</h3>
        <p>
          ${property.address}<br>
          ${property.zipCode} ${property.city}
        </p>

        ${
          property.features
            ? `
        <h3>Équipements</h3>
        <ul>
          ${property.features.map((f: string) => `<li>${f}</li>`).join('\n')}
        </ul>
        `
            : ''
        }
      </div>
    `;
  }

  /**
   * Synchroniser les images de la propriété
   */
  private async syncPropertyImages(
    client: AxiosInstance,
    postId: number,
    images: string[],
  ): Promise<void> {
    try {
      // TODO: Implémenter l'upload d'images vers WordPress Media Library
      // Pour l'instant, on log seulement
      this.logger.log(`Should sync ${images.length} images for post ${postId}`);

      // Exemple d'implémentation:
      // const mediaIds = await Promise.all(
      //   images.map(imageUrl => this.uploadImageToWordPress(client, imageUrl))
      // );
      //
      // if (mediaIds.length > 0) {
      //   await client.put(`/posts/${postId}`, {
      //     featured_media: mediaIds[0]
      //   });
      // }
    } catch (error) {
      this.logger.error(`Error syncing images: ${error.message}`);
    }
  }

  /**
   * Supprimer une propriété de WordPress
   */
  async deleteProperty(propertyId: string): Promise<void> {
    try {
      const property = await this.prisma.property.findUnique({
        where: { id: propertyId },
        include: {
          user: {
            select: {
              wordpressUrl: true,
              wordpressUsername: true,
              wordpressPassword: true,
            },
          },
        },
      });

      if (!property?.wordpressId) {
        this.logger.log(`Property ${propertyId} not synced to WordPress, skipping delete`);
        return;
      }

      const client = this.initializeClient({
        url: property.user.wordpressUrl,
        username: property.user.wordpressUsername,
        password: property.user.wordpressPassword,
      });

      await client.delete(`/posts/${property.wordpressId}`);
      this.logger.log(`Property ${propertyId} deleted from WordPress`);

      // Nettoyer l'ID WordPress
      await this.prisma.property.update({
        where: { id: propertyId },
        data: { wordpressId: null },
      });
    } catch (error) {
      this.logger.error(`Error deleting property from WordPress: ${error.message}`);
      throw error;
    }
  }

  /**
   * Synchroniser toutes les propriétés d'un utilisateur
   */
  async syncAllProperties(userId: string): Promise<void> {
    try {
      const properties = await this.prisma.property.findMany({
        where: {
          userId,
          status: 'available',
        },
      });

      this.logger.log(`Syncing ${properties.length} properties for user ${userId}`);

      const results = await Promise.allSettled(
        properties.map((property) => this.syncProperty(property.id)),
      );

      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      this.logger.log(`Sync completed: ${succeeded} succeeded, ${failed} failed`);
    } catch (error) {
      this.logger.error(`Error syncing all properties: ${error.message}`);
      throw error;
    }
  }

  /**
   * Récupérer le statut de synchronisation d'une propriété
   */
  async getSyncStatus(propertyId: string): Promise<any> {
    const logs = await this.prisma.syncLog.findMany({
      where: {
        entityType: 'property',
        entityId: propertyId,
        platform: 'wordpress',
      },
      orderBy: { syncedAt: 'desc' },
      take: 10,
    });

    return {
      lastSync: logs[0]?.syncedAt || null,
      status: logs[0]?.status || 'never_synced',
      history: logs,
    };
  }

  /**
   * Tester la connexion WordPress
   */
  async testConnection(config: WordPressConfig): Promise<boolean> {
    try {
      const client = this.initializeClient(config);
      await client.get('/posts?per_page=1');
      return true;
    } catch (error) {
      this.logger.error(`WordPress connection test failed: ${error.message}`);
      return false;
    }
  }
}
