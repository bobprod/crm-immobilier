import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  ArrowLeft,
  Key,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { apiClient } from '@/shared/utils/backend-api';

/**
 * API Keys Management (BYOK - Bring Your Own Keys)
 *
 * Rôles autorisés: ADMIN, SUPER_ADMIN
 */

interface ApiKey {
  id: string;
  provider: string;
  keyName: string;
  keyPreview: string;
  isActive: boolean;
  status: 'active' | 'inactive' | 'testing' | 'error';
  lastUsed?: string;
  createdAt: string;
}

const PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic (Claude)', icon: '🤖' },
  { id: 'openai', name: 'OpenAI (GPT)', icon: '🧠' },
  { id: 'google', name: 'Google (Gemini)', icon: '🔍' },
  { id: 'deepseek', name: 'DeepSeek', icon: '🚀' },
  { id: 'mistral', name: 'Mistral AI', icon: '🌪️' },
  { id: 'openrouter', name: 'OpenRouter', icon: '🔀' },
];

export default function APIKeysPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState({
    provider: '',
    keyName: '',
    apiKey: '',
  });

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await apiClient.get('/ai-billing/api-keys/user');
      const data = response.data ?? {};
      // Transform flat key object into display array
      const keys: ApiKey[] = Object.entries(data)
        .filter(([k, v]) => k.endsWith('ApiKey') && v)
        .map(([k, v], idx) => {
          const provider = k.replace('ApiKey', '');
          const val = v as string;
          return {
            id: String(idx + 1),
            provider,
            keyName: `${provider} key`,
            keyPreview: val.length > 8 ? `${val.slice(0, 4)}...${val.slice(-4)}` : '***',
            isActive: true,
            status: 'active' as const,
            createdAt: new Date().toISOString(),
          };
        });
      setApiKeys(keys);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      setLoading(false);
    }
  };

  const handleAddKey = async () => {
    try {
      await apiClient.put('/ai-billing/api-keys/user', {
        [`${newKey.provider}ApiKey`]: newKey.apiKey,
      });
      setShowAddDialog(false);
      setNewKey({ provider: '', keyName: '', apiKey: '' });
      fetchApiKeys();
    } catch (error) {
      console.error('Error adding API key:', error);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette clé API ?')) return;

    const key = apiKeys.find((k) => k.id === keyId);
    if (!key) return;

    try {
      await apiClient.put('/ai-billing/api-keys/user', {
        [`${key.provider}ApiKey`]: null,
      });
      fetchApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const handleTestKey = async (keyId: string) => {
    const key = apiKeys.find((k) => k.id === keyId);
    if (!key) return;
    try {
      await apiClient.post('/ai-billing/api-keys/validate', {
        provider: key.provider,
        apiKey: key.keyPreview,
      });
    } catch (error) {
      console.error('Error testing API key:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive'; icon: any }> = {
      active: { variant: 'default', icon: CheckCircle },
      inactive: { variant: 'secondary', icon: XCircle },
      testing: { variant: 'secondary', icon: AlertCircle },
      error: { variant: 'destructive', icon: XCircle },
    };

    const config = variants[status] || variants.inactive;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getProviderInfo = (providerId: string) => {
    return PROVIDERS.find((p) => p.id === providerId) || { id: providerId, name: providerId, icon: '🔑' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Clés API (BYOK) - Gestion</title>
      </Head>

      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/settings/ai-billing')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Clés API (BYOK)</h1>
              <p className="text-muted-foreground">
                Bring Your Own Keys - Utilisez vos propres clés API pour économiser
              </p>
            </div>
          </div>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une clé
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter une clé API</DialogTitle>
                <DialogDescription>
                  Configurez vos propres clés API pour réduire les coûts jusqu'à 30%
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Select
                    value={newKey.provider}
                    onValueChange={(value) =>
                      setNewKey({ ...newKey, provider: value })
                    }
                  >
                    <SelectTrigger id="provider">
                      <SelectValue placeholder="Sélectionnez un provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.icon} {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="keyName">Nom de la clé</Label>
                  <Input
                    id="keyName"
                    value={newKey.keyName}
                    onChange={(e) =>
                      setNewKey({ ...newKey, keyName: e.target.value })
                    }
                    placeholder="Production Key"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="apiKey">Clé API</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={newKey.apiKey}
                    onChange={(e) =>
                      setNewKey({ ...newKey, apiKey: e.target.value })
                    }
                    placeholder="sk-ant-api03-..."
                  />
                  <p className="text-xs text-muted-foreground">
                    La clé sera chiffrée et stockée en toute sécurité
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                >
                  Annuler
                </Button>
                <Button onClick={handleAddKey}>Ajouter</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Alert */}
        <Alert>
          <Key className="h-4 w-4" />
          <AlertDescription>
            <strong>BYOK (Bring Your Own Keys)</strong> vous permet d'utiliser vos propres clés API.
            Économisez jusqu'à 30% sur les coûts d'utilisation des LLM.
          </AlertDescription>
        </Alert>

        {/* API Keys Table */}
        <Card>
          <CardHeader>
            <CardTitle>Mes Clés API</CardTitle>
            <CardDescription>
              Gérez toutes vos clés API pour les différents providers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {apiKeys.length === 0 ? (
              <div className="text-center py-12">
                <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Aucune clé API configurée. Ajoutez votre première clé pour commencer.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Clé</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernière utilisation</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => {
                    const provider = getProviderInfo(key.provider);
                    return (
                      <TableRow key={key.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{provider.icon}</span>
                            <span className="font-medium">{provider.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{key.keyName}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <code className="text-sm">{key.keyPreview}</code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() =>
                                setShowKey(showKey === key.id ? null : key.id)
                              }
                            >
                              {showKey === key.id ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(key.status)}</TableCell>
                        <TableCell>
                          {key.lastUsed
                            ? new Date(key.lastUsed).toLocaleDateString('fr-FR')
                            : 'Jamais'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTestKey(key.id)}
                            >
                              Tester
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteKey(key.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>Avantages BYOK</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <h4 className="font-semibold">💰 Économies</h4>
                <p className="text-sm text-muted-foreground">
                  Jusqu'à 30% d'économies sur les coûts d'utilisation
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">🔒 Contrôle</h4>
                <p className="text-sm text-muted-foreground">
                  Gardez le contrôle total de vos clés et limites
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">⚡ Performance</h4>
                <p className="text-sm text-muted-foreground">
                  Accès direct aux API sans intermédiaire
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
