import React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { BarChart3, ArrowRight } from 'lucide-react';

export default function AnalyticsDashboard() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-blue-500" />
          Analytics & Rapports
        </CardTitle>
        <CardDescription>Analyser vos performances et votre funnel de conversion.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="p-4 bg-blue-50 rounded-full">
            <BarChart3 className="h-12 w-12 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold">Tableaux de bord Analytics</h3>
          <p className="text-muted-foreground max-w-sm">
            Visualisez vos KPIs, conversions et performances en temps réel avec nos 4 dashboards spécialisés.
          </p>
          <Link href="/analytics">
            <Button className="mt-4">
              Voir les stats <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
