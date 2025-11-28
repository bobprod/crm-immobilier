import React, { useEffect, useState } from 'react';
import tasksService, { Task, CreateTaskDto, UpdateTaskDto } from '../tasks.service';
import { TaskItem } from './TaskItem';
import { TaskDialog } from './TaskDialog';
import { Button } from '@/shared/components/ui/button';
import { Plus, Loader2, Filter } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

export function TaskList() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            setLoading(true);
            const data = await tasksService.findAll();
            setTasks(data);
        } catch (error) {
            console.error('Erreur chargement tâches:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (data: CreateTaskDto) => {
        if (selectedTask) {
            await tasksService.update(selectedTask.id, data);
        } else {
            await tasksService.create(data);
        }
        loadTasks();
        setSelectedTask(null);
    };

    const handleEdit = (task: Task) => {
        setSelectedTask(task);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
            await tasksService.remove(id);
            loadTasks();
        }
    };

    const handleComplete = async (id: string) => {
        await tasksService.complete(id);
        loadTasks();
    };

    const filteredTasks = tasks.filter(task => {
        if (filterStatus === 'all') return true;
        return task.status === filterStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative w-64">
                        <Filter className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="pl-8">
                                <SelectValue placeholder="Filtrer par statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toutes les tâches</SelectItem>
                                <SelectItem value="todo">À faire</SelectItem>
                                <SelectItem value="in_progress">En cours</SelectItem>
                                <SelectItem value="done">Terminées</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Button onClick={() => { setSelectedTask(null); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Nouvelle Tâche
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                    <p className="text-gray-500">Aucune tâche trouvée</p>
                    <Button variant="link" onClick={() => setIsDialogOpen(true)}>Créer une première tâche</Button>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredTasks.map(task => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onComplete={handleComplete}
                        />
                    ))}
                </div>
            )}

            <TaskDialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) setSelectedTask(null);
                }}
                task={selectedTask}
                onSubmit={handleCreate}
            />
        </div>
    );
}
