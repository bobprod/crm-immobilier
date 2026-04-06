import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  validationAPI,
  ValidationHistory,
  ValidationStats,
  BlacklistItem,
  WhitelistItem,
  getScoreBadgeColor,
} from '@/shared/utils/validation-api';
import {
  Shield,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  Plus,
  RefreshCw,
  Loader2,
  ArrowLeft,
  Search,
  Ban,
  ShieldCheck,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

type TabType = 'validate' | 'history' | 'blacklist' | 'whitelist' | 'stats';

export default function ValidationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('validate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation state
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailResult, setEmailResult] = useState<any>(null);
  const [phoneResult, setPhoneResult] = useState<any>(null);
  const [validatingEmail, setValidatingEmail] = useState(false);
  const [validatingPhone, setValidatingPhone] = useState(false);

  // History & Stats
  const [history, setHistory] = useState<ValidationHistory[]>([]);
  const [stats, setStats] = useState<ValidationStats | null>(null);

  // Blacklist & Whitelist
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistItem[]>([]);
  const [newBlacklistValue, setNewBlacklistValue] = useState('');
  const [newBlacklistType, setNewBlacklistType] = useState<'email' | 'phone' | 'domain'>('email');
  const [newBlacklistReason, setNewBlacklistReason] = useState('');
  const [newWhitelistValue, setNewWhitelistValue] = useState('');
  const [newWhitelistType, setNewWhitelistType] = useState<'email' | 'phone' | 'domain'>('email');

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load data based on tab
  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'history') {
        const data = await validationAPI.getHistory({ limit: 100 });
        setHistory(data);
      } else if (activeTab === 'stats') {
        const data = await validationAPI.getStats();
        setStats(data);
      } else if (activeTab === 'blacklist') {
        const data = await validationAPI.getBlacklist();
        setBlacklist(data);
      } else if (activeTab === 'whitelist') {
        const data = await validationAPI.getWhitelist();
        setWhitelist(data);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [activeTab, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Validate email
  const handleValidateEmail = async () => {
    if (!emailInput.trim()) return;
    setValidatingEmail(true);
    setEmailResult(null);

    try {
      const result = await validationAPI.validateEmail(emailInput.trim());
      setEmailResult(result);
    } catch (err: any) {
      setEmailResult({ error: err.message || 'Erreur de validation' });
    } finally {
      setValidatingEmail(false);
    }
  };

  // Validate phone
  const handleValidatePhone = async () => {
    if (!phoneInput.trim()) return;
    setValidatingPhone(true);
    setPhoneResult(null);

    try {
      const result = await validationAPI.validatePhone(phoneInput.trim());
      setPhoneResult(result);
    } catch (err: any) {
      setPhoneResult({ error: err.message || 'Erreur de validation' });
    } finally {
      setValidatingPhone(false);
    }
  };

  // AI Validation
  const handleValidateEmailAI = async () => {
    if (!emailInput.trim()) return;
    setValidatingEmail(true);
    setEmailResult(null);

    try {
      const result = await validationAPI.validateEmailWithAI(emailInput.trim());
      setEmailResult({ ...result, aiPowered: true });
    } catch (err: any) {
      setEmailResult({ error: err.message || 'Erreur de validation IA' });
    } finally {
      setValidatingEmail(false);
    }
  };

  // Add to blacklist
  const handleAddToBlacklist = async () => {
    if (!newBlacklistValue.trim()) return;

    try {
      await validationAPI.addToBlacklist(
        newBlacklistType,
        newBlacklistValue.trim(),
        newBlacklistReason
      );
      setNewBlacklistValue('');
      setNewBlacklistReason('');
      loadData();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'ajout");
    }
  };

  // Remove from blacklist
  const handleRemoveFromBlacklist = async (id: string) => {
    try {
      await validationAPI.removeFromBlacklist(id);
      setBlacklist((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
    }
  };

  // Add to whitelist
  const handleAddToWhitelist = async () => {
    if (!newWhitelistValue.trim()) return;

    try {
      await validationAPI.addToWhitelist(newWhitelistType, newWhitelistValue.trim());
      setNewWhitelistValue('');
      loadData();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'ajout");
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'validate', label: 'Valider', icon: <Search className="h-4 w-4" /> },
    { id: 'history', label: 'Historique', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'blacklist', label: 'Blacklist', icon: <Ban className="h-4 w-4" /> },
    { id: 'whitelist', label: 'Whitelist', icon: <ShieldCheck className="h-4 w-4" /> },
    { id: 'stats', label: 'Statistiques', icon: <BarChart3 className="h-4 w-4" /> },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="h-6 w-6 text-blue-600" />
                  Validation & Anti-Spam
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Validez emails et telephones, gerez vos listes noires/blanches
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex bg-white rounded-lg border shadow-sm p-1 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 mb-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 pb-8">
        {/* Validate Tab */}
        {activeTab === 'validate' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Validation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  Validation Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="email@example.com"
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleValidateEmail}
                    disabled={validatingEmail || !emailInput}
                    className="flex-1"
                  >
                    {validatingEmail ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Valider
                  </Button>
                  <Button
                    onClick={handleValidateEmailAI}
                    disabled={validatingEmail || !emailInput}
                    variant="outline"
                    className="flex-1"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Valider IA
                  </Button>
                </div>

                {emailResult && (
                  <div
                    className={`p-4 rounded-lg border ${
                      emailResult.error
                        ? 'bg-red-50 border-red-200'
                        : emailResult.isValid
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                    }`}
                  >
                    {emailResult.error ? (
                      <p className="text-red-700">{emailResult.error}</p>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          {emailResult.isValid ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <span className="font-medium">
                            {emailResult.isValid ? 'Email valide' : 'Email invalide'}
                          </span>
                          {emailResult.aiPowered && (
                            <Badge className="bg-purple-100 text-purple-700">IA</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            Score:{' '}
                            <span className={getScoreBadgeColor(emailResult.score)}>
                              {emailResult.score}/100
                            </span>
                          </div>
                          {emailResult.isSpam && <div className="text-red-600">Spam detecte</div>}
                          {emailResult.isDisposable && (
                            <div className="text-yellow-600">Email jetable</div>
                          )}
                          {emailResult.provider && <div>Provider: {emailResult.provider}</div>}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Phone Validation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-green-600" />
                  Validation Telephone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+216 XX XXX XXX"
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <Button
                  onClick={handleValidatePhone}
                  disabled={validatingPhone || !phoneInput}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {validatingPhone ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Valider
                </Button>

                {phoneResult && (
                  <div
                    className={`p-4 rounded-lg border ${
                      phoneResult.error
                        ? 'bg-red-50 border-red-200'
                        : phoneResult.isValid
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                    }`}
                  >
                    {phoneResult.error ? (
                      <p className="text-red-700">{phoneResult.error}</p>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          {phoneResult.isValid ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <span className="font-medium">
                            {phoneResult.isValid ? 'Numero valide' : 'Numero invalide'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            Score:{' '}
                            <span className={getScoreBadgeColor(phoneResult.score)}>
                              {phoneResult.score}/100
                            </span>
                          </div>
                          {phoneResult.country && <div>Pays: {phoneResult.country}</div>}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <Card>
            <CardHeader>
              <CardTitle>Historique des validations</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucune validation effectuee</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {item.contactType === 'email' ? (
                          <Mail className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Phone className="h-4 w-4 text-green-600" />
                        )}
                        <span className="font-mono text-sm">{item.contactValue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getScoreBadgeColor(item.score)}>{item.score}/100</Badge>
                        {item.isValid ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        {item.isSpam && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Blacklist Tab */}
        {activeTab === 'blacklist' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ban className="h-5 w-5 text-red-600" />
                  Ajouter a la liste noire
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={newBlacklistType}
                    onChange={(e) => setNewBlacklistType(e.target.value as any)}
                    className="px-3 py-2 border rounded-lg"
                  >
                    <option value="email">Email</option>
                    <option value="phone">Telephone</option>
                    <option value="domain">Domaine</option>
                  </select>
                  <input
                    type="text"
                    value={newBlacklistValue}
                    onChange={(e) => setNewBlacklistValue(e.target.value)}
                    placeholder="Valeur a bloquer"
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    value={newBlacklistReason}
                    onChange={(e) => setNewBlacklistReason(e.target.value)}
                    placeholder="Raison (optionnel)"
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <Button onClick={handleAddToBlacklist} className="bg-red-600 hover:bg-red-700">
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Liste noire ({blacklist.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : blacklist.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Liste noire vide</p>
                ) : (
                  <div className="space-y-2">
                    {blacklist.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                      >
                        <div>
                          <Badge variant="outline" className="mr-2">
                            {item.type}
                          </Badge>
                          <span className="font-mono">{item.value}</span>
                          {item.reason && (
                            <span className="text-sm text-gray-500 ml-2">- {item.reason}</span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFromBlacklist(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Whitelist Tab */}
        {activeTab === 'whitelist' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                  Ajouter a la liste blanche
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <select
                    value={newWhitelistType}
                    onChange={(e) => setNewWhitelistType(e.target.value as any)}
                    className="px-3 py-2 border rounded-lg"
                  >
                    <option value="email">Email</option>
                    <option value="phone">Telephone</option>
                    <option value="domain">Domaine</option>
                  </select>
                  <input
                    type="text"
                    value={newWhitelistValue}
                    onChange={(e) => setNewWhitelistValue(e.target.value)}
                    placeholder="Valeur de confiance"
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <Button
                    onClick={handleAddToWhitelist}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Liste blanche ({whitelist.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : whitelist.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Liste blanche vide</p>
                ) : (
                  <div className="space-y-2">
                    {whitelist.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                      >
                        <div>
                          <Badge variant="outline" className="mr-2">
                            {item.type}
                          </Badge>
                          <span className="font-mono">{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <div className="col-span-4 flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : stats ? (
              <>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                      <p className="text-sm text-gray-500">Total valide</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">{stats.valid}</p>
                      <p className="text-sm text-gray-500">
                        Valides ({stats.validRate?.toFixed(1)}%)
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-red-600">{stats.spam}</p>
                      <p className="text-sm text-gray-500">Spam detecte</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600">
                        {stats.avgScore?.toFixed(0)}
                      </p>
                      <p className="text-sm text-gray-500">Score moyen</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <p className="col-span-4 text-center text-gray-500 py-8">Aucune statistique</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
