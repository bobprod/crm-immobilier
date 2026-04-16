import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import apiClient from '@/shared/utils/backend-api';
import {
  ArrowLeft,
  FlaskConical,
  Plus,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

interface ABTest {
  id: string;
  name: string;
  description: string;
  variantAConfig: any;
  variantBConfig: any;
  trafficSplit: number;
  startDate: string;
  endDate: string;
  status: 'running' | 'stopped' | 'completed';
}

interface ABTestStats {
  test: ABTest;
  variantA: {
    totalEvents: number;
    conversions: number;
    conversionRate: string;
  };
  variantB: {
    totalEvents: number;
    conversions: number;
    conversionRate: string;
  };
  winner: 'A' | 'B';
  improvementPercentage: string;
  isStatisticallySignificant: boolean;
  zScore: string;
}

export default function ABTestsPage() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [testStats, setTestStats] = useState<ABTestStats | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newTest, setNewTest] = useState({
    name: '',
    description: '',
    variantA: { platform: 'meta', pixelId: '' },
    variantB: { platform: 'google_tag_manager', containerId: '' },
    trafficSplit: 50,
    duration: 14,
  });

  useEffect(() => {
    loadTests();
  }, []);

  useEffect(() => {
    if (selectedTest) {
      loadTestStats(selectedTest.id);
    }
  }, [selectedTest]);

  const loadTests = async () => {
    try {
      const response = await apiClient.get('/marketing-tracking/ab-tests');
      setTests(response.data);
      if (response.data.length > 0 && !selectedTest) {
        setSelectedTest(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to load tests:', error);
    }
  };

  const loadTestStats = async (testId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/marketing-tracking/ab-tests/${testId}/stats`);
      setTestStats(response.data);
    } catch (error) {
      console.error('Failed to load test stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTest = async () => {
    try {
      await apiClient.post('/marketing-tracking/ab-tests', {
        name: newTest.name,
        description: newTest.description,
        variantAConfig: newTest.variantA,
        variantBConfig: newTest.variantB,
        trafficSplit: newTest.trafficSplit,
        duration: newTest.duration,
      });

      setShowCreateDialog(false);
      loadTests();
      setNewTest({
        name: '',
        description: '',
        variantA: { platform: 'meta', pixelId: '' },
        variantB: { platform: 'google_tag_manager', containerId: '' },
        trafficSplit: 50,
        duration: 14,
      });
    } catch (error) {
      console.error('Failed to create test:', error);
    }
  };

  const stopTest = async (testId: string) => {
    try {
      await apiClient.post(`/marketing-tracking/ab-tests/${testId}/stop`);
      loadTests();
    } catch (error) {
      console.error('Failed to stop test:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500';
      case 'stopped':
        return 'bg-orange-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/marketing-dashboard">
            <Button variant="ghost" size="sm" className="mb-2 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Hub Marketing
            </Button>
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FlaskConical className="h-8 w-8 text-blue-600" />
            Tests A/B
          </h1>
          <p className="text-gray-600 mt-2">
            Testez différentes configurations de pixels pour optimiser vos conversions
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Créer un Test A/B
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un nouveau test A/B</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div>
                <Label>Nom du Test</Label>
                <Input
                  value={newTest.name}
                  onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                  placeholder="Ex: Test Meta Pixel vs GTM"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={newTest.description}
                  onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                  placeholder="Objectif et hypothèse du test..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      A
                    </div>
                    Variante A
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Plateforme</Label>
                      <Input
                        value={newTest.variantA.platform}
                        onChange={(e) =>
                          setNewTest({
                            ...newTest,
                            variantA: { ...newTest.variantA, platform: e.target.value },
                          })
                        }
                        placeholder="meta, gtm, ga4..."
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Pixel ID / Container ID</Label>
                      <Input
                        value={newTest.variantA.pixelId}
                        onChange={(e) =>
                          setNewTest({
                            ...newTest,
                            variantA: { ...newTest.variantA, pixelId: e.target.value },
                          })
                        }
                        placeholder="123456789..."
                      />
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                      B
                    </div>
                    Variante B
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Plateforme</Label>
                      <Input
                        value={newTest.variantB.platform}
                        onChange={(e) =>
                          setNewTest({
                            ...newTest,
                            variantB: { ...newTest.variantB, platform: e.target.value },
                          })
                        }
                        placeholder="meta, gtm, ga4..."
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Pixel ID / Container ID</Label>
                      <Input
                        value={newTest.variantB.containerId}
                        onChange={(e) =>
                          setNewTest({
                            ...newTest,
                            variantB: { ...newTest.variantB, containerId: e.target.value },
                          })
                        }
                        placeholder="GTM-XXXXX..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label>Répartition du Traffic (%)</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={newTest.trafficSplit}
                      onChange={(e) =>
                        setNewTest({ ...newTest, trafficSplit: parseInt(e.target.value) })
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Variante A: {newTest.trafficSplit}%
                    </p>
                  </div>
                  <div className="flex-1">
                    <Input type="number" value={100 - newTest.trafficSplit} disabled />
                    <p className="text-xs text-gray-500 mt-1">
                      Variante B: {100 - newTest.trafficSplit}%
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label>Durée du Test (jours)</Label>
                <Input
                  type="number"
                  min="1"
                  value={newTest.duration}
                  onChange={(e) => setNewTest({ ...newTest, duration: parseInt(e.target.value) })}
                />
              </div>

              <Button onClick={createTest} className="w-full">
                Créer le Test
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tests List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Tests ({tests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tests.map((test) => (
                  <button
                    key={test.id}
                    onClick={() => setSelectedTest(test)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      selectedTest?.id === test.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{test.name}</h3>
                      <Badge className={getStatusColor(test.status)}>{test.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{test.description}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <span>{new Date(test.startDate).toLocaleDateString('fr-FR')}</span>
                      <span>→</span>
                      <span>{new Date(test.endDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </button>
                ))}

                {tests.length === 0 && (
                  <p className="text-center text-gray-500 py-8">Aucun test créé</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        <div className="lg:col-span-2">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">Chargement des résultats...</p>
              </CardContent>
            </Card>
          ) : !testStats ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FlaskConical className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Sélectionnez un test pour voir les résultats</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Test Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{testStats.test.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      {testStats.test.status === 'running' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => stopTest(testStats.test.id)}
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Arrêter
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{testStats.test.description}</p>
                </CardHeader>
              </Card>

              {/* Winner Banner */}
              {testStats.isStatisticallySignificant && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <CheckCircle className="h-12 w-12 text-green-600" />
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-green-900">
                          Variante {testStats.winner} gagne ! 🎉
                        </h3>
                        <p className="text-green-700">
                          Amélioration de {testStats.improvementPercentage}% - Statistiquement
                          significatif (z-score: {testStats.zScore})
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Variants Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Variant A */}
                <Card
                  className={
                    testStats.winner === 'A' && testStats.isStatisticallySignificant
                      ? 'border-2 border-green-500'
                      : ''
                  }
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        A
                      </div>
                      Variante A
                      {testStats.winner === 'A' && testStats.isStatisticallySignificant && (
                        <Badge className="bg-green-500 ml-auto">Winner</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600">Taux de Conversion</p>
                        <p className="text-4xl font-bold text-blue-600">
                          {testStats.variantA.conversionRate}%
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-sm text-gray-600">Événements</p>
                          <p className="text-2xl font-bold">{testStats.variantA.totalEvents}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Conversions</p>
                          <p className="text-2xl font-bold">{testStats.variantA.conversions}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Variant B */}
                <Card
                  className={
                    testStats.winner === 'B' && testStats.isStatisticallySignificant
                      ? 'border-2 border-green-500'
                      : ''
                  }
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                        B
                      </div>
                      Variante B
                      {testStats.winner === 'B' && testStats.isStatisticallySignificant && (
                        <Badge className="bg-green-500 ml-auto">Winner</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600">Taux de Conversion</p>
                        <p className="text-4xl font-bold text-green-600">
                          {testStats.variantB.conversionRate}%
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-sm text-gray-600">Événements</p>
                          <p className="text-2xl font-bold">{testStats.variantB.totalEvents}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Conversions</p>
                          <p className="text-2xl font-bold">{testStats.variantB.conversions}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Statistical Significance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Signification Statistique
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {testStats.isStatisticallySignificant ? (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    ) : (
                      <XCircle className="h-8 w-8 text-orange-600" />
                    )}
                    <div>
                      <p className="font-semibold">
                        {testStats.isStatisticallySignificant
                          ? 'Résultats significatifs (p < 0.05)'
                          : 'Pas encore significatif'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Z-Score: {testStats.zScore} (besoin: ± 1.96)
                      </p>
                      {!testStats.isStatisticallySignificant && (
                        <p className="text-sm text-orange-600 mt-2">
                          Continuez le test pour obtenir des résultats fiables
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
