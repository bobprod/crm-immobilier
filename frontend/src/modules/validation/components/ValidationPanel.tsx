import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export default function ValidationPanel() {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-6 w-6 text-emerald-600" />
                    Validation de Données
                </CardTitle>
                <CardDescription>
                    Vérification automatique des emails et téléphones.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="p-4 bg-emerald-50 rounded-full">
                        <ShieldCheck className="h-12 w-12 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold">Qualité des Données</h3>
                    <p className="text-muted-foreground max-w-sm">
                        Nettoyage automatique de votre base de contacts pour une meilleure délivrabilité.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
