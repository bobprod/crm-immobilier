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
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * 🔌 WebSocket Gateway pour les Notifications en Temps Réel
 *
 * Fonctionnalités:
 * - Connexion authentifiée (JWT via query param)
 * - Envoi notifications en temps réel
 * - Ping/Pong pour keep-alive
 * - Gestion multi-utilisateurs
 * - Rooms par userId
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set<socketId>

  constructor(private jwtService: JwtService) {}

  /**
   * Handler: Client connecté
   */
  async handleConnection(client: Socket) {
    try {
      // Extraire le token JWT du query param
      const token = client.handshake.query.token as string;

      if (!token) {
        this.logger.warn(`Client ${client.id} rejected: No token provided`);
        client.disconnect();
        return;
      }

      // Vérifier et décoder le token
      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.userId || payload.sub;

      if (!userId) {
        this.logger.warn(`Client ${client.id} rejected: Invalid token`);
        client.disconnect();
        return;
      }

      // Stocker le userId dans le socket pour référence
      client.data.userId = userId;

      // Ajouter le socket à la room du user
      client.join(`user:${userId}`);

      // Stocker la connexion dans la map
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      this.logger.log(`✅ Client ${client.id} connected (user: ${userId})`);

      // Envoyer un message de confirmation
      client.emit('connected', {
        message: 'Connected to notifications server',
        userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`❌ Connection error for client ${client.id}: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * Handler: Client déconnecté
   */
  handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId) {
      // Retirer de la map
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
        }
      }

      this.logger.log(`🔌 Client ${client.id} disconnected (user: ${userId})`);
    } else {
      this.logger.log(`🔌 Client ${client.id} disconnected (unauthenticated)`);
    }
  }

  /**
   * Handler: Ping (keep-alive)
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  /**
   * Handler: Mark notification as read
   */
  @SubscribeMessage('mark_read')
  handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    const userId = client.data.userId;
    this.logger.debug(`User ${userId} marked notification ${data.notificationId} as read`);

    // Émettre un événement de confirmation
    client.emit('notification_read', {
      notificationId: data.notificationId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 📤 Envoyer une notification à un utilisateur spécifique
   * Méthode publique appelée par NotificationsService
   */
  sendNotificationToUser(userId: string, notification: any) {
    const room = `user:${userId}`;

    // Envoyer à tous les sockets de cet utilisateur (multi-device)
    this.server.to(room).emit('notification', {
      type: 'notification',
      notification,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`📤 Notification sent to user ${userId} (room: ${room})`);
  }

  /**
   * 📡 Broadcaster une notification à tous les utilisateurs connectés
   * Utile pour les notifications système globales
   */
  broadcastNotification(notification: any) {
    this.server.emit('notification', {
      type: 'notification',
      notification,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`📡 Notification broadcasted to all users`);
  }

  /**
   * 📊 Obtenir le statut des connexions
   */
  getConnectionStats() {
    const totalUsers = this.userSockets.size;
    const totalConnections = Array.from(this.userSockets.values()).reduce(
      (sum, set) => sum + set.size,
      0,
    );

    return {
      totalUsers,
      totalConnections,
      avgConnectionsPerUser: totalUsers > 0 ? totalConnections / totalUsers : 0,
    };
  }

  /**
   * 🔍 Vérifier si un utilisateur est connecté
   */
  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  /**
   * 👤 Obtenir le nombre de connexions pour un utilisateur
   */
  getUserConnectionCount(userId: string): number {
    return this.userSockets.get(userId)?.size || 0;
  }
}
