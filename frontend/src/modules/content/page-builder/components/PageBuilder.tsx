import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { LayoutTemplate } from 'lucide-react';

export default function PageBuilder() {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <LayoutTemplate className="h-6 w-6 text-indigo-500" />
                    Constructeur de Pages
                </CardTitle>
                <CardDescription>
                    Créez des landing pages personnalisées pour vos biens.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="p-4 bg-indigo-50 rounded-full">
                        <LayoutTemplate className="h-12 w-12 text-indigo-500" />
                    </div>
                    <h3 className="text-lg font-semibold">Page Builder</h3>
                    <p className="text-muted-foreground max-w-sm">
                        Un éditeur drag & drop pour créer des vitrines exceptionnelles arrive bientôt.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
