import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/components/ui/card';
import { Plug } from 'lucide-react';

export default function IntegrationsPanel() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plug className="h-6 w-6 text-gray-700" />
          Intégrations & API
        </CardTitle>
        <CardDescription>Connectez vos outils préférés à votre CRM.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="p-4 bg-gray-100 rounded-full">
            <Plug className="h-12 w-12 text-gray-700" />
          </div>
          <h3 className="text-lg font-semibold">Marketplace d'Apps</h3>
          <p className="text-muted-foreground max-w-sm">
            Google, Outlook, WhatsApp, Facebook et bien plus encore.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
