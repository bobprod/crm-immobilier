import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { appointmentsAPI, tasksAPI } from '@/shared/utils/api-client-backend';
import {
  getTaskBoards,
  initializeDefaultBoard,
  moveTask,
  getUnifiedPlanningData,
  TaskBoard,
  Task,
} from '@/modules/planning/services/planning-api';
import { CalendarView } from '@/modules/planning/components/CalendarView';
import { KanbanBoardView } from '@/modules/planning/components/KanbanBoardView';
import { TaskListView } from '@/modules/planning/components/TaskListView';

type ViewMode = 'list' | 'calendar' | 'kanban';
type DataTab = 'all' | 'appointments' | 'tasks';

interface PlanificationDashboardProps {
  language?: 'fr' | 'en';
}

interface Filters {
  status: string;
  priority: string;
  search: string;
}

export const PlanificationDashboard: React.FC<PlanificationDashboardProps> = ({
  language = 'fr',
}) => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [dataTab, setDataTab] = useState<DataTab>('all');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [board, setBoard] = useState<TaskBoard | null>(null);
  const [aptStats, setAptStats] = useState<any>(null);
  const [taskStats, setTaskStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ status: '', priority: '', search: '' });
  const [showFilters, setShowFilters] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiFilters: Record<string, string> = {};
      if (filters.status) apiFilters.status = filters.status;
      if (filters.priority) apiFilters.priority = filters.priority;

      const promises: Promise<any>[] = [];

      if (dataTab !== 'tasks') {
        promises.push(appointmentsAPI.getAll(apiFilters));
        promises.push(appointmentsAPI.getStats());
      }
      if (dataTab !== 'appointments') {
        promises.push(tasksAPI.getAll(apiFilters));
        promises.push(tasksAPI.getStats());
      }

      const results = await Promise.all(promises);
      let idx = 0;

      if (dataTab !== 'tasks') {
        setAppointments(results[idx]?.data || []);
        idx++;
        setAptStats(results[idx]?.data || null);
        idx++;
      } else {
        setAppointments([]);
        setAptStats(null);
      }

      if (dataTab !== 'appointments') {
        setTasks(results[idx]?.data || []);
        idx++;
        setTaskStats(results[idx]?.data || null);
        idx++;
      } else {
        setTasks([]);
        setTaskStats(null);
      }

      if (viewMode === 'kanban') {
        try {
          const boards = await getTaskBoards();
          if (boards.length > 0) {
            setBoard(boards[0]);
          } else {
            const defaultBoard = await initializeDefaultBoard();
            setBoard(defaultBoard);
          }
        } catch {
          setBoard(null);
        }
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.message || 'Erreur de chargement des données');
    } finally {
      setLoading(false);
    }
  }, [dataTab, viewMode, filters.status, filters.priority]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredAppointments = appointments.filter((apt) => {
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (!apt.title?.toLowerCase().includes(s) && !apt.location?.toLowerCase().includes(s))
        return false;
    }
    return true;
  });

  const filteredTasks = tasks.filter((task) => {
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (!task.title?.toLowerCase().includes(s) && !task.description?.toLowerCase().includes(s))
        return false;
    }
    return true;
  });

  const handleMoveTask = async (taskId: string, columnId: string, position: number) => {
    await moveTask({ taskId, columnId, position });
    loadData();
  };

  const handleTaskComplete = async (taskId: string) => {
    await tasksAPI.complete(taskId);
    loadData();
  };

  const handleTaskDelete = async (taskId: string) => {
    if (confirm('Supprimer cette tâche ?')) {
      await tasksAPI.delete(taskId);
      loadData();
    }
  };

  const viewModes: { id: ViewMode; label: string; icon: string }[] = [
    { id: 'list', label: 'Liste', icon: '☰' },
    { id: 'calendar', label: 'Calendrier', icon: '📅' },
    { id: 'kanban', label: 'Kanban', icon: '▦' },
  ];

  const dataTabs: { id: DataTab; label: string }[] = [
    { id: 'all', label: 'Tout' },
    { id: 'appointments', label: 'Rendez-vous' },
    { id: 'tasks', label: 'Tâches' },
  ];

  return (
    <div className="space-y-6">
      {/* Header avec vues + actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {viewModes.map((v) => (
            <button
              key={v.id}
              onClick={() => setViewMode(v.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                viewMode === v.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span>{v.icon}</span> {v.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
              showFilters || filters.status || filters.priority || filters.search
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            🔍 Filtres {(filters.status || filters.priority || filters.search) && '•'}
          </button>
          <button
            onClick={() => router.push('/appointments/new')}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all shadow-sm"
          >
            + Rendez-vous
          </button>
          <button
            onClick={() => router.push('/tasks?action=new')}
            className="px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 transition-all shadow-sm"
          >
            + Tâche
          </button>
        </div>
      </div>

      {/* Filtres */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Recherche</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Rechercher..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous</option>
              <option value="scheduled">Planifié</option>
              <option value="confirmed">Confirmé</option>
              <option value="completed">Terminé</option>
              <option value="cancelled">Annulé</option>
              <option value="todo">À faire</option>
              <option value="in_progress">En cours</option>
              <option value="done">Fait</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Priorité</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes</option>
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
          <button
            onClick={() => setFilters({ status: '', priority: '', search: '' })}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Réinitialiser
          </button>
        </div>
      )}

      {/* Onglets données */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {dataTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setDataTab(tab.id)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              dataTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats compactes */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {aptStats && dataTab !== 'tasks' && (
          <>
            <div className="bg-white rounded-lg border p-3">
              <p className="text-xs text-gray-500">RDV total</p>
              <p className="text-xl font-bold text-blue-600">{aptStats.total || 0}</p>
            </div>
            <div className="bg-white rounded-lg border p-3">
              <p className="text-xs text-gray-500">Présence</p>
              <p className="text-xl font-bold text-green-600">{aptStats.attendanceRate || 0}%</p>
            </div>
          </>
        )}
        {taskStats && dataTab !== 'appointments' && (
          <>
            <div className="bg-white rounded-lg border p-3">
              <p className="text-xs text-gray-500">Tâches</p>
              <p className="text-xl font-bold text-cyan-600">{taskStats.total || 0}</p>
            </div>
            <div className="bg-white rounded-lg border p-3">
              <p className="text-xs text-gray-500">En cours</p>
              <p className="text-xl font-bold text-yellow-600">{taskStats.inProgress || 0}</p>
            </div>
            <div className="bg-white rounded-lg border p-3">
              <p className="text-xs text-gray-500">Terminées</p>
              <p className="text-xl font-bold text-green-600">{taskStats.done || 0}</p>
            </div>
            <div className="bg-white rounded-lg border p-3">
              <p className="text-xs text-gray-500">En retard</p>
              <p className="text-xl font-bold text-red-600">{taskStats.overdue || 0}</p>
            </div>
          </>
        )}
      </div>

      {/* Erreur */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Contenu principal */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600" />
            <span className="ml-3 text-gray-500">Chargement...</span>
          </div>
        ) : viewMode === 'calendar' ? (
          <CalendarView
            appointments={filteredAppointments}
            tasks={filteredTasks}
            onDateClick={(date) => {
              router.push(`/appointments/new?date=${date.toISOString().split('T')[0]}`);
            }}
            onAppointmentClick={(apt) => {
              router.push(`/appointments/${apt.id}`);
            }}
          />
        ) : viewMode === 'kanban' && board ? (
          <KanbanBoardView
            board={board}
            onMoveTask={handleMoveTask}
            onTaskClick={(task) => router.push(`/tasks?id=${task.id}`)}
            onAddTask={(columnId) => router.push(`/tasks?action=new&columnId=${columnId}`)}
          />
        ) : viewMode === 'kanban' && !board ? (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">▦</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun tableau Kanban</h2>
            <p className="text-gray-500 mb-6">Initialisez votre premier tableau</p>
            <button
              onClick={async () => {
                const b = await initializeDefaultBoard();
                setBoard(b);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold"
            >
              Créer le tableau par défaut
            </button>
          </div>
        ) : (
          /* Vue Liste */
          <div className="space-y-6">
            {/* Rendez-vous en liste */}
            {dataTab !== 'tasks' && filteredAppointments.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Rendez-vous ({filteredAppointments.length})
                </h3>
                <div className="space-y-2">
                  {filteredAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => router.push(`/appointments/${apt.id}`)}
                      className="flex items-center gap-4 p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                      style={{ borderLeft: `4px solid ${apt.color || '#3B82F6'}` }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">{apt.title}</h4>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {apt.status}
                          </span>
                          {apt.type && <span className="text-xs text-gray-400">{apt.type}</span>}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            📅{' '}
                            {new Date(apt.startTime).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {apt.location && <span>📍 {apt.location}</span>}
                          {apt.prospects && (
                            <span>
                              👤 {apt.prospects.firstName} {apt.prospects.lastName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tâches en liste avancée */}
            {dataTab !== 'appointments' && filteredTasks.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Tâches ({filteredTasks.length})
                </h3>
                <TaskListView
                  tasks={filteredTasks}
                  onTaskClick={(task) => router.push(`/tasks?id=${task.id}`)}
                  onTaskComplete={handleTaskComplete}
                  onTaskDelete={handleTaskDelete}
                />
              </div>
            )}

            {/* État vide */}
            {filteredAppointments.length === 0 && filteredTasks.length === 0 && (
              <div className="text-center py-20">
                <p className="text-6xl mb-4">
                  {dataTab === 'appointments' ? '📅' : dataTab === 'tasks' ? '✓' : '📋'}
                </p>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {filters.search || filters.status || filters.priority
                    ? 'Aucun résultat'
                    : 'Rien de planifié'}
                </h2>
                <p className="text-gray-500 mb-6">
                  {filters.search || filters.status || filters.priority
                    ? 'Essayez de modifier vos filtres'
                    : 'Commencez par créer un rendez-vous ou une tâche'}
                </p>
                {!filters.search && !filters.status && !filters.priority && (
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => router.push('/appointments/new')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold"
                    >
                      Créer un rendez-vous
                    </button>
                    <button
                      onClick={() => router.push('/tasks?action=new')}
                      className="px-6 py-3 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-all font-semibold"
                    >
                      Créer une tâche
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanificationDashboard;
