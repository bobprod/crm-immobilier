import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Mail, MessageSquare, Phone, AlertCircle } from 'lucide-react';
import { apiClient } from '@/shared/utils/api-client-backend';

interface Communication {
  id: string;
  type: 'email' | 'sms' | 'whatsapp';
  recipient: string;
  subject?: string;
  content: string;
  status: string;
  sentAt: string;
}

export default function CommunicationsPage() {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCommunications();
  }, []);

  const loadCommunications = async () => {
    try {
      setError(null);
      const response = await apiClient.get('/communications/history');
      setCommunications(response.data || []);
    } catch (error: any) {
      console.error('Erreur chargement communications:', error);
      setError('Impossible de charger l\'historique des communications.');
      setCommunications([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-5 w-5" />;
      case 'sms': return <MessageSquare className="h-5 w-5" />;
      case 'whatsapp': return <Phone className="h-5 w-5" />;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Communications</h1>
        <Button>Nouvelle communication</Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-800">{error}</p>
            <button
              onClick={loadCommunications}
              className="mt-2 text-sm text-yellow-600 hover:text-yellow-800 underline"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">Chargement des communications...</div>
        ) : communications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucune communication dans l'historique
          </div>
        ) : (
          communications.map((comm) => (
            <Card key={comm.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getIcon(comm.type)}
                    <div>
                      <CardTitle className="text-lg">{comm.recipient}</CardTitle>
                      {comm.subject && (
                        <p className="text-sm text-gray-600">{comm.subject}</p>
                      )}
                    </div>
                  </div>
                  <Badge>{comm.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{comm.content}</p>
                <p className="text-sm text-gray-400 mt-2">
                  {new Date(comm.sentAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
