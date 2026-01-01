import React from 'react';
import { Check, CheckCheck, Clock, XCircle, Image, FileText, Video, Music, Download } from 'lucide-react';
import { WhatsAppMessage, MessageDirection, MessageStatus, MessageType } from '../types/whatsapp.types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MessageBubbleProps {
  message: WhatsAppMessage;
  showSender?: boolean;
}

/**
 * WhatsApp Message Bubble Component
 * Displays a single message with status indicators
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, showSender = false }) => {
  const isOutbound = message.direction === MessageDirection.OUTBOUND;
  const isInbound = message.direction === MessageDirection.INBOUND;

  // Format timestamp
  const formatTime = (date: string | Date) => {
    return format(new Date(date), 'HH:mm', { locale: fr });
  };

  // Render status icon (only for outbound messages)
  const renderStatusIcon = () => {
    if (isInbound) return null;

    switch (message.status) {
      case MessageStatus.SENT:
        return <Check className="w-4 h-4 text-gray-400" />;
      case MessageStatus.DELIVERED:
        return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case MessageStatus.READ:
        return <CheckCheck className="w-4 h-4 text-blue-500" />;
      case MessageStatus.FAILED:
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  // Render media preview
  const renderMedia = () => {
    if (!message.mediaUrl) return null;

    switch (message.type) {
      case MessageType.IMAGE:
        return (
          <div className="mb-2">
            <img
              src={message.mediaUrl}
              alt={message.caption || 'Image'}
              className="max-w-xs rounded-lg"
              loading="lazy"
            />
          </div>
        );

      case MessageType.VIDEO:
        return (
          <div className="mb-2">
            <video
              src={message.mediaUrl}
              controls
              className="max-w-xs rounded-lg"
            >
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          </div>
        );

      case MessageType.AUDIO:
        return (
          <div className="mb-2 flex items-center gap-3 p-3 bg-gray-100 rounded-lg max-w-xs">
            <Music className="w-6 h-6 text-gray-600" />
            <audio src={message.mediaUrl} controls className="flex-1">
              Votre navigateur ne supporte pas la lecture audio.
            </audio>
          </div>
        );

      case MessageType.DOCUMENT:
        return (
          <div className="mb-2">
            <a
              href={message.mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-gray-100 hover:bg-gray-200 rounded-lg max-w-xs transition-colors"
            >
              <FileText className="w-8 h-8 text-gray-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {message.caption || 'Document'}
                </p>
                <p className="text-xs text-gray-500">{message.mimeType}</p>
              </div>
              <Download className="w-5 h-5 text-gray-600 flex-shrink-0" />
            </a>
          </div>
        );

      default:
        return null;
    }
  };

  // Render template message
  const renderTemplateContent = () => {
    if (message.type !== MessageType.TEMPLATE) return null;

    return (
      <div className="mb-1">
        <div className="text-xs text-gray-500 mb-1">
          Template: {message.templateName}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {/* Sender name (if shown) */}
        {showSender && message.sentBy && (
          <span className="text-xs text-gray-500 mb-1 px-2">
            {message.sentBy}
          </span>
        )}

        {/* Message bubble */}
        <div
          className={`rounded-lg px-4 py-2 ${
            isOutbound
              ? 'bg-green-500 text-white rounded-br-none'
              : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
          }`}
        >
          {/* Template indicator */}
          {renderTemplateContent()}

          {/* Media */}
          {renderMedia()}

          {/* Text content */}
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {/* Caption for media */}
          {message.caption && message.type !== MessageType.TEXT && (
            <p className="text-sm mt-2 whitespace-pre-wrap break-words">
              {message.caption}
            </p>
          )}

          {/* Timestamp and status */}
          <div className={`flex items-center gap-1 mt-1 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-xs ${isOutbound ? 'text-green-100' : 'text-gray-500'}`}>
              {formatTime(message.timestamp)}
            </span>
            {renderStatusIcon()}
          </div>
        </div>

        {/* Failed reason */}
        {message.status === MessageStatus.FAILED && message.failedReason && (
          <span className="text-xs text-red-500 mt-1 px-2">
            Échec: {message.failedReason}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Typing Indicator Component
 */
export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-white border border-gray-200 rounded-lg rounded-bl-none px-4 py-3">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

/**
 * Date Separator Component
 */
interface DateSeparatorProps {
  date: Date | string;
}

export const DateSeparator: React.FC<DateSeparatorProps> = ({ date }) => {
  const formattedDate = format(new Date(date), 'EEEE d MMMM yyyy', { locale: fr });

  return (
    <div className="flex items-center justify-center my-4">
      <div className="bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
        {formattedDate}
      </div>
    </div>
  );
};
