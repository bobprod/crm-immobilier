import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { MainLayout } from '@/shared/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import { ArrowLeft, Mail, Users, Eye, MousePointer, TrendingUp, AlertCircle } from 'lucide-react';
import { campaignsAPI } from '@/shared/utils/campaigns-api';
import { useToast } from '@/shared/components/ui/use-toast';

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp' | 'mixed';
  status: 'draft' | 'active' | 'paused' | 'completed';
  targetAudience: string[];
  message: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  bounced: number;
  unsubscribed: number;
}

export default function CampaignDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (id) {
      loadCampaignData();
    }
  }, [user, router, id]);

  const loadCampaignData = async () => {
    try {
      setLoading(true);
      // Charger la campagne d'abord
      const campaignData = await campaignsAPI.getById(id as string);
      setCampaign(campaignData);

      // Essayer de charger les stats, mais ne pas échouer si elles n'existent pas
      try {
        const statsData = await campaignsAPI.getStats(id as string);
        setStats(statsData);
      } catch (statsError: any) {
        // Les stats peuvent ne pas exister pour les campagnes draft
        console.log('No stats available yet for this campaign');
        setStats({
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          converted: 0,
          bounced: 0,
          unsubscribed: 0,
        });
      }
    } catch (error) {
      console.error('Error loading campaign:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données de la campagne',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const calculateRate = (numerator: number, denominator: number) => {
    if (denominator === 0) return 0;
    return ((numerator / denominator) * 100).toFixed(2);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (!campaign) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Campagne non trouvée</p>
              <Link href="/marketing/campaigns">
                <Button>Retour aux campagnes</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <Link href="/marketing/campaigns">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux campagnes
            </Button>
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                <span className="text-gray-600">Type: {campaign.type}</span>
                <span className="text-gray-600">
                  Créée le {new Date(campaign.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Envoyés</p>
                  <p className="text-2xl font-bold">{stats?.sent || 0}</p>
                </div>
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Délivrés</p>
                  <p className="text-2xl font-bold">{stats?.delivered || 0}</p>
                  <p className="text-xs text-gray-500">
                    {calculateRate(stats?.delivered || 0, stats?.sent || 0)}%
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ouverts</p>
                  <p className="text-2xl font-bold">{stats?.opened || 0}</p>
                  <p className="text-xs text-gray-500">
                    {calculateRate(stats?.opened || 0, stats?.delivered || 0)}%
                  </p>
                </div>
                <Eye className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Clics</p>
                  <p className="text-2xl font-bold">{stats?.clicked || 0}</p>
                  <p className="text-xs text-gray-500">
                    {calculateRate(stats?.clicked || 0, stats?.opened || 0)}%
                  </p>
                </div>
                <MousePointer className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conversions</p>
                  <p className="text-2xl font-bold">{stats?.converted || 0}</p>
                  <p className="text-xs text-gray-500">
                    {calculateRate(stats?.converted || 0, stats?.clicked || 0)}% des clics
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bounced</p>
                  <p className="text-2xl font-bold">{stats?.bounced || 0}</p>
                  <p className="text-xs text-gray-500">
                    {calculateRate(stats?.bounced || 0, stats?.sent || 0)}%
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Désabonnements</p>
                  <p className="text-2xl font-bold">{stats?.unsubscribed || 0}</p>
                  <p className="text-xs text-gray-500">
                    {calculateRate(stats?.unsubscribed || 0, stats?.delivered || 0)}%
                  </p>
                </div>
                <Users className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Details */}
        <Card>
          <CardHeader>
            <CardTitle>Détails de la campagne</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm text-gray-600 mb-2">Message</h3>
              <p className="text-gray-900 whitespace-pre-wrap">{campaign.message}</p>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-gray-600 mb-2">Audience cible</h3>
              <p className="text-gray-900">{campaign.targetAudience?.length || 0} contacts</p>
            </div>

            {campaign.scheduledAt && (
              <div>
                <h3 className="font-semibold text-sm text-gray-600 mb-2">Date programmée</h3>
                <p className="text-gray-900">
                  {new Date(campaign.scheduledAt).toLocaleString('fr-FR')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
