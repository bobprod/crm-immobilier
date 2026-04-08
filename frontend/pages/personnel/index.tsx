import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { MainLayout } from '@/shared/components/layout';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { usePersonnel, AgentProfile } from '@/shared/hooks/usePersonnel';
import {
  Users,
  Plus,
  Search,
  Settings2,
  TrendingUp,
  CheckCircle2,
  XCircle,
  ChevronRight,
  UserCircle,
} from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  AGENT: 'Agent',
  COMMERCIAL: 'Commercial',
  USER: 'Utilisateur',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-800',
  MANAGER: 'bg-blue-100 text-blue-800',
  AGENT: 'bg-green-100 text-green-800',
  COMMERCIAL: 'bg-orange-100 text-orange-800',
  USER: 'bg-gray-100 text-gray-800',
};

export default function PersonnelPage() {
  const router = useRouter();
  const { agents, loading, error, deleteAgent } = usePersonnel();
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = agents.filter((a) => {
    const fullName = `${a.user.firstName ?? ''} ${a.user.lastName ?? ''}`.toLowerCase();
    const email = a.user.email.toLowerCase();
    const q = search.toLowerCase();
    return fullName.includes(q) || email.includes(q) || (a.jobTitle ?? '').toLowerCase().includes(q);
  });

  const handleDelete = async (agent: AgentProfile) => {
    const name = `${agent.user.firstName ?? ''} ${agent.user.lastName ?? ''}`.trim();
    if (!confirm(`Supprimer le profil de ${name} ?`)) return;
    setDeletingId(agent.id);
    try {
      await deleteAgent(agent.id);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ProtectedRoute>
      <MainLayout
        title="Personnel"
        breadcrumbs={[{ label: 'Personnel' }]}
      >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Gestion du Personnel
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Gérez vos agents, commerciaux et collaborateurs
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/personnel/commissions">
              <Button variant="outline" className="gap-2">
                <Settings2 className="w-4 h-4" />
                Commissions &amp; Primes
              </Button>
            </Link>
            <Link href="/personnel/new">
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                Ajouter un agent
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total personnel</p>
                <p className="text-2xl font-bold text-gray-900">{agents.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Actifs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {agents.filter((a) => a.isActive).length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Commission personnalisée</p>
                <p className="text-2xl font-bold text-gray-900">
                  {agents.filter((a) => a.commissionOverride).length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Rechercher par nom, email ou poste..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <UserCircle className="w-16 h-16 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">
              {search ? 'Aucun résultat pour votre recherche' : 'Aucun agent créé'}
            </p>
            {!search && (
              <p className="text-sm mt-1">
                Commencez par ajouter un agent via le bouton ci-dessus.
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((agent) => (
              <Card key={agent.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 font-semibold text-sm">
                          {(agent.user.firstName?.[0] ?? '') + (agent.user.lastName?.[0] ?? '')}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">
                            {agent.user.firstName} {agent.user.lastName}
                          </span>
                          <Badge
                            className={`text-xs ${ROLE_COLORS[agent.user.role] ?? ROLE_COLORS.USER}`}
                          >
                            {ROLE_LABELS[agent.user.role] ?? agent.user.role}
                          </Badge>
                          {!agent.isActive && (
                            <Badge className="text-xs bg-red-100 text-red-700">Inactif</Badge>
                          )}
                          {agent.commissionOverride && (
                            <Badge className="text-xs bg-yellow-100 text-yellow-700">
                              Commission perso
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{agent.user.email}</p>
                        {agent.jobTitle && (
                          <p className="text-xs text-gray-400">{agent.jobTitle}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link href={`/personnel/${agent.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                          Voir
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(agent)}
                        disabled={deletingId === agent.id}
                      >
                        {deletingId === agent.id ? (
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      </MainLayout>
    </ProtectedRoute>
  );
}


