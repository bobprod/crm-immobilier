export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export type CommandType =
  | 'search_properties'
  | 'search_prospects'
  | 'generate_report'
  | 'draft_email'
  | 'schedule_planning'
  | 'strategic_advice'
  | 'general_query';
