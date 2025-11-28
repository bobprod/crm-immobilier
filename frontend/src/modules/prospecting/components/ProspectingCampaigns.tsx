import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Target } from 'lucide-react';

export default function ProspectingCampaigns() {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-6 w-6 text-red-500" />
                    Campagnes de Prospection
                </CardTitle>
                <CardDescription>
                    Automatisez votre recherche de nouveaux mandats.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="p-4 bg-red-50 rounded-full">
                        <Target className="h-12 w-12 text-red-500" />
                    </div>
                    <h3 className="text-lg font-semibold">Prospection Automatique</h3>
                    <p className="text-muted-foreground max-w-sm">
                        Scraping, qualification et contact automatique de leads immobiliers.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
