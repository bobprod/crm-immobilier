/**
 * WhatsApp Module - TypeScript Types
 * Corresponds to backend schema and DTOs
 */

// ══════════════════════════════════════════════════════════════════
// ENUMS
// ══════════════════════════════════════════════════════════════════

export enum WhatsAppProvider {
  META = 'meta',
  TWILIO = 'twilio',
}

export enum ConversationStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio',
  TEMPLATE = 'template',
  LOCATION = 'location',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export enum TemplateCategory {
  MARKETING = 'marketing',
  UTILITY = 'utility',
  AUTHENTICATION = 'authentication',
}

export enum TemplateStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// ══════════════════════════════════════════════════════════════════
// CONFIG TYPES
// ══════════════════════════════════════════════════════════════════

export interface WhatsAppConfig {
  id: string;
  userId?: string;
  agencyId?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  accessToken?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  provider: WhatsAppProvider;
  isActive: boolean;
  webhookUrl?: string;
  webhookSecret?: string;
  autoReplyEnabled: boolean;
  businessHoursOnly: boolean;
  businessHoursStart?: string;
  businessHoursEnd?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateWhatsAppConfigDto {
  provider: WhatsAppProvider;
  phoneNumberId?: string;
  businessAccountId?: string;
  accessToken?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  isActive?: boolean;
  autoReplyEnabled?: boolean;
  businessHoursOnly?: boolean;
  businessHoursStart?: string;
  businessHoursEnd?: string;
}

export interface UpdateWhatsAppConfigDto {
  isActive?: boolean;
  autoReplyEnabled?: boolean;
  businessHoursOnly?: boolean;
  businessHoursStart?: string;
  businessHoursEnd?: string;
  accessToken?: string;
  twilioAuthToken?: string;
}

// ══════════════════════════════════════════════════════════════════
// CONVERSATION TYPES
// ══════════════════════════════════════════════════════════════════

export interface WhatsAppConversation {
  id: string;
  configId: string;
  phoneNumber: string;
  contactName?: string;
  leadId?: string;
  prospectId?: string;
  userId?: string;
  agencyId?: string;
  status: ConversationStatus;
  assignedTo?: string;
  tags: string[];
  messageCount: number;
  unreadCount: number;
  lastMessageAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  messages?: WhatsAppMessage[];
  lastMessage?: WhatsAppMessage;
}

export interface GetConversationsFilters {
  status?: ConversationStatus;
  phoneNumber?: string;
  leadId?: string;
  prospectId?: string;
  assignedTo?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface UpdateConversationDto {
  status?: ConversationStatus;
  assignedTo?: string;
  tags?: string[];
}

export interface AssignConversationDto {
  userId: string;
}

// ══════════════════════════════════════════════════════════════════
// MESSAGE TYPES
// ══════════════════════════════════════════════════════════════════

export interface WhatsAppMessage {
  id: string;
  conversationId: string;
  messageId: string;
  direction: MessageDirection;
  type: MessageType;
  content: string;
  caption?: string;
  mediaUrl?: string;
  mimeType?: string;
  templateName?: string;
  templateParams?: any;
  status: MessageStatus;
  sentBy?: string;
  timestamp: Date | string;
  deliveredAt?: Date | string;
  readAt?: Date | string;
  failedReason?: string;
  metadata?: any;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SendTextMessageDto {
  phoneNumber: string;
  message: string;
  leadId?: string;
  prospectId?: string;
}

export interface SendMediaMessageDto {
  phoneNumber: string;
  mediaUrl: string;
  type: MessageType.IMAGE | MessageType.DOCUMENT | MessageType.VIDEO | MessageType.AUDIO;
  caption?: string;
  leadId?: string;
}

export interface SendTemplateMessageDto {
  phoneNumber: string;
  templateName: string;
  parameters: string[];
  language?: string;
  leadId?: string;
}

export interface SendBulkMessageDto {
  phoneNumbers: string[];
  message: string;
  delayMs?: number;
}

export interface MessageResponseDto {
  success: boolean;
  messageId?: string;
  conversationId?: string;
  error?: string;
}

export interface BulkMessageResponseDto {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    phoneNumber: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}

// ══════════════════════════════════════════════════════════════════
// TEMPLATE TYPES
// ══════════════════════════════════════════════════════════════════

export interface WhatsAppTemplate {
  id: string;
  configId: string;
  name: string;
  language: string;
  category: TemplateCategory;
  header?: string;
  body: string;
  footer?: string;
  buttons?: any;
  variables: string[];
  status: TemplateStatus;
  metaTemplateId?: string;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  lastUsedAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateTemplateDto {
  name: string;
  language: string;
  category: TemplateCategory;
  header?: string;
  body: string;
  footer?: string;
  buttons?: any;
  variables: string[];
}

export interface UpdateTemplateDto {
  header?: string;
  body?: string;
  footer?: string;
  buttons?: any;
}

// ══════════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ══════════════════════════════════════════════════════════════════

export interface WhatsAppStats {
  totalMessages: number;
  totalConversations: number;
  activeConversations: number;
  messagesReceived: number;
  messagesSent: number;
  responseRate: number;
  averageResponseTime: number; // in minutes
  templatesUsed: number;
  period: 'today' | '7days' | '30days' | '90days';
}

export interface MessageTrend {
  date: string;
  sent: number;
  received: number;
  total: number;
}

export interface TemplateStats {
  templateName: string;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  successRate: number;
}

// ══════════════════════════════════════════════════════════════════
// API RESPONSE WRAPPERS
// ══════════════════════════════════════════════════════════════════

export interface ConversationsResponse {
  conversations: WhatsAppConversation[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// ══════════════════════════════════════════════════════════════════
// UI HELPER TYPES
// ══════════════════════════════════════════════════════════════════

export interface ConfigWizardStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export interface QuickReply {
  id: string;
  text: string;
  category?: string;
}

export interface ConversationFilter {
  status?: ConversationStatus[];
  assignedTo?: string[];
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}
