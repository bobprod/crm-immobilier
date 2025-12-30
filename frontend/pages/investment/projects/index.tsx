import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import {
  ArrowLeft,
  Search,
  Filter,
  TrendingUp,
  MapPin,
  DollarSign,
  Plus,
  Eye,
} from 'lucide-react';

/**
 * Investment Projects List Page
 *
 * Liste complète des projets d'investissement avec filtres
 */

interface Project {
  id: string;
  title: string;
  city: string;
  country: string;
  totalPrice: number;
  minTicket: number;
  netYield: number;
  grossYield: number;
  propertyType: string;
  status: string;
  fundingProgress: number;
  source: string;
  durationMonths: number;
}

export default function ProjectsListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [sortBy, setSortBy] = useState('netYield');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterAndSortProjects();
  }, [searchQuery, filterStatus, filterSource, sortBy, projects]);

  const fetchProjects = async () => {
    try {
      // TODO: API call
      setProjects([
        {
          id: '1',
          title: 'Résidence Le Marais',
          city: 'Paris',
          country: 'France',
          totalPrice: 500000,
          minTicket: 1000,
          netYield: 9.2,
          grossYield: 10.5,
          propertyType: 'Résidentiel',
          status: 'active',
          fundingProgress: 75,
          source: 'bricks',
          durationMonths: 24,
        },
        {
          id: '2',
          title: 'Appartements Neufs Lyon',
          city: 'Lyon',
          country: 'France',
          totalPrice: 350000,
          minTicket: 500,
          netYield: 7.8,
          grossYield: 9.1,
          propertyType: 'Résidentiel',
          status: 'active',
          fundingProgress: 45,
          source: 'homunity',
          durationMonths: 36,
        },
        {
          id: '3',
          title: 'Bureaux Bordeaux Centre',
          city: 'Bordeaux',
          country: 'France',
          totalPrice: 800000,
          minTicket: 2000,
          netYield: 8.5,
          grossYield: 9.8,
          propertyType: 'Commercial',
          status: 'completed',
          fundingProgress: 100,
          source: 'generic',
          durationMonths: 48,
        },
        {
          id: '4',
          title: 'Résidence Étudiante Toulouse',
          city: 'Toulouse',
          country: 'France',
          totalPrice: 420000,
          minTicket: 750,
          netYield: 8.9,
          grossYield: 10.2,
          propertyType: 'Résidentiel',
          status: 'active',
          fundingProgress: 62,
          source: 'bricks',
          durationMonths: 30,
        },
        {
          id: '5',
          title: 'Commerce Marseille Vieux-Port',
          city: 'Marseille',
          country: 'France',
          totalPrice: 650000,
          minTicket: 1500,
          netYield: 7.5,
          grossYield: 8.7,
          propertyType: 'Commercial',
          status: 'active',
          fundingProgress: 88,
          source: 'homunity',
          durationMonths: 42,
        },
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setLoading(false);
    }
  };

  const filterAndSortProjects = () => {
    let filtered = projects;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.city.toLowerCase().includes(query) ||
          p.country.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((p) => p.status === filterStatus);
    }

    // Source filter
    if (filterSource !== 'all') {
      filtered = filtered.filter((p) => p.source === filterSource);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'netYield':
          return b.netYield - a.netYield;
        case 'totalPrice':
          return b.totalPrice - a.totalPrice;
        case 'fundingProgress':
          return b.fundingProgress - a.fundingProgress;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredProjects(filtered);
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
        <title>Projets d'Investissement</title>
      </Head>

      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/investment')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Projets d'Investissement</h1>
              <p className="text-muted-foreground">{filteredProjects.length} projets trouvés</p>
            </div>
          </div>

          <Button onClick={() => router.push('/investment/import')}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau projet
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="completed">Terminés</SelectItem>
                  <SelectItem value="draft">Brouillons</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les sources</SelectItem>
                  <SelectItem value="bricks">Bricks</SelectItem>
                  <SelectItem value="homunity">Homunity</SelectItem>
                  <SelectItem value="generic">URL</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="netYield">Meilleur ROI</SelectItem>
                  <SelectItem value="totalPrice">Prix total</SelectItem>
                  <SelectItem value="fundingProgress">Financement</SelectItem>
                  <SelectItem value="title">Nom (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Projects Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Projets</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projet</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead className="text-right">Prix Total</TableHead>
                  <TableHead className="text-right">Ticket Min.</TableHead>
                  <TableHead className="text-right">ROI Net</TableHead>
                  <TableHead className="text-right">Financement</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{project.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {project.propertyType} • {project.durationMonths} mois
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {project.city}, {project.country}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {project.totalPrice.toLocaleString('fr-FR')} €
                    </TableCell>
                    <TableCell className="text-right">
                      {project.minTicket.toLocaleString('fr-FR')} €
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-green-600 font-medium">
                        {project.netYield}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        <div className="w-16 bg-secondary rounded-full h-2 mr-2">
                          <div
                            className="bg-primary rounded-full h-2"
                            style={{ width: `${project.fundingProgress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{project.fundingProgress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={project.status === 'active' ? 'default' : 'secondary'}
                      >
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/investment/projects/${project.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
