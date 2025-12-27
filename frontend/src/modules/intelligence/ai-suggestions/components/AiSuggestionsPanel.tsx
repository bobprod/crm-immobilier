import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/components/ui/card';
import { Sparkles } from 'lucide-react';

export default function AiSuggestionsPanel() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-500" />
          Suggestions IA
        </CardTitle>
        <CardDescription>Suggestions intelligentes pour vos prospects et biens.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="p-4 bg-purple-50 rounded-full">
            <Sparkles className="h-12 w-12 text-purple-500" />
          </div>
          <h3 className="text-lg font-semibold">Module en développement</h3>
          <p className="text-muted-foreground max-w-sm">
            L'IA analysera bientôt vos données pour vous proposer des actions pertinentes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
