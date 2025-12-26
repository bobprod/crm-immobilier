import { useEffect, useState, useRef } from 'react';
import Layout from '../../src/modules/core/layout/components/Layout';
import { apiClient } from '../../src/shared/utils/api-client-backend';

const DEFAULT_CONVERSATION_TITLE = 'Nouvelle conversation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  metadata?: any;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

export default function AIAssistant() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/ai-chat-assistant/conversations');
      setConversations(response.data);
      
      // If we have conversations but no current one, select the first
      if (response.data.length > 0 && !currentConversation) {
        await selectConversation(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = async () => {
    try {
      const response = await apiClient.post('/ai-chat-assistant/conversation', {
        title: DEFAULT_CONVERSATION_TITLE,
      });
      const newConv = response.data;
      setConversations([newConv, ...conversations]);
      setCurrentConversation(newConv);
      setMessages([]);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const selectConversation = async (conversation: Conversation) => {
    try {
      setCurrentConversation(conversation);
      setLoading(true);
      const response = await apiClient.get(`/ai-chat-assistant/messages/${conversation.id}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
      return;
    }
    
    try {
      await apiClient.delete(`/ai-chat-assistant/conversation/${conversationId}`);
      setConversations(conversations.filter(c => c.id !== conversationId));
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !currentConversation) {
      return;
    }

    const messageText = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    try {
      const response = await apiClient.post(
        `/ai-chat-assistant/message/${currentConversation.id}`,
        { message: messageText }
      );

      // Add both user and AI messages
      setMessages([...messages, response.data.userMessage, response.data.aiMessage]);
      
      // Update conversation message count locally
      setConversations(conversations.map(conv => 
        conv.id === currentConversation.id 
          ? { ...conv, messageCount: (conv.messageCount || 0) + 2, updatedAt: new Date().toISOString() }
          : conv
      ));
    } catch (error: any) {
      console.error('Error sending message:', error);
      // Re-add the message to input on error
      setInputMessage(messageText);
      // Show error to user
      alert(`Erreur lors de l'envoi du message: ${error.response?.data?.message || error.message || 'Erreur inconnue'}`);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-8rem)] flex gap-4">
        {/* Sidebar - Conversations List */}
        <div className="w-80 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">🤖 Copilot Immobilier</h2>
            </div>
            <button
              onClick={createNewConversation}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              + Nouvelle conversation
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && conversations.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>Aucune conversation</p>
                <p className="text-sm mt-1">Créez-en une nouvelle pour commencer</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                      currentConversation?.id === conv.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => selectConversation(conv)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {conv.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(conv.updatedAt)}
                          {conv.messageCount && ` • ${conv.messageCount} messages`}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        className="ml-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
          {currentConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">{currentConversation.title}</h3>
                <p className="text-sm text-gray-500">
                  Votre assistant IA personnel pour l'immobilier
                </p>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="text-6xl mb-4">🤖</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Bienvenue dans Copilot Immobilier
                    </h3>
                    <p className="text-gray-500 max-w-md">
                      Je suis votre assistant IA personnel. Posez-moi des questions sur vos
                      propriétés, prospects, ou demandez-moi de générer des rapports.
                    </p>
                    <div className="mt-6 grid grid-cols-2 gap-3 w-full max-w-2xl">
                      <div className="p-4 bg-gray-50 rounded-lg text-left">
                        <p className="font-medium text-sm text-gray-900">🏠 Recherche</p>
                        <p className="text-xs text-gray-500 mt-1">
                          "Trouve des appartements 3 pièces à La Marsa"
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg text-left">
                        <p className="font-medium text-sm text-gray-900">📊 Rapports</p>
                        <p className="text-xs text-gray-500 mt-1">
                          "Résume mes ventes du mois"
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg text-left">
                        <p className="font-medium text-sm text-gray-900">✉️ Emails</p>
                        <p className="text-xs text-gray-500 mt-1">
                          "Écris un email de suivi pour ce prospect"
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg text-left">
                        <p className="font-medium text-sm text-gray-900">💡 Conseils</p>
                        <p className="text-xs text-gray-500 mt-1">
                          "Comment négocier avec ce client ?"
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-4 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-lg">
                              {message.role === 'user' ? '👤' : '🤖'}
                            </span>
                            <div className="flex-1">
                              <p className="whitespace-pre-wrap">{message.content}</p>
                              <p
                                className={`text-xs mt-2 ${
                                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                                }`}
                              >
                                {formatTime(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {sending && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🤖</span>
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-200">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Posez votre question..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || sending}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    {sending ? '...' : 'Envoyer'}
                  </button>
                </form>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Astuce: Soyez précis dans vos questions pour de meilleurs résultats
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-gray-500">
                  Sélectionnez ou créez une conversation pour commencer
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
