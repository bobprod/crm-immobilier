import React from 'react';
import { MatchingList } from './MatchingList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { GitMerge, Sparkles } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import matchingService from '../matching.service';

export default function MatchingPanel() {
    const handleGenerate = async () => {
        await matchingService.generateMatches();
        window.location.reload(); // Simple reload to refresh list
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <GitMerge className="h-6 w-6 text-green-500" />
                            Matching Intelligent
                        </CardTitle>
                        <CardDescription>
                            Correspondances automatiques entre vos biens et vos prospects.
                        </CardDescription>
                    </div>
                    <Button onClick={handleGenerate}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Générer les Matchs
                    </Button>
                </CardHeader>
                <CardContent>
                    <MatchingList />
                </CardContent>
            </Card>
        </div>
    );
}
