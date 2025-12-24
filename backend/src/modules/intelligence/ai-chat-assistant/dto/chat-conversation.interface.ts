export interface ChatConversation {
  id: string;
  userId: string;
  title: string;
  context?: Record<string, any>;
  messageCount?: number;
  createdAt: string;
  updatedAt: string;
}
