import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { FileText } from 'lucide-react';

export default function DocumentManager() {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-6 w-6 text-orange-500" />
                    Gestion Documentaire
                </CardTitle>
                <CardDescription>
                    Gérez, générez et signez vos documents immobiliers.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="p-4 bg-orange-50 rounded-full">
                        <FileText className="h-12 w-12 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-semibold">GED en développement</h3>
                    <p className="text-muted-foreground max-w-sm">
                        Bientôt : génération automatique de contrats, signature électronique et OCR.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
