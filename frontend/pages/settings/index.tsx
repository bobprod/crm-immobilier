import { useState } from 'react';
import Layout from '../../src/modules/core/layout/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Search,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useRouter } from 'next/router';

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // TODO: Implémenter la sauvegarde
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage('Profil mis à jour avec succès');
    } catch (error) {
      setMessage('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            Paramètres
          </h1>
          <p className="text-gray-600 mt-1">Gérez vos préférences et votre compte</p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.includes('succès')
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        {/* Quick Links to Configuration Pages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="cursor-pointer" onClick={() => router.push('/settings/ai-api-keys')}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Search className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                      Clés API (BYOK)
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </h3>
                    <p className="text-sm text-gray-600">
                      Configurez vos clés API pour LLM (Claude, GPT) et Scraping (Pica, SERP, Firecrawl)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="cursor-pointer" onClick={() => router.push('/settings/llm-config')}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                      Configuration LLM / IA
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </h3>
                    <p className="text-sm text-gray-600">
                      Configurez les modèles d'IA pour l'analyse automatique et l'optimisation SEO
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Profil */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profil Utilisateur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input id="firstName" defaultValue={user?.firstName} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input id="lastName" defaultValue={user?.lastName} disabled={loading} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.email} disabled={loading} />
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notifications Email</p>
                  <p className="text-sm text-gray-600">Recevoir des alertes par email</p>
                </div>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notifications Push</p>
                  <p className="text-sm text-gray-600">Recevoir des notifications push</p>
                </div>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Rappels RDV</p>
                  <p className="text-sm text-gray-600">Rappels 24h avant les rendez-vous</p>
                </div>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sécurité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <Input id="currentPassword" type="password" placeholder="••••••••" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input id="newPassword" type="password" placeholder="••••••••" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" />
              </div>

              <Button>Changer le mot de passe</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
