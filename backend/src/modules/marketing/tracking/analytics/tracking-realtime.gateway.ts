import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * WebSocket Gateway pour le tracking en temps réel
 *
 * Permet aux dashboards CRM de recevoir les événements de tracking
 * en temps réel sans polling HTTP.
 *
 * Usage frontend:
 * const socket = io('http://localhost:3000', {
 *   auth: { token: 'JWT_TOKEN' }
 * });
 *
 * socket.on('tracking:new-event', (event) => {
 *   console.log('Nouvel événement:', event);
 * });
 */
@WebSocketGateway({
  cors: {
    origin: '*', // À restreindre en production
    credentials: true,
  },
  namespace: '/tracking-realtime',
})
@Injectable()
export class TrackingRealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingRealtimeGateway.name);
  private connectedClients = new Map<string, { socket: Socket; userId: string }>();

  constructor(private readonly jwtService: JwtService) {}

  /**
   * Gérer la connexion d'un client
   */
  async handleConnection(client: Socket) {
    try {
      // Authentification via JWT token
      const token = client.handshake.auth.token || client.handshake.headers.authorization;

      if (!token) {
        this.logger.warn(`Client ${client.id} rejected: no token`);
        client.disconnect();
        return;
      }

      // Vérifier le token
      const payload = await this.jwtService.verifyAsync(token.replace('Bearer ', ''));
      const userId = payload.userId || payload.sub;

      if (!userId) {
        this.logger.warn(`Client ${client.id} rejected: invalid token`);
        client.disconnect();
        return;
      }

      // Stocker la connexion
      this.connectedClients.set(client.id, { socket: client, userId });

      // Joindre la room de l'utilisateur
      client.join(`user:${userId}`);

      this.logger.log(
        `Client ${client.id} connected (userId: ${userId}). Total clients: ${this.connectedClients.size}`,
      );

      // Envoyer confirmation de connexion
      client.emit('tracking:connected', {
        message: 'Successfully connected to tracking realtime',
        userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error.message);
      client.disconnect();
    }
  }

  /**
   * Gérer la déconnexion d'un client
   */
  handleDisconnect(client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);

    if (clientInfo) {
      this.logger.log(
        `Client ${client.id} disconnected (userId: ${clientInfo.userId}). Remaining: ${this.connectedClients.size - 1}`,
      );
      this.connectedClients.delete(client.id);
    }
  }

  /**
   * Permettre au client de s'abonner à des événements spécifiques
   */
  @SubscribeMessage('tracking:subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { platforms?: string[]; eventTypes?: string[] },
  ) {
    const clientInfo = this.connectedClients.get(client.id);

    if (!clientInfo) {
      return { error: 'Not authenticated' };
    }

    // Joindre les rooms spécifiques
    if (data.platforms) {
      data.platforms.forEach((platform) => {
        client.join(`platform:${platform}`);
      });
    }

    if (data.eventTypes) {
      data.eventTypes.forEach((eventType) => {
        client.join(`event:${eventType}`);
      });
    }

    this.logger.log(`Client ${client.id} subscribed to filters:`, data);

    return {
      success: true,
      message: 'Subscribed to filters',
      filters: data,
    };
  }

  /**
   * Permettre au client de se désabonner
   */
  @SubscribeMessage('tracking:unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { platforms?: string[]; eventTypes?: string[] },
  ) {
    if (data.platforms) {
      data.platforms.forEach((platform) => {
        client.leave(`platform:${platform}`);
      });
    }

    if (data.eventTypes) {
      data.eventTypes.forEach((eventType) => {
        client.leave(`event:${eventType}`);
      });
    }

    return { success: true, message: 'Unsubscribed from filters' };
  }

  /**
   * Ping/Pong pour garder la connexion active
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', data: { timestamp: new Date().toISOString() } };
  }

  /**
   * Émettre un nouvel événement de tracking à tous les clients concernés
   */
  emitTrackingEvent(event: {
    userId: string;
    platform: string;
    eventName: string;
    eventData: any;
    timestamp: Date;
    id: string;
  }) {
    // Émettre à l'utilisateur spécifique
    this.server.to(`user:${event.userId}`).emit('tracking:new-event', {
      id: event.id,
      platform: event.platform,
      eventName: event.eventName,
      eventData: event.eventData,
      timestamp: event.timestamp,
    });

    // Émettre aussi aux rooms filtrées
    this.server.to(`platform:${event.platform}`).emit('tracking:new-event', event);
    this.server.to(`event:${event.eventName}`).emit('tracking:new-event', event);

    this.logger.debug(
      `Emitted event ${event.eventName} for user ${event.userId} on platform ${event.platform}`,
    );
  }

  /**
   * Émettre une mise à jour des statistiques
   */
  emitStatsUpdate(userId: string, stats: any) {
    this.server.to(`user:${userId}`).emit('tracking:stats-update', stats);
  }

  /**
   * Émettre une alerte/anomalie
   */
  emitAlert(userId: string, alert: { severity: string; message: string; data?: any }) {
    this.server.to(`user:${userId}`).emit('tracking:alert', {
      ...alert,
      timestamp: new Date().toISOString(),
    });

    this.logger.warn(`Alert emitted for user ${userId}: ${alert.message}`);
  }

  /**
   * Obtenir le nombre de clients connectés
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Obtenir les clients connectés pour un utilisateur
   */
  getClientsByUserId(userId: string): Socket[] {
    const clients: Socket[] = [];

    this.connectedClients.forEach((clientInfo) => {
      if (clientInfo.userId === userId) {
        clients.push(clientInfo.socket);
      }
    });

    return clients;
  }

  /**
   * Broadcast un message à tous les clients connectés (admin only)
   */
  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.log(`Broadcasted ${event} to all clients`);
  }
}
