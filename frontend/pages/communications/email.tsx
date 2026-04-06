import { useState } from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '@/shared/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Send, Mail, Users, FileText } from 'lucide-react';
import { apiClient } from '@/shared/utils/api-client-backend';

export default function EmailPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    body: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await apiClient.post('/communications/email', formData);
      setSuccess(true);
      setFormData({
        to: '',
        subject: '',
        body: '',
      });

      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Error sending email:', err);
      setError(err?.message || "Erreur lors de l'envoi de l'email");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Envoyer un Email</h1>
          <p className="text-gray-600 mt-1">Envoyez des emails à vos prospects et clients</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-green-800 font-medium">Email envoyé avec succès !</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Email Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="h-5 w-5 mr-2" />
              Composer un Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* To */}
              <div className="space-y-2">
                <Label htmlFor="to">Destinataire(s)</Label>
                <Input
                  id="to"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.to}
                  onChange={(e) => handleChange('to', e.target.value)}
                  required
                  disabled={loading}
                />
                <p className="text-sm text-gray-500">Séparez plusieurs emails par des virgules</p>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Objet</Label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="Objet de l'email"
                  value={formData.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Body */}
              <div className="space-y-2">
                <Label htmlFor="body">Message</Label>
                <Textarea
                  id="body"
                  placeholder="Votre message..."
                  value={formData.body}
                  onChange={(e) => handleChange('body', e.target.value)}
                  required
                  disabled={loading}
                  rows={10}
                  className="resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold">Prospects</h3>
                  <p className="text-sm text-gray-600">Envoyer aux prospects</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold">Modèles</h3>
                  <p className="text-sm text-gray-600">Utiliser un modèle</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Mail className="h-8 w-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold">Historique</h3>
                  <p className="text-sm text-gray-600">Voir les envois</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
