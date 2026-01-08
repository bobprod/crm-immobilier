import React, { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, Clock, Lightbulb } from 'lucide-react';
import { priorityInboxApi, PriorityItem } from '@/shared/utils/quick-wins-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useRouter } from 'next/router';

export function PriorityInbox() {
  const [items, setItems] = useState<PriorityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'all' | 'prospects' | 'tasks'>('all');
  const router = useRouter();

  const loadPriorityItems = async (type: 'all' | 'prospects' | 'tasks' = 'all') => {
    setIsLoading(true);
    try {
      const data = await priorityInboxApi.getPriorityInbox({ type, limit: 20 });
      setItems(data);
    } catch (error) {
      console.error('Error loading priority inbox:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPriorityItems(selectedType);
  }, [selectedType]);

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getUrgencyIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'high':
        return <AlertCircle className="h-4 w-4" />;
      case 'medium':
        return <TrendingUp className="h-4 w-4" />;
      case 'low':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleItemClick = (item: PriorityItem) => {
    if (item.type === 'prospect') {
      router.push(`/prospects/${item.id}`);
    } else if (item.type === 'appointment') {
      router.push(`/appointments/${item.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Boîte Prioritaire</h2>
          <p className="text-gray-600 text-sm">Vos tâches et prospects les plus importants</p>
        </div>
        <Button onClick={() => loadPriorityItems(selectedType)} variant="outline" size="sm">
          Actualiser
        </Button>
      </div>

      <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
        <TabsList>
          <TabsTrigger value="all">Tout</TabsTrigger>
          <TabsTrigger value="prospects">Prospects</TabsTrigger>
          <TabsTrigger value="tasks">Rendez-vous</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedType} className="space-y-4 mt-4">
          {items.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Aucun élément prioritaire pour le moment
              </CardContent>
            </Card>
          ) : (
            items.map((item) => (
              <div key={item.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleItemClick(item)}>
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className={`${getUrgencyColor(item.urgencyLevel)} flex items-center gap-1`}
                          >
                            {getUrgencyIcon(item.urgencyLevel)}
                            {item.urgencyLevel === 'critical' && 'Critique'}
                            {item.urgencyLevel === 'high' && 'Haute'}
                            {item.urgencyLevel === 'medium' && 'Moyenne'}
                            {item.urgencyLevel === 'low' && 'Basse'}
                          </Badge>
                          <Badge variant="secondary">
                            {item.type === 'prospect' ? 'Prospect' : 'Rendez-vous'}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <CardDescription className="mt-1">{item.description}</CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{item.priorityScore}</div>
                        <div className="text-xs text-gray-500">score</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Reasons */}
                    {item.reasons && item.reasons.length > 0 && (
                      <div className="mb-3">
                        <div className="text-sm font-medium mb-2">Raisons:</div>
                        <div className="flex flex-wrap gap-2">
                          {item.reasons.map((reason, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommended Actions */}
                    {item.recommendedActions && item.recommendedActions.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-2 flex items-center gap-1">
                          <Lightbulb className="h-4 w-4 text-yellow-600" />
                          Actions recommandées:
                        </div>
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                          {item.recommendedActions.map((action, index) => (
                            <li key={index}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
