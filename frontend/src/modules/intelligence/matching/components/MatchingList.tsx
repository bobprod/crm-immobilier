import React, { useEffect, useState } from 'react';
import matchingService, { Match } from '../matching.service';
import { MatchScore } from './MatchScore';
import { Card, CardContent, CardFooter } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Check, X, Mail, Phone, Loader2 } from 'lucide-react';

export function MatchingList() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const data = await matchingService.findAll();
      setMatches(data);
    } catch (error) {
      console.error('Erreur chargement matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: string) => {
    await matchingService.performAction(id, action);
    loadMatches();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
        <p className="text-gray-500">Aucun match trouvé pour le moment.</p>
        <Button variant="link" onClick={() => matchingService.generateMatches().then(loadMatches)}>
          Générer des matchs
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {matches.map((match) => (
        <Card key={match.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold truncate w-40">
                  {match.prospects?.firstName} {match.prospects?.lastName}
                </h3>
                <p className="text-sm text-gray-500 truncate w-40">{match.properties?.title}</p>
              </div>
              <MatchScore score={match.score} />
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex flex-wrap gap-1">
                {match.reasons?.pros?.slice(0, 2).map((reason, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-green-50 text-green-700">
                    + {reason}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-gray-50 p-2 flex justify-between">
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => handleAction(match.id, 'email')}>
                <Mail className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleAction(match.id, 'call')}>
                <Phone className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="text-red-600"
                onClick={() => handleAction(match.id, 'reject')}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-green-600"
                onClick={() => handleAction(match.id, 'accept')}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
