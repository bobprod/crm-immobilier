import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/shared/utils/backend-api';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import { io, Socket } from 'socket.io-client';
import {
  MessageCircle,
  Send,
  Plus,
  Search,
  Users,
  Circle,
  Loader2,
  X,
  ArrowLeft,
} from 'lucide-react';

const WS_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace('/api', '');

interface Participant {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Message {
  id: string;
  content: string;
  type: string;
  senderId: string;
  senderFirstName: string;
  senderLastName: string;
  createdAt: string;
  conversationId?: string;
}

interface Conversation {
  id: string;
  name: string | null;
  isGroup: boolean;
  participants: Participant[];
  lastMessage: { id: string; content: string; senderId: string; createdAt: string } | null;
  unreadCount: number;
  updatedAt: string;
}

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export function TeamChat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewConv, setShowNewConv] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchAgent, setSearchAgent] = useState('');
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [showMobileConvList, setShowMobileConvList] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Connexion WebSocket
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(`${WS_URL}/chat`, {
      query: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Chat WebSocket connecté');
    });

    socket.on('new_message', (msg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setConversations((prev) =>
        prev
          .map((c) => {
            if (c.id === msg.conversationId) {
              return {
                ...c,
                lastMessage: {
                  id: msg.id,
                  content: msg.content,
                  senderId: msg.senderId,
                  createdAt: msg.createdAt,
                },
                unreadCount: msg.senderId !== user?.id ? c.unreadCount + 1 : c.unreadCount,
                updatedAt: msg.createdAt,
              };
            }
            return c;
          })
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );
      setTimeout(scrollToBottom, 100);
    });

    socket.on('user_typing', (data: { conversationId: string; userId: string }) => {
      setTypingUsers((prev) => ({ ...prev, [data.userId]: data.conversationId }));
      setTimeout(() => {
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[data.userId];
          return next;
        });
      }, 3000);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [user?.id, scrollToBottom]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/chat/conversations');
      setConversations(data);
    } catch (err) {
      console.error('Erreur chargement conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    setShowMobileConvList(false);
    setLoadingMessages(true);

    try {
      const { data } = await apiClient.get(`/chat/conversations/${conv.id}/messages`);
      setMessages(data);
      setTimeout(scrollToBottom, 100);

      await apiClient.post(`/chat/conversations/${conv.id}/read`);
      socketRef.current?.emit('join_conversation', { conversationId: conv.id });
      socketRef.current?.emit('mark_read', { conversationId: conv.id });

      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error('Erreur chargement messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConv || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit('send_message', {
          conversationId: activeConv.id,
          content,
        });
      } else {
        await apiClient.post(`/chat/conversations/${activeConv.id}/messages`, { content });
      }
    } catch (err) {
      console.error('Erreur envoi message:', err);
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (!activeConv) return;
    socketRef.current?.emit('typing', { conversationId: activeConv.id });
  };

  const openNewConvModal = async () => {
    setShowNewConv(true);
    try {
      const { data } = await apiClient.get('/chat/agents');
      setAgents(data);
    } catch (err) {
      console.error('Erreur chargement agents:', err);
    }
  };

  const startConversation = async (agent: Agent) => {
    try {
      const { data } = await apiClient.post('/chat/conversations', {
        participantIds: [agent.id],
        isGroup: false,
      });
      setShowNewConv(false);
      setSearchAgent('');
      await loadConversations();
      openConversation(data);
    } catch (err) {
      console.error('Erreur création conversation:', err);
    }
  };

  const getConvName = (conv: Conversation) => {
    if (conv.name) return conv.name;
    if (!conv.isGroup && conv.participants) {
      const other = conv.participants.find((p) => p.userId !== user?.id);
      if (other) return `${other.firstName} ${other.lastName}`;
    }
    return conv.participants?.map((p) => p.firstName).join(', ') || 'Conversation';
  };

  const getConvInitials = (conv: Conversation) => {
    if (!conv.isGroup && conv.participants) {
      const other = conv.participants.find((p) => p.userId !== user?.id);
      if (other) return `${other.firstName?.[0] || ''}${other.lastName?.[0] || ''}`.toUpperCase();
    }
    return conv.isGroup ? 'GR' : '??';
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000 && d.getDate() === now.getDate()) {
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 604800000) {
      return d.toLocaleDateString('fr-FR', { weekday: 'short' });
    }
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  const filteredAgents = agents.filter((a) =>
    `${a.firstName} ${a.lastName} ${a.email}`.toLowerCase().includes(searchAgent.toLowerCase())
  );

  const activeTypingUsers = Object.entries(typingUsers)
    .filter(([, convId]) => convId === activeConv?.id)
    .map(([userId]) => {
      const p = activeConv?.participants?.find((p) => p.userId === userId);
      return p ? p.firstName : '';
    })
    .filter(Boolean);

  return (
    <div className="h-[calc(100vh-12rem)] flex bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
      {/* ========== SIDEBAR CONVERSATIONS ========== */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-gray-800 flex flex-col bg-gray-900/50 ${
          !showMobileConvList ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-400" />
              Messagerie Équipe
            </h2>
            <button
              onClick={openNewConvModal}
              className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              title="Nouvelle conversation"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500 px-4">
              <MessageCircle className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm text-center">Aucune conversation</p>
              <button
                onClick={openNewConvModal}
                className="mt-3 text-sm text-blue-400 hover:text-blue-300"
              >
                Démarrer une conversation
              </button>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => openConversation(conv)}
                className={`w-full p-3 flex items-center gap-3 hover:bg-gray-800/50 transition-colors text-left border-b border-gray-800/50 ${
                  activeConv?.id === conv.id ? 'bg-gray-800/70' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                    conv.isGroup
                      ? 'bg-purple-600/30 text-purple-300'
                      : 'bg-blue-600/30 text-blue-300'
                  }`}
                >
                  {conv.isGroup ? <Users className="h-4 w-4" /> : getConvInitials(conv)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-200 truncate">
                      {getConvName(conv)}
                    </span>
                    {conv.lastMessage && (
                      <span className="text-xs text-gray-500 shrink-0 ml-2">
                        {formatTime(conv.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-gray-500 truncate">
                      {conv.lastMessage?.content || 'Pas de messages'}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full min-w-[20px] text-center shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ========== ZONE DE MESSAGES ========== */}
      <div className={`flex-1 flex flex-col ${showMobileConvList ? 'hidden md:flex' : 'flex'}`}>
        {activeConv ? (
          <>
            <div className="p-4 border-b border-gray-800 flex items-center gap-3">
              <button
                onClick={() => {
                  setShowMobileConvList(true);
                  setActiveConv(null);
                }}
                className="md:hidden p-1 text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                  activeConv.isGroup
                    ? 'bg-purple-600/30 text-purple-300'
                    : 'bg-blue-600/30 text-blue-300'
                }`}
              >
                {activeConv.isGroup ? <Users className="h-4 w-4" /> : getConvInitials(activeConv)}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{getConvName(activeConv)}</h3>
                <p className="text-xs text-gray-500">
                  {activeConv.participants?.length || 0} participant(s)
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <p className="text-sm">Aucun message. Commencez la conversation !</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : 'bg-gray-800 text-gray-200 rounded-bl-md'
                        }`}
                      >
                        {!isMe && activeConv.isGroup && (
                          <p className="text-xs font-semibold text-blue-400 mb-1">
                            {msg.senderFirstName} {msg.senderLastName}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        <p
                          className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-gray-500'}`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              {activeTypingUsers.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="flex gap-0.5">
                    <Circle
                      className="h-1.5 w-1.5 fill-gray-500 animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <Circle
                      className="h-1.5 w-1.5 fill-gray-500 animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <Circle
                      className="h-1.5 w-1.5 fill-gray-500 animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </span>
                  {activeTypingUsers.join(', ')} écrit...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Écrire un message..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
                  className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <MessageCircle className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium text-gray-400">Messagerie Interne</p>
            <p className="text-sm mt-1">Sélectionnez une conversation ou créez-en une</p>
          </div>
        )}
      </div>

      {/* ========== MODAL NOUVELLE CONVERSATION ========== */}
      {showNewConv && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md shadow-2xl">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Nouvelle conversation</h3>
              <button
                onClick={() => {
                  setShowNewConv(false);
                  setSearchAgent('');
                }}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  value={searchAgent}
                  onChange={(e) => setSearchAgent(e.target.value)}
                  placeholder="Rechercher un agent..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div className="max-h-72 overflow-y-auto space-y-1">
                {filteredAgents.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-6">Aucun agent trouvé</p>
                ) : (
                  filteredAgents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => startConversation(agent)}
                      className="w-full p-3 flex items-center gap-3 rounded-lg hover:bg-gray-800 transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-sm font-semibold">
                        {agent.firstName?.[0]}
                        {agent.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-200">
                          {agent.firstName} {agent.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{agent.email}</p>
                      </div>
                      <span className="ml-auto text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded">
                        {agent.role}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
