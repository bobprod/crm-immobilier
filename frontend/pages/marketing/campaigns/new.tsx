import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../src/modules/core/layout/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import { ArrowLeft, Save } from 'lucide-react';
import { campaignsAPI } from '@/shared/utils/campaigns-api';
import { useToast } from '@/shared/components/ui/use-toast';
import Link from 'next/link';

export default function NewCampaignPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'email' as 'email' | 'sms' | 'whatsapp' | 'mixed',
    message: '',
    targetAudience: [] as string[],
    scheduledAt: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.message) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await campaignsAPI.create({
        name: formData.name,
        type: formData.type,
        message: formData.message,
        targetAudience: formData.targetAudience,
        scheduledAt: formData.scheduledAt || undefined,
      });
      
      toast({
        title: 'Succès',
        description: 'Campagne créée avec succès',
      });
      
      router.push('/marketing/campaigns');
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la campagne',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/marketing/campaigns">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux campagnes
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Nouvelle Campagne</h1>
          <p className="text-gray-600 mt-1">Créez une nouvelle campagne marketing</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informations de la campagne</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nom de la campagne <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Campagne Printemps 2024"
                  required
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">
                  Type de campagne <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="mixed">Mixte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">
                  Message <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Entrez le contenu de votre message..."
                  rows={8}
                  required
                />
                <p className="text-sm text-gray-500">
                  {formData.message.length} caractères
                </p>
              </div>

              {/* Scheduled At */}
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Date de programmation (optionnel)</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                />
                <p className="text-sm text-gray-500">
                  Laissez vide pour envoyer immédiatement
                </p>
              </div>

              {/* Target Audience Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Audience cible</h3>
                <p className="text-sm text-blue-800">
                  L'audience sera définie automatiquement selon les critères de segmentation.
                  Vous pourrez affiner la sélection après la création de la campagne.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>Création en cours...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Créer la campagne
                    </>
                  )}
                </Button>
                <Link href="/marketing/campaigns">
                  <Button type="button" variant="outline">
                    Annuler
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </Layout>
  );
}
