import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import apiClient from '@/shared/utils/backend-api';
import { Settings, BarChart3, Brain, Zap } from 'lucide-react';

export default function MarketingTrackingPage() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [mlConfig, setMlConfig] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [configsData, mlConfigData, suggestionsData, anomaliesData] = await Promise.all([
      apiClient.get('/marketing-tracking/config'),
      apiClient.get('/marketing-tracking/automation/config'),
      apiClient.get('/marketing-tracking/automation/suggestions'),
      apiClient.get('/marketing-tracking/ml/anomalies?platform=facebook'),
    ]);

    setConfigs(configsData.data);
    setMlConfig(mlConfigData.data);
    setSuggestions(suggestionsData.data);
    setAnomalies(anomaliesData.data);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Marketing Tracking + IA
        </h1>
        <p className="text-gray-600 mt-2">
          Pixels marketing avec intelligence artificielle intégrée
        </p>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList>
          <TabsTrigger value="config">Configuration Pixels</TabsTrigger>
          <TabsTrigger value="ai">Intelligence Artificielle</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions IA ({suggestions.length})</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies ({anomalies.length})</TabsTrigger>
        </TabsList>

        {/* Configuration Pixels */}
        <TabsContent value="config">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['Facebook', 'TikTok', 'GA4', 'GTM', 'Google Ads', 'LinkedIn'].map((platform) => {
              const config = configs.find((c) => c.platform === platform.toLowerCase());
              return (
                <Card key={platform}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {platform} Pixel
                      {config?.isActive && <Badge className="bg-green-500">Actif</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button>Configurer</Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* IA Configuration */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Configuration IA/ML
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Mode d'automatisation</h3>
                <div className="flex gap-2">
                  <Badge variant={mlConfig?.mode === 'suggestion' ? 'default' : 'outline'}>
                    Suggestion
                  </Badge>
                  <Badge variant={mlConfig?.mode === 'semi_auto' ? 'default' : 'outline'}>
                    Semi-Auto
                  </Badge>
                  <Badge variant={mlConfig?.mode === 'full_auto' ? 'default' : 'outline'}>
                    Full Auto
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Fonctionnalités IA</h4>
                  <ul className="text-sm space-y-1 mt-2">
                    <li>✅ Prédiction conversion</li>
                    <li>✅ Détection anomalies</li>
                    <li>✅ Segmentation auto</li>
                    <li>✅ Attribution multi-touch</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Limites</h4>
                  <p className="text-sm mt-2">Budget : ±{mlConfig?.budgetAdjustmentLimit}%</p>
                  <p className="text-sm">Confiance min : {mlConfig?.minConfidenceScore}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suggestions IA */}
        <TabsContent value="suggestions">
          <div className="space-y-4">
            {suggestions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  Aucune suggestion pour le moment
                </CardContent>
              </Card>
            ) : (
              suggestions.map((suggestion) => (
                <Card key={suggestion.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                      <span className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        {suggestion.type} - {suggestion.platform}
                      </span>
                      <Badge>Confiance : {Math.round(suggestion.confidence * 100)}%</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-3">{suggestion.reasoning}</p>
                    <div className="flex gap-2">
                      <Button size="sm">Accepter</Button>
                      <Button size="sm" variant="outline">
                        Refuser
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Anomalies */}
        <TabsContent value="anomalies">
          <div className="space-y-4">
            {anomalies.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  Aucune anomalie détectée ✅
                </CardContent>
              </Card>
            ) : (
              anomalies.map((anomaly) => (
                <Card key={anomaly.id} className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      {anomaly.description}
                      <Badge
                        className={
                          anomaly.severity === 'critical'
                            ? 'bg-red-500'
                            : anomaly.severity === 'high'
                              ? 'bg-orange-500'
                              : 'bg-yellow-500'
                        }
                      >
                        {anomaly.severity}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-2">
                      <p>Métrique : {anomaly.metric}</p>
                      <p>Attendu : {anomaly.expectedValue}</p>
                      <p>Actuel : {anomaly.actualValue}</p>
                      <div>
                        <p className="font-medium">Recommandations :</p>
                        <ul className="list-disc list-inside">
                          {anomaly.recommendations.map((rec: string, i: number) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
