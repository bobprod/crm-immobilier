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
  Key,
  Brain,
} from 'lucide-react';

type TabType = 'profile' | 'api-keys' | 'llm' | 'security';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
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

  const renderTabButton = (tab: TabType, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <SettingsIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
          </div>
          <p className="text-gray-600">Gérez vos préférences et configuration</p>
        </div>

        {/* Message Display */}
        {message && (
          <Card className="mb-6 border-l-4 border-blue-500 bg-blue-50">
            <CardContent className="pt-6">
              <p className="text-blue-900">{message}</p>
            </CardContent>
          </Card>
        )}

        {/* Tabs Navigation */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {renderTabButton('profile', 'Profil', <User className="h-4 w-4" />)}
          {renderTabButton('api-keys', 'API Keys', <Key className="h-4 w-4" />)}
          {renderTabButton('llm', 'LLM/IA', <Brain className="h-4 w-4" />)}
          {renderTabButton('security', 'Sécurité', <Shield className="h-4 w-4" />)}
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* User Profile Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profil Utilisateur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Prénom</Label>
                      <Input
                        placeholder="Votre prénom"
                        defaultValue={user?.firstName || ''}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Nom</Label>
                      <Input
                        placeholder="Votre nom"
                        defaultValue={user?.lastName || ''}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      defaultValue={user?.email || ''}
                      disabled
                      className="mt-1 bg-gray-50"
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-4">
                    <Button type="button" variant="outline">
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Notifications Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-600">Recevoir des notifications par email</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-gray-600">Recevoir des notifications push</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Rappels des rendez-vous</p>
                    <p className="text-sm text-gray-600">Recevoir des rappels avant les rendez-vous</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 2: API Keys Configuration */}
        {activeTab === 'api-keys' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-amber-600" />
                  Configuration AI API Keys
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Gérez vos clés API pour les services d'IA
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>OpenAI API Key</Label>
                  <Input
                    type="password"
                    placeholder="sk-..."
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Votre clé API OpenAI pour accéder aux modèles d'IA
                  </p>
                </div>
                <div>
                  <Label>Anthropic API Key</Label>
                  <Input
                    type="password"
                    placeholder="sk-ant-..."
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Clé API pour Claude et autres modèles Anthropic
                  </p>
                </div>
                <div>
                  <Label>Google Gemini API Key</Label>
                  <Input
                    type="password"
                    placeholder="AIza..."
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Clé API Google pour Gemini et autres services
                  </p>
                </div>
                <div>
                  <Label>Firecrawl API Key</Label>
                  <Input
                    type="password"
                    placeholder="fcrawl-..."
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Clé API pour Firecrawl (web scraping avancé)
                  </p>
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline">
                    Annuler
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Enregistrer les clés API
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage & Billing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Appels API ce mois</p>
                    <p className="text-2xl font-bold mt-2">2,450</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Tokens utilisés</p>
                    <p className="text-2xl font-bold mt-2">125K</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Coût estimé</p>
                    <p className="text-2xl font-bold mt-2">$12.50</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 3: LLM/IA Configuration */}
        {activeTab === 'llm' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Configuration LLM / IA
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Paramétrez le modèle d'IA et ses préférences
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Modèle IA Principal</Label>
                  <select className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white">
                    <option>GPT-4o</option>
                    <option>Claude 3 Opus</option>
                    <option>Gemini 2.0</option>
                    <option>Mistral Large</option>
                  </select>
                </div>

                <div>
                  <Label>Température (Créativité)</Label>
                  <input type="range" min="0" max="2" step="0.1" defaultValue="0.7" className="w-full mt-1" />
                  <p className="text-xs text-gray-500 mt-1">
                    0 = Déterministe | 2 = Très créatif
                  </p>
                </div>

                <div>
                  <Label>Max Tokens par requête</Label>
                  <Input
                    type="number"
                    defaultValue="4000"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Système de prompt personnalisé</Label>
                  <textarea
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md min-h-[120px]"
                    placeholder="Entrez vos instructions système personnalisées..."
                    defaultValue="Tu es un assistant immobilier expert..."
                  />
                </div>

                <div className="space-y-3">
                  <Label>Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input type="checkbox" id="retry" defaultChecked className="h-4 w-4" />
                      <label htmlFor="retry" className="ml-2 text-sm">
                        Réessayer automatiquement en cas d'erreur
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="stream" defaultChecked className="h-4 w-4" />
                      <label htmlFor="stream" className="ml-2 text-sm">
                        Streaming des réponses
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="cache" className="h-4 w-4" />
                      <label htmlFor="cache" className="ml-2 text-sm">
                        Activer le cache des requêtes
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline">
                    Annuler
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Enregistrer la configuration
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Modèles Disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>✓ GPT-4o (4K tokens)</p>
                  <p>✓ Claude 3 Opus (100K tokens)</p>
                  <p>✓ Gemini 2.0 (100K tokens)</p>
                  <p>✓ Mistral Large (32K tokens)</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 4: Security */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Changer le mot de passe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div>
                    <Label>Mot de passe actuel</Label>
                    <Input
                      type="password"
                      placeholder="Entrez votre mot de passe actuel"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Nouveau mot de passe</Label>
                    <Input
                      type="password"
                      placeholder="Entrez un nouveau mot de passe"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Confirmer le mot de passe</Label>
                    <Input
                      type="password"
                      placeholder="Confirmez votre nouveau mot de passe"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-4">
                    <Button type="button" variant="outline">
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Changer le mot de passe
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sessions actives</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Chrome sur Windows</p>
                      <p className="text-sm text-gray-600">Dernière activité: il y a 5 minutes</p>
                    </div>
                    <Button variant="outline" className="text-red-600 hover:text-red-700">
                      Déconnecter
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Safari sur iPhone</p>
                      <p className="text-sm text-gray-600">Dernière activité: hier</p>
                    </div>
                    <Button variant="outline" className="text-red-600 hover:text-red-700">
                      Déconnecter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Authentification à deux facteurs (2FA)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Renforcez la sécurité de votre compte avec la 2FA
                </p>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Activer la 2FA
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-red-600">Zone Danger</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Supprimer définitivement votre compte et toutes les données associées
                </p>
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  Supprimer le compte
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
