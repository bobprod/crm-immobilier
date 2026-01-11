import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Switch } from '@/shared/components/ui/switch';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  Trash2,
  Edit,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  Activity,
  AlertTriangle,
  Info,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import {
  llmRouterAPI,
  AVAILABLE_PROVIDERS,
  OPERATION_TYPES,
  type UserLlmProvider,
  type ProviderName,
  type OperationType,
  type DashboardMetrics,
  type BudgetCheck,
} from '@/shared/utils/llm-router-api';

export default function LLMRouterPage() {
  // ============================================
  // STATE
  // ============================================
  const [providers, setProviders] = useState<UserLlmProvider[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [budget, setBudget] = useState<BudgetCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('providers');

  // Provider management
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<UserLlmProvider | null>(null);
  const [formData, setFormData] = useState({
    provider: '' as ProviderName,
    apiKey: '',
    model: '',
    priority: 0,
    monthlyBudget: 0,
  });

  // Loading states
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadMetrics();
    } else if (activeTab === 'budget') {
      loadBudget();
    }
  }, [activeTab]);

  // ============================================
  // DATA LOADING
  // ============================================
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await llmRouterAPI.getUserProviders();
      setProviders(data);
    } catch (error) {
      console.error('Erreur chargement providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const data = await llmRouterAPI.getDashboardMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Erreur chargement métriques:', error);
    }
  };

  const loadBudget = async () => {
    try {
      const data = await llmRouterAPI.checkBudget();
      setBudget(data);
    } catch (error) {
      console.error('Erreur chargement budget:', error);
    }
  };

  // ============================================
  // PROVIDER CRUD
  // ============================================
  const handleAddProvider = async () => {
    try {
      setSaving(true);
      await llmRouterAPI.addProvider(formData);
      await loadData();
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Erreur ajout provider:', error);
      alert(error.response?.data?.message || 'Erreur lors de l\'ajout du provider');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProvider = async () => {
    if (!selectedProvider) return;

    try {
      setSaving(true);
      await llmRouterAPI.updateProvider(selectedProvider.provider as ProviderName, {
        apiKey: formData.apiKey || undefined,
        model: formData.model || undefined,
        priority: formData.priority,
        monthlyBudget: formData.monthlyBudget,
      });
      await loadData();
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Erreur mise à jour provider:', error);
      alert(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProvider = async (provider: ProviderName) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le provider ${provider} ?`)) {
      return;
    }

    try {
      setDeleting(provider);
      await llmRouterAPI.deleteProvider(provider);
      await loadData();
    } catch (error: any) {
      console.error('Erreur suppression provider:', error);
      alert(error.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  const handleTestProvider = async (provider: ProviderName) => {
    try {
      setTesting(provider);
      const result = await llmRouterAPI.testProvider(provider);
      if (result.success) {
        alert(`✅ ${result.message}`);
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error: any) {
      console.error('Erreur test provider:', error);
      alert('Erreur lors du test du provider');
    } finally {
      setTesting(null);
    }
  };

  const handleToggleActive = async (provider: UserLlmProvider) => {
    try {
      await llmRouterAPI.updateProvider(provider.provider as ProviderName, {
        isActive: !provider.isActive,
      });
      await loadData();
    } catch (error: any) {
      console.error('Erreur toggle active:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  // ============================================
  // HELPERS
  // ============================================
  const resetForm = () => {
    setFormData({
      provider: '' as ProviderName,
      apiKey: '',
      model: '',
      priority: 0,
      monthlyBudget: 0,
    });
    setSelectedProvider(null);
  };

  const openEditDialog = (provider: UserLlmProvider) => {
    setSelectedProvider(provider);
    setFormData({
      provider: provider.provider as ProviderName,
      apiKey: '', // Ne pas pré-remplir pour sécurité
      model: provider.model || '',
      priority: provider.priority,
      monthlyBudget: provider.monthlyBudget || 0,
    });
    setIsEditDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  // ============================================
  // RENDER
  // ============================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8" />
          LLM Router - Gestion Intelligente Multi-Providers
        </h1>
        <p className="text-gray-600 mt-2">
          Configurez plusieurs providers LLM et laissez le système choisir automatiquement le
          meilleur selon l'opération
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="providers">
            <Zap className="h-4 w-4 mr-2" />
            Mes Providers ({providers.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="budget">
            <DollarSign className="h-4 w-4 mr-2" />
            Budget
          </TabsTrigger>
          <TabsTrigger value="suggestions">
            <Activity className="h-4 w-4 mr-2" />
            Suggestions
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: MES PROVIDERS */}
        <TabsContent value="providers">
          <div className="space-y-4">
            {/* Bouton ajouter */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Providers Configurés</h2>
                <p className="text-sm text-gray-600">
                  Le système sélectionnera automatiquement le meilleur provider selon le type
                  d'opération
                </p>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un provider
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Ajouter un Provider LLM</DialogTitle>
                    <DialogDescription>
                      Configurez un nouveau provider pour votre compte
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Provider</Label>
                      <Select
                        value={formData.provider}
                        onValueChange={(value) =>
                          setFormData({ ...formData, provider: value as ProviderName })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(AVAILABLE_PROVIDERS).map(([id, info]) => (
                            <SelectItem key={id} value={id}>
                              {info.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.provider && (
                      <>
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            <strong>{AVAILABLE_PROVIDERS[formData.provider].name}</strong>
                            <br />
                            {AVAILABLE_PROVIDERS[formData.provider].description}
                            <br />
                            <span className="text-gray-600">
                              Tarif: {AVAILABLE_PROVIDERS[formData.provider].pricing}
                            </span>
                          </AlertDescription>
                        </Alert>

                        <div>
                          <Label>Clé API</Label>
                          <Input
                            type="password"
                            placeholder={AVAILABLE_PROVIDERS[formData.provider].keyFormat}
                            value={formData.apiKey}
                            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label>Modèle (optionnel)</Label>
                          <Select
                            value={formData.model}
                            onValueChange={(value) => setFormData({ ...formData, model: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Modèle par défaut" />
                            </SelectTrigger>
                            <SelectContent>
                              {AVAILABLE_PROVIDERS[formData.provider].models.map((model) => (
                                <SelectItem key={model} value={model}>
                                  {model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Priorité (0 = plus haute priorité)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData.priority}
                            onChange={(e) =>
                              setFormData({ ...formData, priority: parseInt(e.target.value) })
                            }
                          />
                        </div>

                        <div>
                          <Label>Budget mensuel (USD, optionnel)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Ex: 50"
                            value={formData.monthlyBudget || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                monthlyBudget: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleAddProvider} disabled={saving || !formData.provider}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Ajout...
                        </>
                      ) : (
                        'Ajouter'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Liste des providers */}
            {providers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Sparkles className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun provider configuré</h3>
                  <p className="text-gray-600 text-center mb-4">
                    Ajoutez votre premier provider LLM pour commencer à utiliser le routage
                    intelligent
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un provider
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers.map((provider) => {
                  const providerInfo = AVAILABLE_PROVIDERS[provider.provider as ProviderName];
                  return (
                    <Card
                      key={provider.id}
                      className={provider.isActive ? 'border-green-500' : 'border-gray-300'}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{providerInfo?.name || provider.provider}</span>
                          <div className="flex items-center gap-2">
                            {provider.isActive ? (
                              <Badge className="bg-green-500">Actif</Badge>
                            ) : (
                              <Badge variant="outline">Inactif</Badge>
                            )}
                            {provider.priority === 0 && (
                              <Badge className="bg-blue-500">Prioritaire</Badge>
                            )}
                          </div>
                        </CardTitle>
                        <CardDescription>{providerInfo?.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm">
                          {provider.model && (
                            <div>
                              <span className="font-semibold">Modèle:</span> {provider.model}
                            </div>
                          )}
                          <div>
                            <span className="font-semibold">Priorité:</span> {provider.priority}
                          </div>
                          {provider.monthlyBudget && (
                            <div>
                              <span className="font-semibold">Budget mensuel:</span>{' '}
                              {formatCurrency(provider.monthlyBudget)}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={provider.isActive}
                              onCheckedChange={() => handleToggleActive(provider)}
                            />
                            <Label className="text-sm">
                              {provider.isActive ? 'Activé' : 'Désactivé'}
                            </Label>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTestProvider(provider.provider as ProviderName)}
                            disabled={testing === provider.provider}
                          >
                            {testing === provider.provider ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Test...
                              </>
                            ) : (
                              <>
                                <Activity className="h-3 w-3 mr-1" />
                                Tester
                              </>
                            )}
                          </Button>

                          <Button size="sm" variant="outline" onClick={() => openEditDialog(provider)}>
                            <Edit className="h-3 w-3 mr-1" />
                            Modifier
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => handleDeleteProvider(provider.provider as ProviderName)}
                            disabled={deleting === provider.provider}
                          >
                            {deleting === provider.provider ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Dialog Edit Provider */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Modifier le Provider</DialogTitle>
              <DialogDescription>
                {selectedProvider && AVAILABLE_PROVIDERS[selectedProvider.provider as ProviderName]?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>Clé API (laisser vide pour garder l'actuelle)</Label>
                <Input
                  type="password"
                  placeholder="Nouvelle clé API"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                />
              </div>

              {selectedProvider && (
                <>
                  <div>
                    <Label>Modèle</Label>
                    <Select
                      value={formData.model}
                      onValueChange={(value) => setFormData({ ...formData, model: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Modèle par défaut" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_PROVIDERS[selectedProvider.provider as ProviderName].models.map(
                          (model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Priorité</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: parseInt(e.target.value) })
                      }
                    />
                  </div>

                  <div>
                    <Label>Budget mensuel (USD)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.monthlyBudget || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          monthlyBudget: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateProvider} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  'Sauvegarder'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* TAB 2: ANALYTICS */}
        <TabsContent value="analytics">
          {metrics ? (
            <div className="space-y-4">
              {/* Métriques globales */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Coût Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(metrics.totalCost)}</div>
                    <p className="text-xs text-gray-600 mt-1">Ce mois</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Appels LLM</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(metrics.totalCalls)}</div>
                    <p className="text-xs text-gray-600 mt-1">Total</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Latence Moyenne</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.avgLatency}ms</div>
                    <p className="text-xs text-gray-600 mt-1">Temps de réponse</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Taux de Succès</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
                    <p className="text-xs text-gray-600 mt-1">Fiabilité</p>
                  </CardContent>
                </Card>
              </div>

              {/* Coût par provider */}
              <Card>
                <CardHeader>
                  <CardTitle>Coût par Provider</CardTitle>
                  <CardDescription>Répartition des dépenses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(metrics.costByProvider)
                      .sort((a, b) => b[1] - a[1])
                      .map(([provider, cost]) => (
                        <div key={provider} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">{provider}</div>
                            <div className="text-sm text-gray-600">
                              ({metrics.callsByProvider[provider] || 0} appels)
                            </div>
                          </div>
                          <div className="font-bold">{formatCurrency(cost)}</div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Coût par opération */}
              <Card>
                <CardHeader>
                  <CardTitle>Coût par Type d'Opération</CardTitle>
                  <CardDescription>Répartition par use case</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(metrics.costByOperation)
                      .sort((a, b) => b[1] - a[1])
                      .map(([operation, cost]) => (
                        <div key={operation} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">
                              {OPERATION_TYPES[operation as OperationType]?.name || operation}
                            </div>
                            <div className="text-sm text-gray-600">
                              ({metrics.callsByOperation[operation] || 0} appels)
                            </div>
                          </div>
                          <div className="font-bold">{formatCurrency(cost)}</div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB 3: BUDGET */}
        <TabsContent value="budget">
          {budget ? (
            <div className="space-y-4">
              {/* Alerte budget */}
              {budget.isOverBudget && (
                <Alert className="border-red-500">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>⚠️ Budget Dépassé !</strong>
                    <br />
                    Vous avez dépassé votre budget mensuel de{' '}
                    {formatCurrency(budget.totalSpent - budget.totalBudget)}
                  </AlertDescription>
                </Alert>
              )}

              {budget.percentUsed >= 80 && !budget.isOverBudget && (
                <Alert className="border-yellow-500">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>⚠️ Attention</strong>
                    <br />
                    Vous avez utilisé {budget.percentUsed.toFixed(0)}% de votre budget mensuel
                  </AlertDescription>
                </Alert>
              )}

              {/* Résumé budget global */}
              <Card>
                <CardHeader>
                  <CardTitle>Budget Global</CardTitle>
                  <CardDescription>Mois en cours : {budget.currentMonth}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Dépensé</span>
                      <span className="text-2xl font-bold">{formatCurrency(budget.totalSpent)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Budget total</span>
                      <span className="text-lg">{formatCurrency(budget.totalBudget)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Restant</span>
                      <span
                        className={`text-lg font-semibold ${
                          budget.remainingBudget > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(budget.remainingBudget)}
                      </span>
                    </div>

                    {/* Barre de progression */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Utilisation</span>
                        <span>{budget.percentUsed.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            budget.isOverBudget
                              ? 'bg-red-500'
                              : budget.percentUsed >= 80
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Budget par provider */}
              <Card>
                <CardHeader>
                  <CardTitle>Budget par Provider</CardTitle>
                  <CardDescription>Détail des dépenses par provider</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {budget.providers.map((provider) => (
                      <div key={provider.provider} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">{provider.provider}</span>
                          <span>
                            {formatCurrency(provider.spent)} / {formatCurrency(provider.budget)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              provider.percentUsed >= 100
                                ? 'bg-red-500'
                                : provider.percentUsed >= 80
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(provider.percentUsed, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>{provider.percentUsed.toFixed(1)}% utilisé</span>
                          <span>Reste: {formatCurrency(provider.remaining)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB 4: SUGGESTIONS */}
        <TabsContent value="suggestions">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Routing Intelligent par Opération</CardTitle>
                <CardDescription>
                  Le système sélectionne automatiquement le meilleur provider selon vos critères
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(OPERATION_TYPES).map(([operationType, info]) => (
                    <div key={operationType} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{info.name}</h3>
                          <p className="text-sm text-gray-600">{info.description}</p>
                        </div>
                        <Badge variant="outline">Auto</Badge>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Providers prioritaires:</strong> Sélection automatique basée sur le
                        coût, la latence et la qualité
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Comment ça marche ?</strong>
                <br />
                Le LLM Router sélectionne automatiquement le meilleur provider selon:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Le type d'opération (SEO, Prospecting, Analyse, etc.)</li>
                  <li>Les priorités configurées (0 = plus haute priorité)</li>
                  <li>Le budget restant de chaque provider</li>
                  <li>Les performances historiques (latence, taux de succès)</li>
                  <li>Le statut actif/inactif des providers</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
