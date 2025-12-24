import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { SemanticSearchBar } from '@/modules/intelligence/semantic-search';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Search, Sparkles, Zap } from 'lucide-react';

export default function SemanticSearchPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Search className="h-8 w-8 text-blue-600" />
              Recherche Sémantique
            </h1>
            <p className="text-gray-600 mt-2">
              Recherchez en langage naturel à travers toutes vos données CRM
            </p>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
            <Sparkles className="h-3 w-3 mr-1" />
            Intelligence IA
          </Badge>
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-600 rounded-full p-2">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">Recherche Intelligente</h3>
                <p className="text-sm text-blue-800 mb-3">
                  Posez vos questions en langage naturel, comme si vous parliez à un assistant.
                  Le système comprend le contexte et trouve les résultats les plus pertinents.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">✨</span>
                    <span className="text-blue-800">Recherche dans toutes les entités</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">🎯</span>
                    <span className="text-blue-800">Résultats triés par pertinence</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">⚡</span>
                    <span className="text-blue-800">Suggestions automatiques</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">🔍</span>
                    <span className="text-blue-800">Compréhension du contexte</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Bar */}
        <Card>
          <CardHeader>
            <CardTitle>Essayez la Recherche Sémantique</CardTitle>
            <CardDescription>
              Tapez votre recherche en langage naturel ci-dessous
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SemanticSearchBar
              placeholder="Ex: appartement vue mer La Marsa budget 300K"
              searchType="all"
            />
          </CardContent>
        </Card>

        {/* Examples Section */}
        <Card>
          <CardHeader>
            <CardTitle>💡 Exemples de Recherches</CardTitle>
            <CardDescription>
              Essayez ces exemples pour voir la puissance de la recherche sémantique
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Property Examples */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  🏠 Propriétés
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <code className="text-sm text-gray-700">"appartement vue mer pas cher"</code>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <code className="text-sm text-gray-700">"villa moderne avec piscine La Marsa"</code>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <code className="text-sm text-gray-700">"studio meublé centre ville"</code>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <code className="text-sm text-gray-700">"maison jardin proche écoles"</code>
                  </div>
                </div>
              </div>

              {/* Prospect Examples */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  👤 Prospects
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <code className="text-sm text-gray-700">"prospect budget 300K La Marsa"</code>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <code className="text-sm text-gray-700">"clients qualifiés cette semaine"</code>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <code className="text-sm text-gray-700">"prospects cherchant appartement 3 pièces"</code>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <code className="text-sm text-gray-700">"nouveaux prospects budget élevé"</code>
                  </div>
                </div>
              </div>

              {/* Appointment Examples */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  📅 Rendez-vous
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <code className="text-sm text-gray-700">"rendez-vous cette semaine"</code>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <code className="text-sm text-gray-700">"visites confirmées demain"</code>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <code className="text-sm text-gray-700">"rendez-vous en attente"</code>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <code className="text-sm text-gray-700">"visites La Marsa ce mois"</code>
                  </div>
                </div>
              </div>

              {/* Mixed Examples */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  🔄 Recherches Mixtes
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <code className="text-sm text-gray-700">"tout ce qui concerne La Marsa"</code>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <code className="text-sm text-gray-700">"activité aujourd'hui"</code>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <code className="text-sm text-gray-700">"biens disponibles budget 400K"</code>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <code className="text-sm text-gray-700">"urgences à traiter"</code>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Card */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Avantages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">10x</div>
                <div className="text-sm text-gray-600">Plus rapide</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">95%</div>
                <div className="text-sm text-gray-600">Précision</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-sm text-gray-600">Filtres manuels</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">∞</div>
                <div className="text-sm text-gray-600">Possibilités</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Info */}
        <Card>
          <CardHeader>
            <CardTitle>🔧 Comment ça marche ?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600 min-w-[30px]">1.</span>
                <p>
                  <strong>Traitement du langage naturel:</strong> Votre requête est analysée pour
                  comprendre l'intention et extraire les concepts clés.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600 min-w-[30px]">2.</span>
                <p>
                  <strong>Recherche sémantique:</strong> Le système recherche dans toutes vos données
                  en comprenant le sens, pas juste les mots-clés.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600 min-w-[30px]">3.</span>
                <p>
                  <strong>Classement intelligent:</strong> Les résultats sont triés par pertinence
                  en tenant compte du contexte et de votre historique.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600 min-w-[30px]">4.</span>
                <p>
                  <strong>Navigation directe:</strong> Cliquez sur un résultat pour accéder
                  directement à la fiche détaillée.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
