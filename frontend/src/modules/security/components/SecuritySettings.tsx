import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Lock } from 'lucide-react';

export default function SecuritySettings() {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lock className="h-6 w-6 text-red-700" />
                    Sécurité & Accès
                </CardTitle>
                <CardDescription>
                    Gérez les permissions et la sécurité de votre compte.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="p-4 bg-red-50 rounded-full">
                        <Lock className="h-12 w-12 text-red-700" />
                    </div>
                    <h3 className="text-lg font-semibold">Centre de Sécurité</h3>
                    <p className="text-muted-foreground max-w-sm">
                        2FA, logs d'activité, gestion des rôles et permissions avancées.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
