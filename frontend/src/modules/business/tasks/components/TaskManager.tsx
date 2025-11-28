import React from 'react';
import { TaskList } from './TaskList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { CheckSquare } from 'lucide-react';

export default function TaskManager() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckSquare className="h-6 w-6 text-teal-500" />
                        Gestion des Tâches
                    </CardTitle>
                    <CardDescription>
                        Suivez vos tâches, rappels et priorités quotidiennes.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TaskList />
                </CardContent>
            </Card>
        </div>
    );
}
