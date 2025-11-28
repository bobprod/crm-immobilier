import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Megaphone } from 'lucide-react';

export default function CampaignManager() {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-6 w-6 text-pink-500" />
                    Marketing Automation
                </CardTitle>
                <CardDescription>
                    Créez et gérez vos campagnes marketing multicanal.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="p-4 bg-pink-50 rounded-full">
                        <Megaphone className="h-12 w-12 text-pink-500" />
                    </div>
                    <h3 className="text-lg font-semibold">Marketing Suite</h3>
                    <p className="text-muted-foreground max-w-sm">
                        Newsletters, séquences d'emails et campagnes SMS automatisées.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
