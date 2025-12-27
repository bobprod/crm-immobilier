import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/components/ui/card';
import { Search } from 'lucide-react';

export default function SeoOptimizer() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-6 w-6 text-blue-600" />
          Optimisation SEO IA
        </CardTitle>
        <CardDescription>Améliorez votre visibilité sur les moteurs de recherche.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="p-4 bg-blue-50 rounded-full">
            <Search className="h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold">SEO Automatisé</h3>
          <p className="text-muted-foreground max-w-sm">
            L'IA optimisera bientôt vos descriptions et métadonnées pour Google.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
