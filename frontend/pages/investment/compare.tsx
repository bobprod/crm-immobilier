import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { MainLayout } from '@/shared/components/layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, BarChart3, Plus, X } from 'lucide-react';
import { apiClient } from '@/shared/utils/backend-api';

interface Project {
  id: string;
  title: string;
  city: string;
  country: string;
  totalPrice: number;
  netYield: number;
  grossYield: number;
  status: string;
  source: string;
}

export default function CompareProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await apiClient.get('/investment-intelligence/projects');
      const raw = res.data?.data ?? res.data?.projects ?? res.data;
      setProjects(Array.isArray(raw) ? raw : []);
    } catch (error) {
      console.error('Erreur chargement projets:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProject = (project: Project) => {
    if (selectedProjects.find((p) => p.id === project.id)) {
      setSelectedProjects((prev) => prev.filter((p) => p.id !== project.id));
    } else if (selectedProjects.length < 5) {
      setSelectedProjects((prev) => [...prev, project]);
    }
  };

  return (
    <MainLayout>
      <Head>
        <title>Comparer les projets - Investment Intelligence</title>
      </Head>

      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/investment')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Comparer les projets
              </h1>
              <p className="text-muted-foreground text-sm">
                Sélectionnez jusqu&apos;à 5 projets à comparer
              </p>
            </div>
          </div>
        </div>

        {selectedProjects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Comparaison ({selectedProjects.length}/5)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Critère
                      </th>
                      {selectedProjects.map((p) => (
                        <th key={p.id} className="text-left py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{p.title}</span>
                            <button
                              onClick={() => toggleProject(p)}
                              className="text-red-400 hover:text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4 text-muted-foreground">Ville</td>
                      {selectedProjects.map((p) => (
                        <td key={p.id} className="py-3 px-4">
                          {p.city}, {p.country}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4 text-muted-foreground">Prix total</td>
                      {selectedProjects.map((p) => (
                        <td key={p.id} className="py-3 px-4 font-medium">
                          {p.totalPrice?.toLocaleString('fr-FR')} €
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4 text-muted-foreground">Rendement net</td>
                      {selectedProjects.map((p) => (
                        <td key={p.id} className="py-3 px-4 text-green-600 font-medium">
                          {p.netYield}%
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4 text-muted-foreground">Rendement brut</td>
                      {selectedProjects.map((p) => (
                        <td key={p.id} className="py-3 px-4">
                          {p.grossYield}%
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4 text-muted-foreground">Source</td>
                      {selectedProjects.map((p) => (
                        <td key={p.id} className="py-3 px-4">
                          {p.source}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-muted-foreground">Statut</td>
                      {selectedProjects.map((p) => (
                        <td key={p.id} className="py-3 px-4">
                          {p.status}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Projets disponibles</CardTitle>
            <CardDescription>
              Cliquez sur un projet pour l&apos;ajouter à la comparaison
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Chargement...</div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Aucun projet disponible</p>
                <Button onClick={() => router.push('/investment/import')}>
                  <Plus className="h-4 w-4 mr-2" /> Importer un projet
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => {
                  const isSelected = selectedProjects.some((p) => p.id === project.id);
                  return (
                    <div
                      key={project.id}
                      onClick={() => toggleProject(project)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'
                      } ${selectedProjects.length >= 5 && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <h3 className="font-semibold">{project.title}</h3>
                      <p className="text-sm text-muted-foreground">{project.city}</p>
                      <div className="flex justify-between mt-2 text-sm">
                        <span>{project.totalPrice?.toLocaleString('fr-FR')} €</span>
                        <span className="text-green-600 font-medium">{project.netYield}% ROI</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
