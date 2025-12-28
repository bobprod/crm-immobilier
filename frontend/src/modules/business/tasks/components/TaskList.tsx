import React, { useEffect, useState, useCallback } from 'react';
import tasksService, { Task, CreateTaskDto, UpdateTaskDto } from '../tasks.service';
import { TaskItem } from './TaskItem';
import { TaskDialog } from './TaskDialog';
import { Button } from '@/shared/components/ui/button';
import { Plus, Loader2, Filter, Search, ChevronLeft, ChevronRight, Trash2, CheckCircle } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useToast } from '@/shared/components/ui/use-toast';
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog';

const ITEMS_PER_PAGE = 50;

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
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
      if (selectedTask) {
        await tasksService.update(selectedTask.id, data);
        toast({
          title: 'Succès',
          description: '✅ Tâche mise à jour avec succès',
        });
      } else {
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
    try {
      await tasksService.complete(id);
      toast({
        title: 'Succès',
        description: '✅ Tâche marquée comme terminée',
      });
      loadTasks();
    } catch (error: any) {
      console.error('[TaskList] Error completing task:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de marquer la tâche comme terminée',
        variant: 'destructive',
      });
    }
  };

  // Bulk selection handlers
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const toggleAllTasksSelection = () => {
    if (selectedTaskIds.size === paginatedTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(paginatedTasks.map((t) => t.id)));
    }
  };

  const clearSelection = () => {
    setSelectedTaskIds(new Set());
  };

  const handleBulkDelete = async () => {
    const count = selectedTaskIds.size;
    setConfirmDialog({
      open: true,
      title: 'Supprimer les tâches sélectionnées',
      description: `Êtes-vous sûr de vouloir supprimer ${count} tâche${count > 1 ? 's' : ''} ? Cette action est irréversible.`,
      onConfirm: async () => {
        try {
          await Promise.all(Array.from(selectedTaskIds).map((id) => tasksService.remove(id)));
          await loadTasks();
          clearSelection();
          toast({
            title: 'Succès',
            description: `✅ ${count} tâche${count > 1 ? 's supprimées' : ' supprimée'} avec succès`,
          });
        } catch (error: any) {
          toast({
            title: 'Erreur',
            description: error.message || 'Erreur lors de la suppression des tâches',
            variant: 'destructive',
          });
        }
      },
    });
  };

  const handleBulkComplete = async () => {
    const count = selectedTaskIds.size;
    try {
      await Promise.all(Array.from(selectedTaskIds).map((id) => tasksService.complete(id)));
      await loadTasks();
      clearSelection();
      toast({
        title: 'Succès',
        description: `✅ ${count} tâche${count > 1 ? 's marquées' : ' marquée'} comme terminée${count > 1 ? 's' : ''}`,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la mise à jour des tâches',
        variant: 'destructive',
      });
    }
  };

  const filteredTasks = tasks.filter((task) => {
    // Filter by status
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;

    // Filter by search query (title or description)
    const searchMatch =
      searchQuery === '' ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return statusMatch && searchMatch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);
  const showPagination = filteredTasks.length > ITEMS_PER_PAGE;

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Rechercher par titre ou description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

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
        <>
          {selectedTaskIds.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedTaskIds.size === paginatedTasks.length}
                  onCheckedChange={toggleAllTasksSelection}
                />
                <span className="text-sm font-medium">
                  {selectedTaskIds.size} tâche{selectedTaskIds.size > 1 ? 's' : ''} sélectionnée
                  {selectedTaskIds.size > 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleBulkComplete}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Marquer comme terminé
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Annuler
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {paginatedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onComplete={handleComplete}
                isSelected={selectedTaskIds.has(task.id)}
                onToggleSelection={toggleTaskSelection}
              />
            ))}
          </div>

          {showPagination && (
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-gray-500">
                Affichage de {startIndex + 1} à {Math.min(endIndex, filteredTasks.length)} sur{' '}
                {filteredTasks.length} tâche{filteredTasks.length > 1 ? 's' : ''}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>

                <div className="text-sm">
                  Page {currentPage} sur {totalPages}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
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
