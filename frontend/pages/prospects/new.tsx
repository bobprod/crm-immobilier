import React, { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '@/shared/components/layout';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  ArrowLeft,
  AlertCircle,
  Camera,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  Loader2,
} from 'lucide-react';
import apiClient from '@/shared/utils/backend-api';
import { prospectsAPI } from '@/shared/utils/prospects-api';

// ============================================
// Smart Validation Hook
// ============================================
function useFieldValidation() {
  const [validations, setValidations] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const timerRef = useRef<Record<string, NodeJS.Timeout>>({});

  const validateField = useCallback(
    (
      field: 'email' | 'phone' | 'name',
      value: string,
      extra?: { firstName?: string; lastName?: string }
    ) => {
      // Debounce 600ms
      if (timerRef.current[field]) clearTimeout(timerRef.current[field]);

      if (!value || value.length < 2) {
        setValidations((prev) => ({ ...prev, [field]: null }));
        return;
      }

      setLoading((prev) => ({ ...prev, [field]: true }));

      timerRef.current[field] = setTimeout(async () => {
        try {
          const res = await apiClient.post('/prospects/validate/field', {
            field,
            value,
            ...extra,
          });
          setValidations((prev) => ({ ...prev, [field]: res.data }));
        } catch {
          setValidations((prev) => ({ ...prev, [field]: null }));
        } finally {
          setLoading((prev) => ({ ...prev, [field]: false }));
        }
      }, 600);
    },
    []
  );

  return { validations, loading, validateField };
}

// ============================================
// Validation Badge Component
// ============================================
function ValidationBadge({
  result,
  loading,
  field,
}: {
  result: any;
  loading: boolean;
  field: string;
}) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400 mt-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Vérification...
      </span>
    );
  }

  if (!result) return null;

  if (field === 'email') {
    if (!result.isValid) {
      return (
        <div className="mt-1 space-y-1">
          <span className="inline-flex items-center gap-1 text-xs text-red-600">
            <XCircle className="h-3 w-3" />
            Email invalide
          </span>
          {result.errors?.map((e: string, i: number) => (
            <p key={i} className="text-xs text-red-500 ml-4">
              {e}
            </p>
          ))}
          {result.suggestions?.length > 0 && (
            <p className="text-xs text-blue-500 ml-4">💡 Suggestion : {result.suggestions[0]}</p>
          )}
        </div>
      );
    }

    return (
      <div className="mt-1 space-y-1">
        <span className="inline-flex items-center gap-1 text-xs text-green-600">
          <CheckCircle2 className="h-3 w-3" />
          Email valide
          {result.isDisposable && (
            <span className="ml-1 text-yellow-600 flex items-center gap-0.5">
              <AlertTriangle className="h-3 w-3" />
              (jetable)
            </span>
          )}
        </span>
        {result.duplicate?.isDuplicate && (
          <span className="inline-flex items-center gap-1 text-xs text-orange-600">
            <AlertTriangle className="h-3 w-3" />
            Un prospect avec cet email existe déjà
          </span>
        )}
      </div>
    );
  }

  if (field === 'phone') {
    if (!result.isValid) {
      return (
        <div className="mt-1">
          <span className="inline-flex items-center gap-1 text-xs text-red-600">
            <XCircle className="h-3 w-3" />
            Numéro invalide
          </span>
          {result.errors?.map((e: string, i: number) => (
            <p key={i} className="text-xs text-red-500 ml-4">
              {e}
            </p>
          ))}
        </div>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
        <CheckCircle2 className="h-3 w-3" />
        Numéro valide
        {result.formatted && <span className="text-gray-400 ml-1">({result.formatted})</span>}
      </span>
    );
  }

  if (field === 'name') {
    if (result.isSuspicious) {
      return (
        <div className="mt-1">
          <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
            <AlertTriangle className="h-3 w-3" />
            Nom suspect
          </span>
          {result.reasons?.map((r: string, i: number) => (
            <p key={i} className="text-xs text-yellow-500 ml-4">
              {r}
            </p>
          ))}
        </div>
      );
    }
    if (result.isValid) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
          <CheckCircle2 className="h-3 w-3" />
          Nom valide
        </span>
      );
    }
  }

  return null;
}

// ============================================
// Full Validation Summary
// ============================================
function ValidationSummary({ result }: { result: any }) {
  if (!result) return null;

  const scoreColor =
    result.score >= 80
      ? 'text-green-600 bg-green-50 border-green-200'
      : result.score >= 60
        ? 'text-blue-600 bg-blue-50 border-blue-200'
        : result.score >= 40
          ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
          : 'text-red-600 bg-red-50 border-red-200';

  return (
    <div className={`p-4 rounded-lg border ${scoreColor} space-y-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <span className="font-semibold text-sm">Score de validation</span>
        </div>
        <span className="text-2xl font-bold">{result.score}/100</span>
      </div>

      {result.errors?.length > 0 && (
        <div className="space-y-1">
          {result.errors.map((e: string, i: number) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-red-600">
              <XCircle className="h-3 w-3 flex-shrink-0" />
              {e}
            </div>
          ))}
        </div>
      )}

      {result.warnings?.length > 0 && (
        <div className="space-y-1">
          {result.warnings.map((w: string, i: number) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-yellow-600">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              {w}
            </div>
          ))}
        </div>
      )}

      {result.spam?.isSpam && (
        <div className="flex items-center gap-1.5 text-xs text-red-700 font-medium">
          <XCircle className="h-3 w-3" />
          🚫 Contact identifié comme spam (confiance: {result.spam.confidence}%)
        </div>
      )}
    </div>
  );
}

export default function NewProspectPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [type, setType] = React.useState<string>('buyer');
  const [source, setSource] = React.useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [fullValidation, setFullValidation] = useState<any>(null);
  const [validating, setValidating] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { validations, loading: fieldLoading, validateField } = useFieldValidation();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const budgetMin = formData.get('budgetMin') as string;
    const budgetMax = formData.get('budgetMax') as string;

    const data: Record<string, any> = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: (formData.get('phone') as string) || undefined,
      type,
      source: source || undefined,
      notes: (formData.get('notes') as string) || undefined,
    };

    // Run full validation before submission
    try {
      setValidating(true);
      const valRes = await apiClient.post('/prospects/validate', data);
      setFullValidation(valRes.data);
      setValidating(false);

      if (valRes.data.spam?.isSpam) {
        setError('Ce contact a été identifié comme spam. Vérifiez les informations.');
        setLoading(false);
        return;
      }

      if (valRes.data.duplicate?.isDuplicate) {
        setError('Un prospect avec cet email existe déjà.');
        setLoading(false);
        return;
      }
    } catch {
      // Validation non bloquante si le service est indisponible
      setValidating(false);
    }

    if (budgetMin || budgetMax) {
      data.budget = {
        min: budgetMin ? parseInt(budgetMin, 10) : undefined,
        max: budgetMax ? parseInt(budgetMax, 10) : undefined,
      };
    }

    try {
      const res = await apiClient.post('/prospects', data);
      const created = res.data;

      if (avatarFile && created?.id) {
        try {
          await prospectsAPI.uploadAvatar(created.id, avatarFile);
        } catch {
          /* non-bloquant */
        }
      }

      router.push('/prospects');
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erreur lors de la création du prospect';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout
      title="Nouveau Prospect"
      breadcrumbs={[{ label: 'Prospects', href: '/prospects' }, { label: 'Nouveau' }]}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux prospects
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Nouveau Prospect</h1>
        </div>

        <Card className="max-w-2xl">
          <CardContent className="pt-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-red-700 text-sm">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Avatar */}
              <div className="flex justify-center">
                <div className="relative">
                  <div
                    className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center cursor-pointer overflow-hidden border-4 border-white shadow-lg"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        className="h-full w-full object-cover"
                        alt="avatar"
                      />
                    ) : (
                      <User className="h-8 w-8 text-white" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-1.5 bg-purple-600 text-white rounded-full shadow hover:bg-purple-700"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              {/* Prénom / Nom */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="Jean"
                    required
                    onChange={(e) => {
                      const lastName = (document.getElementById('lastName') as HTMLInputElement)
                        ?.value;
                      if (e.target.value && lastName) {
                        validateField('name', e.target.value, {
                          firstName: e.target.value,
                          lastName,
                        });
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Dupont"
                    required
                    onChange={(e) => {
                      const firstName = (document.getElementById('firstName') as HTMLInputElement)
                        ?.value;
                      if (firstName && e.target.value) {
                        validateField('name', e.target.value, {
                          firstName,
                          lastName: e.target.value,
                        });
                      }
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <ValidationBadge
                    result={validations.name}
                    loading={fieldLoading.name}
                    field="name"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="jean.dupont@example.com"
                  required
                  onChange={(e) => validateField('email', e.target.value)}
                />
                <ValidationBadge
                  result={validations.email}
                  loading={fieldLoading.email}
                  field="email"
                />
              </div>

              {/* Téléphone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+33 06 XX XX XX XX"
                  onChange={(e) => validateField('phone', e.target.value)}
                />
                <ValidationBadge
                  result={validations.phone}
                  loading={fieldLoading.phone}
                  field="phone"
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label>Type de prospect *</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">🏠 Acheteur</SelectItem>
                    <SelectItem value="seller">💰 Vendeur</SelectItem>
                    <SelectItem value="tenant">🔑 Locataire</SelectItem>
                    <SelectItem value="owner">🏗️ Propriétaire</SelectItem>
                    <SelectItem value="renter">📋 Locataire (renter)</SelectItem>
                    <SelectItem value="landlord">🏢 Bailleur</SelectItem>
                    <SelectItem value="investor">📈 Investisseur</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Source */}
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Site web</SelectItem>
                    <SelectItem value="referral">Recommandation</SelectItem>
                    <SelectItem value="social">Réseaux sociaux</SelectItem>
                    <SelectItem value="phone">Appel téléphonique</SelectItem>
                    <SelectItem value="prospecting">Prospection IA</SelectItem>
                    <SelectItem value="csv_import">Import CSV</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Budget min/max */}
              <div className="space-y-2">
                <Label>Budget (€)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Input name="budgetMin" type="number" placeholder="Min: 100 000" min={0} />
                  </div>
                  <div>
                    <Input name="budgetMax" type="number" placeholder="Max: 500 000" min={0} />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Informations complémentaires sur le prospect..."
                  className="min-h-[100px]"
                />
              </div>

              {/* Validation Summary */}
              {fullValidation && <ValidationSummary result={fullValidation} />}

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading || validating}>
                  {validating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validation...
                    </>
                  ) : loading ? (
                    'Création...'
                  ) : (
                    'Créer le prospect'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
