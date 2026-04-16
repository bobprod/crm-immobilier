import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Lister les conversations d'un utilisateur avec dernier message et compteur non-lus
   */
  async getConversations(userId: string) {
    const conversations = await this.prisma.$queryRaw<any[]>(
      `
      SELECT
        c.id,
        c.name,
        c."isGroup",
        c."createdAt",
        c."updatedAt",
        (
          SELECT json_build_object('id', m.id, 'content', m.content, 'senderId', m."senderId", 'createdAt', m."createdAt")
          FROM chat_messages m
          WHERE m."conversationId" = c.id
          ORDER BY m."createdAt" DESC
          LIMIT 1
        ) AS "lastMessage",
        (
          SELECT COUNT(*)::int
          FROM chat_messages m
          WHERE m."conversationId" = c.id
            AND m."createdAt" > COALESCE(cp."lastReadAt", '1970-01-01')
            AND m."senderId" != $1
        ) AS "unreadCount",
        (
          SELECT json_agg(json_build_object(
            'userId', u.id,
            'firstName', u."firstName",
            'lastName', u."lastName",
            'email', u.email
          ))
          FROM chat_participants p2
          JOIN users u ON u.id = p2."userId"
          WHERE p2."conversationId" = c.id
        ) AS participants
      FROM chat_conversations c
      JOIN chat_participants cp ON cp."conversationId" = c.id AND cp."userId" = $1
      ORDER BY c."updatedAt" DESC
    `,
      userId,
    );

    return conversations;
  }

  /**
   * Créer une conversation (DM ou groupe)
   */
  async createConversation(
    userId: string,
    dto: { name?: string; participantIds: string[]; isGroup?: boolean },
  ) {
    const allParticipants = [...new Set([userId, ...dto.participantIds])];

    // Pour les DM (2 personnes), vérifier si une conversation existe déjà
    if (!dto.isGroup && allParticipants.length === 2) {
      const existing = await this.prisma.$queryRaw<any[]>(
        `
        SELECT c.id FROM chat_conversations c
        WHERE c."isGroup" = false
          AND (SELECT COUNT(*) FROM chat_participants p WHERE p."conversationId" = c.id) = 2
          AND EXISTS (SELECT 1 FROM chat_participants p WHERE p."conversationId" = c.id AND p."userId" = $1)
          AND EXISTS (SELECT 1 FROM chat_participants p WHERE p."conversationId" = c.id AND p."userId" = $2)
        LIMIT 1
      `,
        allParticipants[0],
        allParticipants[1],
      );

      if (existing.length > 0) {
        return this.getConversationById(existing[0].id, userId);
      }
    }

    const conversation = await this.prisma.chatConversation.create({
      data: {
        name: dto.name || null,
        isGroup: dto.isGroup || false,
        createdBy: userId,
      },
    });

    // Ajouter tous les participants
    for (const pId of allParticipants) {
      await this.prisma.chatParticipant.create({
        data: {
          conversationId: conversation.id,
          userId: pId,
        },
      });
    }

    return this.getConversationById(conversation.id, userId);
  }

  /**
   * Récupérer une conversation par ID avec vérification d'accès
   */
  async getConversationById(conversationId: string, userId: string) {
    const participant = await this.prisma.chatParticipant.findFirst({
      where: { conversationId, userId },
    });
    if (!participant)
      throw new ForbiddenException('Vous ne faites pas partie de cette conversation');

    const conversations = await this.prisma.$queryRaw<any[]>(
      `
      SELECT
        c.id, c.name, c."isGroup", c."createdAt", c."updatedAt",
        (
          SELECT json_agg(json_build_object(
            'userId', u.id, 'firstName', u."firstName", 'lastName', u."lastName", 'email', u.email
          ))
          FROM chat_participants p2
          JOIN users u ON u.id = p2."userId"
          WHERE p2."conversationId" = c.id
        ) AS participants,
        (
          SELECT COUNT(*)::int FROM chat_messages m
          WHERE m."conversationId" = c.id
            AND m."createdAt" > COALESCE($2::timestamp, '1970-01-01')
            AND m."senderId" != $3
        ) AS "unreadCount"
      FROM chat_conversations c
      JOIN chat_participants cp ON cp."conversationId" = c.id AND cp."userId" = $3
      WHERE c.id = $1
    `,
      conversationId,
      participant.lastReadAt,
      userId,
    );

    if (!conversations.length) throw new NotFoundException('Conversation introuvable');
    return conversations[0];
  }

  /**
   * Récupérer les messages d'une conversation (paginés)
   */
  async getMessages(conversationId: string, userId: string, take = 50, before?: string) {
    // Vérifier accès
    const participant = await this.prisma.chatParticipant.findFirst({
      where: { conversationId, userId },
    });
    if (!participant)
      throw new ForbiddenException('Vous ne faites pas partie de cette conversation');

    let messages: any[];
    if (before) {
      messages = await this.prisma.$queryRaw<any[]>(
        `
        SELECT m.id, m.content, m.type, m."senderId", m."createdAt",
          u."firstName" AS "senderFirstName", u."lastName" AS "senderLastName"
        FROM chat_messages m
        JOIN users u ON u.id = m."senderId"
        WHERE m."conversationId" = $1 AND m."createdAt" < (SELECT "createdAt" FROM chat_messages WHERE id = $3)
        ORDER BY m."createdAt" DESC
        LIMIT $2
      `,
        conversationId,
        take,
        before,
      );
    } else {
      messages = await this.prisma.$queryRaw<any[]>(
        `
        SELECT m.id, m.content, m.type, m."senderId", m."createdAt",
          u."firstName" AS "senderFirstName", u."lastName" AS "senderLastName"
        FROM chat_messages m
        JOIN users u ON u.id = m."senderId"
        WHERE m."conversationId" = $1
        ORDER BY m."createdAt" DESC
        LIMIT $2
      `,
        conversationId,
        take,
      );
    }

    return messages.reverse();
  }

  /**
   * Envoyer un message
   */
  async sendMessage(conversationId: string, senderId: string, content: string, type = 'text') {
    // Vérifier accès
    const participant = await this.prisma.chatParticipant.findFirst({
      where: { conversationId, userId: senderId },
    });
    if (!participant)
      throw new ForbiddenException('Vous ne faites pas partie de cette conversation');

    const message = await this.prisma.chatMessage.create({
      data: {
        conversationId,
        senderId,
        content,
        type,
      },
    });

    // Mettre à jour la date de la conversation
    await this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Récupérer les infos du sender
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { firstName: true, lastName: true },
    });

    // Récupérer les IDs des autres participants
    const participants = await this.prisma.chatParticipant.findMany({
      where: { conversationId },
    });

    return {
      ...message,
      senderFirstName: sender?.firstName,
      senderLastName: sender?.lastName,
      participantUserIds: participants.map((p: any) => p.userId),
    };
  }

  /**
   * Marquer les messages d'une conversation comme lus
   */
  async markAsRead(conversationId: string, userId: string) {
    await this.prisma.$executeRaw(
      `
      UPDATE chat_participants SET "lastReadAt" = NOW()
      WHERE "conversationId" = $1 AND "userId" = $2
    `,
      conversationId,
      userId,
    );
    return { success: true };
  }

  /**
   * Lister tous les agents (pour la création de conversations)
   */
  async getAgents(currentUserId: string) {
    const users = await this.prisma.user.findMany({
      where: { id: { not: currentUserId } },
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
      orderBy: { firstName: 'asc' },
    });
    return users;
  }

  /**
   * Compteur total de messages non lus
   */
  async getTotalUnread(userId: string) {
    const result = await this.prisma.$queryRaw<any[]>(
      `
      SELECT COALESCE(SUM(unread), 0)::int AS total FROM (
        SELECT COUNT(*) AS unread
        FROM chat_messages m
        JOIN chat_participants cp ON cp."conversationId" = m."conversationId" AND cp."userId" = $1
        WHERE m."senderId" != $1
          AND m."createdAt" > COALESCE(cp."lastReadAt", '1970-01-01')
      ) sub
    `,
      userId,
    );
    return { total: result[0]?.total || 0 };
  }
}
