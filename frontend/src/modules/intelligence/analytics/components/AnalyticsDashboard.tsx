import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsDashboard() {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-blue-500" />
                    Analytics & Rapports
                </CardTitle>
                <CardDescription>
                    Vue d'ensemble des performances de votre agence.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="p-4 bg-blue-50 rounded-full">
                        <BarChart3 className="h-12 w-12 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold">Tableaux de bord en construction</h3>
                    <p className="text-muted-foreground max-w-sm">
                        Visualisez bientôt vos KPIs, conversions et performances en temps réel.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
