import React, { useRef, useState } from 'react';
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
import { ArrowLeft, AlertCircle, Camera, User } from 'lucide-react';
import apiClient from '@/shared/utils/backend-api';
import { prospectsAPI } from '@/shared/utils/prospects-api';

export default function NewProspectPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [type, setType] = React.useState<string>('buyer');
  const [source, setSource] = React.useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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
                  <Input id="firstName" name="firstName" placeholder="Jean" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input id="lastName" name="lastName" placeholder="Dupont" required />
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
                />
              </div>

              {/* Téléphone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" name="phone" type="tel" placeholder="+33 06 XX XX XX XX" />
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

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Création...' : 'Créer le prospect'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
