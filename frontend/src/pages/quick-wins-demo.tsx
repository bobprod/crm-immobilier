import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { SmartInput } from '@/modules/intelligence/smart-forms';
import { SemanticSearchBar } from '@/modules/intelligence/semantic-search';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Badge } from '@/shared/components/ui/badge';

export default function QuickWinsDemoPage() {
  const [city, setCity] = useState('');
  const [firstName, setFirstName] = useState('');

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Quick Wins Modules - Demo</h1>
          <p className="text-gray-600">
            Démonstration des nouveaux modules d'intelligence artificielle
          </p>
        </div>

        <Tabs defaultValue="search" className="w-full">
          <TabsList>
            <TabsTrigger value="search">Recherche Sémantique</TabsTrigger>
            <TabsTrigger value="forms">Smart Forms</TabsTrigger>
            <TabsTrigger value="info">Informations</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>🔍 Recherche Sémantique</CardTitle>
                <CardDescription>
                  Recherchez en langage naturel à travers toutes vos données
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SemanticSearchBar
                  placeholder="Ex: appartement vue mer La Marsa budget 300K"
                  searchType="all"
                />
                <div className="mt-4 text-sm text-gray-600">
                  <p className="font-medium mb-2">Exemples de recherches :</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>appartement vue mer pas cher</li>
                    <li>villa moderne avec piscine près écoles</li>
                    <li>prospect budget 300K La Marsa</li>
                    <li>rendez-vous cette semaine</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>📝 Smart Forms Auto-Fill</CardTitle>
                <CardDescription>
                  Auto-complétion intelligente basée sur votre historique
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ville (tapez "La" pour voir les suggestions)
                  </label>
                  <SmartInput
                    fieldName="city"
                    formType="prospect"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: La Marsa, La Soukra..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Prénom (tapez un prénom pour auto-fill)
                  </label>
                  <SmartInput
                    fieldName="firstName"
                    formType="prospect"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ex: Ahmed, Mohamed..."
                  />
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    💡 <strong>Astuce :</strong> Les suggestions sont triées par fréquence
                    d'utilisation et incluent la date de dernière utilisation.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>📊 Modules Disponibles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Smart Forms Auto-Fill</span>
                    <Badge variant="success">Actif</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Recherche Sémantique</span>
                    <Badge variant="success">Actif</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Priority Inbox</span>
                    <Badge variant="success">Actif</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Auto-Reports</span>
                    <Badge variant="success">Actif</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🚀 Pages Disponibles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <a
                    href="/priority-inbox"
                    className="block p-2 hover:bg-gray-100 rounded transition-colors"
                  >
                    → Boîte Prioritaire (/priority-inbox)
                  </a>
                  <a
                    href="/reports"
                    className="block p-2 hover:bg-gray-100 rounded transition-colors"
                  >
                    → Rapports Automatiques (/reports)
                  </a>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>📈 ROI & Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">77.5h</div>
                    <div className="text-sm text-gray-600">Temps économisé/mois</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">4.80€</div>
                    <div className="text-sm text-gray-600">Coût opérationnel/mois</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">16,146%</div>
                    <div className="text-sm text-gray-600">ROI</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">161x</div>
                    <div className="text-sm text-gray-600">Retour investissement</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
