import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { MainLayout } from '@/shared/components/layout';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useProspects } from '@/shared/hooks/useProspects';
import apiClient from '@/shared/utils/backend-api';
import {
  Search,
  Plus,
  User,
  Phone,
  Mail,
  Download,
  Trash2,
  Edit,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  Users,
  Star,
  KanbanSquare,
} from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  buyer: 'Acheteur',
  seller: 'Vendeur',
  tenant: 'Locataire',
  owner: 'Propriétaire',
  renter: 'Locataire',
  landlord: 'Bailleur',
  investor: 'Investisseur',
  other: 'Autre',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  qualified: 'bg-blue-100 text-blue-800',
  converted: 'bg-purple-100 text-purple-800',
  inactive: 'bg-gray-100 text-gray-800',
  lost: 'bg-red-100 text-red-800',
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  meeting: 'bg-purple-100 text-purple-800',
  closed: 'bg-gray-100 text-gray-800',
  lead: 'bg-sky-100 text-sky-800',
};

export default function ProspectsListPage() {
  const { prospects, loading, refresh, deleteProspect } = useProspects();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stats, setStats] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    apiClient
      .get('/prospects/stats')
      .then((r) => setStats(r.data))
      .catch(() => { });
  }, [prospects]);

  const filteredProspects = prospects.filter((p: any) => {
    const matchSearch =
      !search ||
      (p.firstName || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.lastName || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.phone || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchType = typeFilter === 'all' || p.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Supprimer ce prospect ?')) return;
    setDeleting(id);
    try {
      await deleteProspect(id);
      await refresh();
    } catch {
    } finally {
      setDeleting(null);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const response = await apiClient.get('/prospects/export/csv', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `prospects_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
    } finally {
      setExporting(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <MainLayout title="Prospects" breadcrumbs={[{ label: 'Prospects' }]}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Prospects" breadcrumbs={[{ label: 'Prospects' }]}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Prospects</h1>
            <p className="text-gray-600 mt-1">{prospects.length} prospects au total</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={exporting}>
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Export...' : 'CSV'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => refresh()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Link href="/prospects/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-0 -mb-px">
            <button
              className="flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors border-purple-600 text-purple-600"
            >
              <Users className="h-4 w-4" />
              Liste
            </button>
            <Link href="/prospects/pipeline">
              <button className="flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300">
                <KanbanSquare className="h-4 w-4" />
                Pipeline
              </button>
            </Link>
            <Link href="/prospects/gestion">
              <button className="flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300">
                <TrendingUp className="h-4 w-4" />
                Gestion
              </button>
            </Link>
          </nav>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Actifs</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Star className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Qualifiés</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.qualified}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Score moyen</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {Math.round(stats.avgScore || 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par nom, email, téléphone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="qualified">Qualifié</SelectItem>
                  <SelectItem value="converted">Converti</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  <SelectItem value="lost">Perdu</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="buyer">Acheteur</SelectItem>
                  <SelectItem value="seller">Vendeur</SelectItem>
                  <SelectItem value="tenant">Locataire</SelectItem>
                  <SelectItem value="owner">Propriétaire</SelectItem>
                  <SelectItem value="renter">Locataire (renter)</SelectItem>
                  <SelectItem value="landlord">Bailleur</SelectItem>
                  <SelectItem value="investor">Investisseur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <div className="grid gap-3">
          {filteredProspects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun prospect trouvé</h3>
                <p className="text-gray-600">
                  {search || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Essayez de modifier vos filtres'
                    : 'Commencez par ajouter un prospect'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredProspects.map((prospect: any) => (
              <Link key={prospect.id} href={`/prospects/${prospect.id}`} className="block group">
                <Card className="hover:shadow-md transition-shadow border group-hover:border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      {/* Avatar + Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {prospect.profiling?.avatar ? (
                          <img
                            src={prospect.profiling.avatar}
                            alt={`${prospect.firstName} ${prospect.lastName}`}
                            className="h-11 w-11 rounded-full object-cover flex-shrink-0 border border-gray-200"
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {(prospect.firstName?.[0] || '').toUpperCase()}
                            {(prospect.lastName?.[0] || '').toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {prospect.firstName} {prospect.lastName}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {prospect.email && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {prospect.email}
                              </span>
                            )}
                            {prospect.phone && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {prospect.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Badges + Score + Actions */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Badge
                          className={STATUS_COLORS[prospect.status] || 'bg-gray-100 text-gray-700'}
                        >
                          {prospect.status}
                        </Badge>
                        {prospect.type && (
                          <Badge variant="outline" className="hidden md:inline-flex">
                            {TYPE_LABELS[prospect.type] || prospect.type}
                          </Badge>
                        )}
                        {prospect.score !== undefined && (
                          <div className="hidden md:flex flex-col items-center">
                            <span
                              className={`text-base font-bold ${getScoreColor(prospect.score)}`}
                            >
                              {prospect.score}
                            </span>
                            <span className="text-[10px] text-gray-400">score</span>
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600"
                          onClick={(e) => {
                            e.preventDefault();
                            router.push(`/prospects/${prospect.id}`);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                          onClick={(e) => handleDelete(e, prospect.id)}
                          disabled={deleting === prospect.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
