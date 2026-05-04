'use client';

import { useState } from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import {
  MapPin,
  Flame,
  AlertTriangle,
  ExternalLink,
  Building2,
  Trees,
  PlusCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import type { PepiteOpportunity } from '../api/pepite.api';
import { pepiteApi } from '../api/pepite.api';

interface PepiteCardProps {
  opportunity: PepiteOpportunity;
}

const SCORE_COLORS: Record<PepiteOpportunity['scoreLabel'], string> = {
  PÉPITE: 'bg-orange-500 text-white',
  BONNE: 'bg-green-500 text-white',
  NORMALE: 'bg-blue-500 text-white',
  FAIBLE: 'bg-gray-400 text-white',
};

const SCORE_BORDER: Record<PepiteOpportunity['scoreLabel'], string> = {
  PÉPITE: 'border-orange-400 shadow-orange-100 shadow-md',
  BONNE: 'border-green-400',
  NORMALE: 'border-blue-300',
  FAIBLE: 'border-gray-200',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  terrain: <Trees className="h-4 w-4" />,
  immeuble: <Building2 className="h-4 w-4" />,
};

export function PepiteCard({ opportunity: o }: PepiteCardProps) {
  const [addState, setAddState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const handleAddToCrm = async () => {
    setAddState('loading');
    try {
      await pepiteApi.addToCrm({
        title: o.title,
        prix: o.prix,
        surface: o.surface,
        location: o.location,
        url: o.url,
        country: o.country,
      });
      setAddState('done');
    } catch {
      setAddState('error');
      setTimeout(() => setAddState('idle'), 2000);
    }
  };

  return (
    <Card className={`border-2 transition-all hover:shadow-lg ${SCORE_BORDER[o.scoreLabel]}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {TYPE_ICONS[o.type] ?? <Building2 className="h-4 w-4" />}
              <span className="text-xs text-muted-foreground font-medium">{o.source}</span>
            </div>
            <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">
              {o.title}
            </CardTitle>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge className={`text-xs font-bold ${SCORE_COLORS[o.scoreLabel]}`}>
              {o.scoreLabel === 'PÉPITE' && <Flame className="h-3 w-3 mr-1" />}
              {o.scoreLabel === 'PÉPITE' ? 'HOT SPOT' : o.scoreLabel}
            </Badge>
            <span className="text-lg font-bold text-foreground">{o.score}/100</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Localisation + infos */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {o.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {o.location}
            </span>
          )}
          {o.surface && <span>📐 {o.surface}</span>}
          {o.prix && <span className="font-semibold text-foreground">💰 {o.prix}</span>}
        </div>

        {/* Vocation PAU */}
        {o.vocation && (
          <Badge variant={o.isUrbain ? 'default' : 'secondary'} className="text-xs">
            {o.isUrbain ? '🏙️ Zone Urbaine' : '🌿 Zone non-urbaine'} — {o.vocation}
          </Badge>
        )}

        {/* Risques */}
        {o.risques.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-orange-600">
            <AlertTriangle className="h-3 w-3" />
            <span>{o.risques.slice(0, 2).join(', ')}</span>
          </div>
        )}

        {/* Barre de score */}
        <div>
          <Progress value={o.score} className="h-1.5" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1 flex-wrap gap-y-0.5">
            {o.scoreDetails.map((d) => (
              <span key={d.critere} className={d.ok ? 'text-green-600' : 'text-gray-400'} title={d.critere}>
                {d.ok ? '✓' : '○'} {d.points}pts
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {o.url && (
            <a
              href={o.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Voir la source
            </a>
          )}

          <Button
            size="sm"
            variant={addState === 'done' ? 'default' : 'outline'}
            className={`ml-auto h-7 text-xs gap-1.5 ${addState === 'done' ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' : ''}`}
            onClick={handleAddToCrm}
            disabled={addState === 'loading' || addState === 'done'}
          >
            {addState === 'loading' && <Loader2 className="h-3 w-3 animate-spin" />}
            {addState === 'done' && <CheckCircle2 className="h-3 w-3" />}
            {addState === 'idle' && <PlusCircle className="h-3 w-3" />}
            {addState === 'idle' && 'Ajouter au CRM'}
            {addState === 'loading' && 'Ajout...'}
            {addState === 'done' && 'Ajouté !'}
            {addState === 'error' && 'Erreur'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
