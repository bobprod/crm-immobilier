import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Image as ImageIcon, FileText, Smile, MoreVertical, Phone, Video } from 'lucide-react';
import { MessageBubble, TypingIndicator, DateSeparator } from './MessageBubble';
import { useMessages } from '../hooks/useMessages';
import { WhatsAppConversation } from '../types/whatsapp.types';
import { isSameDay, parseISO } from 'date-fns';

interface ChatInterfaceProps {
  conversation: WhatsAppConversation;
  onBack?: () => void;
}

/**
 * WhatsApp Chat Interface Component
 * Main chat UI with message list and input
 */
export const ChatInterface: React.FC<ChatInterfaceProps> = ({ conversation, onBack }) => {
  const {
    messages,
    isLoading,
    isSending,
    sendTextMessage,
    sendMediaMessage,
    uploadMedia,
    isUploading,
  } = useMessages(conversation.id);

  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message
  const handleSend = async () => {
    if (!messageText.trim() || isSending) return;

    try {
      await sendTextMessage({
        phoneNumber: conversation.phoneNumber,
        message: messageText.trim(),
      });
      setMessageText('');
    } catch (error: any) {
      alert(error.message || 'Erreur lors de l\'envoi du message');
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Upload file
      const mediaUrl = await uploadMedia(file);

      // Determine media type
      let mediaType: 'image' | 'document' | 'video' | 'audio' = 'document';
      if (file.type.startsWith('image/')) mediaType = 'image';
      else if (file.type.startsWith('video/')) mediaType = 'video';
      else if (file.type.startsWith('audio/')) mediaType = 'audio';

      // Send media message
      await sendMediaMessage({
        phoneNumber: conversation.phoneNumber,
        mediaUrl,
        type: mediaType,
        caption: file.name,
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      alert(error.message || 'Erreur lors de l\'envoi du fichier');
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups: { date: Date; messages: typeof messages }[] = [];
    let currentDate: Date | null = null;
    let currentGroup: typeof messages = [];

    messages.forEach((msg) => {
      const msgDate = parseISO(msg.timestamp as string);

      if (!currentDate || !isSameDay(currentDate, msgDate)) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate!, messages: currentGroup });
        }
        currentDate = msgDate;
        currentGroup = [msg];
      } else {
        currentGroup.push(msg);
      }
    });

    if (currentGroup.length > 0 && currentDate) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  };

  const messageGroups = groupMessagesByDate();

  // Get contact initials
  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                ←
              </button>
            )}

            {/* Avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold">
              {getInitials(conversation.contactName)}
            </div>

            {/* Contact Info */}
            <div>
              <h2 className="font-semibold text-gray-900">
                {conversation.contactName || 'Contact Inconnu'}
              </h2>
              <p className="text-xs text-gray-500">{conversation.phoneNumber}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Phone className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Video className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#e5ddd5]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d9d9d9' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="text-gray-500">Chargement des messages...</div>
          </div>
        ) : messageGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p>Aucun message</p>
            <p className="text-sm">Commencez la conversation</p>
          </div>
        ) : (
          messageGroups.map((group, index) => (
            <div key={index}>
              <DateSeparator date={group.date} />
              {group.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>
          ))
        )}

        {/* Typing indicator (mock) */}
        {false && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end gap-2">
          {/* Emoji Button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSending}
          >
            <Smile className="w-5 h-5 text-gray-600" />
          </button>

          {/* Attach Button */}
          <div className="relative">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSending || isUploading}
            >
              <Paperclip className="w-5 h-5 text-gray-600" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            />
          </div>

          {/* Message Input */}
          <div className="flex-1 relative">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tapez un message..."
              rows={1}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isSending}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!messageText.trim() || isSending}
            className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* File upload indicator */}
        {isUploading && (
          <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Envoi du fichier...
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Chat Empty State
 */
export const ChatEmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-500">
      <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
        <ImageIcon className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold mb-2">WhatsApp Chat</h3>
      <p className="text-sm">Sélectionnez une conversation pour commencer</p>
    </div>
  );
};
