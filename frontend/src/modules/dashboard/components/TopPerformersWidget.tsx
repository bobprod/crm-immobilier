import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../shared/components/ui/tabs';
import { Building2, Users, Target, TrendingUp, Eye } from 'lucide-react';
import type { TopPerformers } from '../types/dashboard.types';

interface TopPerformersProps {
  performers: TopPerformers;
}

export function TopPerformersWidget({ performers }: TopPerformersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performers</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="properties" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="properties">Propriétés</TabsTrigger>
            <TabsTrigger value="prospects">Prospects</TabsTrigger>
            <TabsTrigger value="matches">Matchs</TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="space-y-4">
            {performers.topProperties.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Aucune propriété</p>
            ) : (
              performers.topProperties.map((property) => (
                <div
                  key={property.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{property.title}</p>
                      <p className="text-sm text-gray-500">{property.price.toLocaleString()} €</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Eye className="h-4 w-4 mr-1" />
                      {property.viewsCount}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Target className="h-4 w-4 mr-1" />
                      {property._count.matches}
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="prospects" className="space-y-4">
            {performers.topProspects.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Aucun prospect</p>
            ) : (
              performers.topProspects.map((prospect) => (
                <div
                  key={prospect.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">
                        {prospect.firstName} {prospect.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        Budget: {prospect.budget.toLocaleString()} €
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-600">{prospect.score}</span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="matches" className="space-y-4">
            {performers.topMatches.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Aucun match</p>
            ) : (
              performers.topMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <Target className="h-5 w-5 text-pink-600" />
                    <div>
                      <p className="font-medium">{match.properties.title}</p>
                      <p className="text-sm text-gray-500">
                        {match.prospects.firstName} {match.prospects.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold px-2 py-1 bg-pink-100 text-pink-800 rounded">
                      Score: {match.score}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
