import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { MainLayout } from '@/shared/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import {
  Search,
  Plus,
  Mail,
  MessageSquare,
  Phone,
  Play,
  Pause,
  Copy,
  Trash2,
  BarChart3,
} from 'lucide-react';
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

export default function CampaignsListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      loadCampaigns();
    }
  }, [user, router, statusFilter]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      const response = await campaignsAPI.list(filters);
      setCampaigns(response.campaigns || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les campagnes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.message?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'whatsapp':
        return <Phone className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette campagne ?')) {
      return;
    }

    try {
      await campaignsAPI.delete(id);
      toast({
        title: 'Succès',
        description: 'Campagne supprimée avec succès',
      });
      loadCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la campagne',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicate = async (id: string, name: string) => {
    try {
      await campaignsAPI.duplicate(id, `Copie de ${name}`);
      toast({
        title: 'Succès',
        description: 'Campagne dupliquée avec succès',
      });
      loadCampaigns();
    } catch (error) {
      console.error('Error duplicating campaign:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de dupliquer la campagne',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (campaign: Campaign) => {
    try {
      if (campaign.status === 'active') {
        await campaignsAPI.pause(campaign.id);
        toast({
          title: 'Succès',
          description: 'Campagne mise en pause',
        });
      } else if (campaign.status === 'paused') {
        await campaignsAPI.resume(campaign.id);
        toast({
          title: 'Succès',
          description: 'Campagne reprise',
        });
      } else if (campaign.status === 'draft') {
        await campaignsAPI.start(campaign.id);
        toast({
          title: 'Succès',
          description: 'Campagne démarrée',
        });
      }
      loadCampaigns();
    } catch (error) {
      console.error('Error toggling campaign status:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut de la campagne',
        variant: 'destructive',
      });
    }
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

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campagnes Marketing</h1>
            <p className="text-gray-600 mt-1">Gérez vos campagnes email, SMS et WhatsApp</p>
          </div>
          <Link href="/marketing/campaigns/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Campagne
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher une campagne..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                >
                  Toutes
                </Button>
                <Button
                  variant={statusFilter === 'draft' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('draft')}
                >
                  Brouillons
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('active')}
                >
                  Actives
                </Button>
                <Button
                  variant={statusFilter === 'completed' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('completed')}
                >
                  Terminées
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campaigns List */}
        <div className="grid gap-4">
          {filteredCampaigns.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <p className="text-gray-500 mb-4">Aucune campagne trouvée</p>
                <Link href="/marketing/campaigns/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer votre première campagne
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            filteredCampaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(campaign.type)}
                          <h3 className="text-lg font-semibold">{campaign.name}</h3>
                        </div>
                        <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{campaign.message}</p>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>Type: {campaign.type}</span>
                        <span>Audience: {campaign.targetAudience?.length || 0} contacts</span>
                        <span>
                          Créée le {new Date(campaign.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(campaign)}
                        title={campaign.status === 'active' ? 'Pause' : 'Démarrer'}
                      >
                        {campaign.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Link href={`/marketing/campaigns/${campaign.id}`}>
                        <Button variant="ghost" size="sm" title="Statistiques">
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicate(campaign.id, campaign.name)}
                        title="Dupliquer"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(campaign.id)}
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
