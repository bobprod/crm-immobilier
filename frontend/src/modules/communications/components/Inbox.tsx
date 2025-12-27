import React from 'react';
import { Communication } from '../communications.service';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Mail, MessageSquare, Phone, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { cn } from '@/shared/utils/utils';

interface InboxProps {
  messages: Communication[];
  onSelectMessage: (message: Communication) => void;
  selectedId?: string;
}

export function Inbox({ messages, onSelectMessage, selectedId }: InboxProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'whatsapp':
        return <Phone className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'opened':
        return 'bg-purple-100 text-purple-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-2 overflow-y-auto h-[600px] pr-2">
      {messages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Aucun message</div>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            onClick={() => onSelectMessage(msg)}
            className={cn(
              'p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50',
              selectedId === msg.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  {getIcon(msg.type)}
                  <span className="capitalize">{msg.type}</span>
                </Badge>
                <span className="text-xs text-gray-500">
                  {new Date(msg.sentAt).toLocaleDateString()}
                </span>
              </div>
              <Badge className={cn('text-xs', getStatusColor(msg.status))}>{msg.status}</Badge>
            </div>

            <h4 className="font-medium text-sm truncate">{msg.subject || '(Pas de sujet)'}</h4>

            <p className="text-xs text-gray-500 truncate mt-1">À: {msg.to}</p>
          </div>
        ))
      )}
    </div>
  );
}
