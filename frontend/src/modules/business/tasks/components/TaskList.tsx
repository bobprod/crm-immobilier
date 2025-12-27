import React, { useEffect, useState, useCallback } from 'react';
import tasksService, { Task, CreateTaskDto, UpdateTaskDto } from '../tasks.service';
import { TaskItem } from './TaskItem';
import { TaskDialog } from './TaskDialog';
import { Button } from '@/shared/components/ui/button';
import { Plus, Loader2, Filter } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useToast } from '@/shared/components/ui/use-toast';
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog';

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { toast } = useToast();

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void | Promise<void>;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: async () => {},
  });

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
    try {
      console.log('[TaskList] Creating/updating task with data:', data);
      if (selectedTask) {
        console.log('[TaskList] Updating task:', selectedTask.id);
        await tasksService.update(selectedTask.id, data);
        toast({
          title: 'Succès',
          description: '✅ Tâche mise à jour avec succès',
        });
      } else {
        console.log('[TaskList] Creating new task');
        await tasksService.create(data);
        toast({
          title: 'Succès',
          description: '✅ Tâche créée avec succès',
        });
      }
      loadTasks();
      setSelectedTask(null);
    } catch (error: any) {
      console.error('[TaskList] Error creating/updating task:', error);
      console.error('[TaskList] Error details:', error.response?.data);
      toast({
        title: 'Erreur',
        description:
          error.response?.data?.message ||
          error.message ||
          'Erreur lors de la sauvegarde de la tâche',
        variant: 'destructive',
      });
      throw error; // Re-throw pour que TaskDialog puisse aussi gérer l'erreur
    }
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  const handleDelete = useCallback(
    (task: Task) => {
      setConfirmDialog({
        open: true,
        title: 'Supprimer la tâche',
        description: `Êtes-vous sûr de vouloir supprimer "${task.title}" ? Cette action est irréversible.`,
        onConfirm: async () => {
          try {
            await tasksService.remove(task.id);
            await loadTasks();
            toast({
              title: 'Succès',
              description: '✅ Tâche supprimée avec succès',
            });
          } catch (error: any) {
            toast({
              title: 'Erreur',
              description: error.message || 'Erreur lors de la suppression de la tâche',
              variant: 'destructive',
            });
          }
        },
      });
    },
    [toast]
  );

  const handleComplete = async (id: string) => {
    await tasksService.complete(id);
    loadTasks();
  };

  const filteredTasks = tasks.filter((task) => {
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

        <Button
          onClick={() => {
            setSelectedTask(null);
            setIsDialogOpen(true);
          }}
        >
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
          <Button variant="link" onClick={() => setIsDialogOpen(true)}>
            Créer une première tâche
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
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

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant="destructive"
      />
    </div>
  );
}
