'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Plus, Search, LayoutGrid, List, Calendar as CalendarIcon, Network } from 'lucide-react';
import { useToast } from '@/shared/components/ui/use-toast';
import { KanbanBoardView } from './components/KanbanBoardView';
import { TaskListView } from './components/TaskListView';
import { CalendarView } from './components/CalendarView';
import {
  getUnifiedPlanningData,
  initializeDefaultBoard,
  moveTask,
  TaskBoard,
  Task,
  UnifiedPlanningData,
} from './services/planning-api';
import * as taskService from '@/shared/services/tasks.service';

export default function UnifiedPlanningPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UnifiedPlanningData | null>(null);
  const [activeView, setActiveView] = useState<'kanban' | 'list' | 'calendar' | 'mindmap'>('list');
  const [selectedBoard, setSelectedBoard] = useState<TaskBoard | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    loadPlanningData();
  }, [searchQuery, statusFilter, priorityFilter]);

  const loadPlanningData = async () => {
    try {
      setLoading(true);
      const params: any = {
        viewType: activeView,
      };
      
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;

      const planningData = await getUnifiedPlanningData(params);
      setData(planningData);

      // Set default board for kanban view
      if (planningData.boards && planningData.boards.length > 0) {
        const defaultBoard = planningData.boards.find(b => b.isDefault) || planningData.boards[0];
        setSelectedBoard(defaultBoard);
      } else if (activeView === 'kanban') {
        // Initialize default board if none exists
        const newBoard = await initializeDefaultBoard();
        setSelectedBoard(newBoard as TaskBoard);
        await loadPlanningData(); // Reload to get updated data
      }
    } catch (error) {
      console.error('Error loading planning data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données de planification',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMoveTask = async (taskId: string, columnId: string, position: number) => {
    try {
      await moveTask({ taskId, columnId, position });
      toast({
        title: 'Succès',
        description: 'Tâche déplacée avec succès',
      });
    } catch (error) {
      console.error('Error moving task:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de déplacer la tâche',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleTaskClick = (task: Task) => {
    // TODO: Open task detail modal
    console.log('Task clicked:', task);
    toast({
      title: 'Tâche sélectionnée',
      description: task.title,
    });
  };

  const handleAddTask = (columnId?: string) => {
    // TODO: Open add task modal with columnId pre-filled
    console.log('Add task to column:', columnId);
    toast({
      title: 'Ajouter une tâche',
      description: 'Fonctionnalité à venir',
    });
  };

  const handleTaskComplete = async (taskId: string) => {
    try {
      await taskService.completeTask(taskId);
      toast({
        title: 'Succès',
        description: 'Tâche marquée comme terminée',
      });
      await loadPlanningData();
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de terminer la tâche',
        variant: 'destructive',
      });
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      toast({
        title: 'Succès',
        description: 'Tâche supprimée',
      });
      await loadPlanningData();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la tâche',
        variant: 'destructive',
      });
    }
  };

  const handleDateClick = (date: Date) => {
    console.log('Date clicked:', date);
    // TODO: Show day detail or create appointment
  };

  const handleAppointmentClick = (appointment: any) => {
    console.log('Appointment clicked:', appointment);
    // TODO: Open appointment detail
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Planification</h1>
          <p className="text-muted-foreground">
            Gérez vos tâches, rendez-vous et projets en un seul endroit
          </p>
        </div>
        <Button onClick={() => handleAddTask()}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle tâche
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="todo">À faire</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="done">Terminé</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes priorités</SelectItem>
            <SelectItem value="low">Basse</SelectItem>
            <SelectItem value="medium">Moyenne</SelectItem>
            <SelectItem value="high">Haute</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* View Tabs */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-2" />
            Liste
          </TabsTrigger>
          <TabsTrigger value="kanban">
            <LayoutGrid className="h-4 w-4 mr-2" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendrier
          </TabsTrigger>
          <TabsTrigger value="mindmap">
            <Network className="h-4 w-4 mr-2" />
            Mindmap
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          {data && (
            <TaskListView
              tasks={data.tasks}
              onTaskClick={handleTaskClick}
              onTaskComplete={handleTaskComplete}
              onTaskDelete={handleTaskDelete}
            />
          )}
        </TabsContent>

        <TabsContent value="kanban" className="mt-6">
          {selectedBoard ? (
            <KanbanBoardView
              board={selectedBoard}
              onMoveTask={handleMoveTask}
              onTaskClick={handleTaskClick}
              onAddTask={handleAddTask}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Aucun tableau disponible</p>
              <Button onClick={() => loadPlanningData()}>
                Créer un tableau
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          {data && (
            <CalendarView
              appointments={data.appointments}
              tasks={data.tasks}
              onDateClick={handleDateClick}
              onAppointmentClick={handleAppointmentClick}
            />
          )}
        </TabsContent>

        <TabsContent value="mindmap" className="mt-6">
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Network className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Vue Mindmap</h3>
            <p className="text-muted-foreground mb-4">
              Visualisez vos tâches et projets sous forme de carte mentale
            </p>
            <p className="text-sm text-muted-foreground">
              Cette fonctionnalité sera bientôt disponible
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Stats Footer */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold">{data.metadata.totalTasks}</div>
            <div className="text-sm text-muted-foreground">Tâches</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{data.metadata.totalAppointments}</div>
            <div className="text-sm text-muted-foreground">Rendez-vous</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{data.boards.length}</div>
            <div className="text-sm text-muted-foreground">Tableaux</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{data.views.length}</div>
            <div className="text-sm text-muted-foreground">Vues</div>
          </div>
        </div>
      )}
    </div>
  );
}
