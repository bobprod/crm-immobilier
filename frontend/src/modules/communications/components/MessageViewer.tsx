import React from 'react';
import { Communication } from '../communications.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { Mail, MessageSquare, Phone, Calendar, User, ArrowRight } from 'lucide-react';

interface MessageViewerProps {
  message: Communication | null;
}

export function MessageViewer({ message }: MessageViewerProps) {
  if (!message) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed">
        <div className="text-center">
          <Mail className="h-12 w-12 mx-auto mb-2 opacity-20" />
          <p>Sélectionnez un message pour le lire</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">{message.subject || '(Sans sujet)'}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              {new Date(message.sentAt).toLocaleString()}
            </div>
          </div>
          <Badge variant="outline" className="capitalize">
            {message.status}
          </Badge>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-6 space-y-6">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">De:</span>
            <span className="bg-gray-100 px-2 py-1 rounded">{message.from || 'Système'}</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">À:</span>
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">{message.to}</span>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border min-h-[200px] whitespace-pre-wrap font-sans text-sm leading-relaxed">
          {message.body}
        </div>

        {message.prospectId && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-4 pt-4 border-t">
            <User className="h-3 w-3" />
            Lié au prospect ID: {message.prospectId}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
