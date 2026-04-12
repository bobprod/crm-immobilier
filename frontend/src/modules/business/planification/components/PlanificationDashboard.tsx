import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { appointmentsAPI, Appointment } from '@/shared/utils/appointments-api';
import tasksService, { Task, CreateTaskDto } from '@/modules/business/tasks/tasks.service';
import {
  getTaskBoards,
  initializeDefaultBoard,
  moveTask,
  TaskBoard,
} from '@/modules/planning/services/planning-api';
import { CalendarView } from '@/modules/planning/components/CalendarView';
import { KanbanBoardView } from '@/modules/planning/components/KanbanBoardView';
import {
  Calendar,
  CheckSquare,
  LayoutList,
  CalendarDays,
  Kanban,
  X,
  Search,
  Filter,
  RefreshCw,
  Clock,
  MapPin,
  AlertCircle,
  Trash2,
  Edit,
  CheckCircle,
  AlertTriangle,
  CalendarCheck,
  ListTodo,
  Target,
  Timer,
  CircleDot,
} from 'lucide-react';

type ViewMode = 'list' | 'calendar' | 'kanban';
type DataTab = 'all' | 'appointments' | 'tasks';
type SortOption = 'date-asc' | 'date-desc' | 'priority';

interface PlanificationDashboardProps {
  language?: 'fr' | 'en';
}

interface Filters {
  status: string;
  priority: string;
  search: string;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  rescheduled: 'bg-amber-100 text-amber-700',
  no_show: 'bg-red-100 text-red-700',
  todo: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  done: 'bg-emerald-100 text-emerald-700',
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Planifié',
  confirmed: 'Confirmé',
  completed: 'Terminé',
  cancelled: 'Annulé',
  rescheduled: 'Reporté',
  no_show: 'Absent',
  todo: 'À faire',
  in_progress: 'En cours',
  done: 'Fait',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  urgent: 'Urgente',
};

export const PlanificationDashboard: React.FC<PlanificationDashboardProps> = ({
  language = 'fr',
}) => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [dataTab, setDataTab] = useState<DataTab>('all');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [board, setBoard] = useState<TaskBoard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ status: '', priority: '', search: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<SortOption>('date-desc');

  // Modals
  const [showNewRdv, setShowNewRdv] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [taskMenuId, setTaskMenuId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // RDV form
  const [rdvForm, setRdvForm] = useState({
    title: '',
    type: 'visit' as Appointment['type'],
    priority: 'medium' as Appointment['priority'],
    startTime: '',
    endTime: '',
    location: '',
    description: '',
  });

  // Task form
  const [taskForm, setTaskForm] = useState<CreateTaskDto>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiFilters: Record<string, string> = {};
      if (filters.status) apiFilters.status = filters.status;
      if (filters.priority) apiFilters.priority = filters.priority;

      const [aptsData, tasksData] = await Promise.all([
        dataTab !== 'tasks' ? appointmentsAPI.getAll(apiFilters).catch(() => []) : Promise.resolve([]),
        dataTab !== 'appointments' ? tasksService.findAll(apiFilters as any).catch(() => []) : Promise.resolve([]),
      ]);

      setAppointments(Array.isArray(aptsData) ? aptsData : []);
      setTasks(Array.isArray(tasksData) ? tasksData : []);

      if (viewMode === 'kanban') {
        try {
          const boards = await getTaskBoards();
          if (boards.length > 0) {
            setBoard(boards[0]);
          } else {
            setBoard(null);
          }
        } catch {
          setBoard(null);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [dataTab, viewMode, filters.status, filters.priority]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter by search
  const filteredAppointments = appointments.filter((apt) => {
    if (!filters.search) return true;
    const s = filters.search.toLowerCase();
    return apt.title?.toLowerCase().includes(s) || apt.location?.toLowerCase().includes(s) || apt.description?.toLowerCase().includes(s);
  });

  const filteredTasks = tasks.filter((task) => {
    if (!filters.search) return true;
    const s = filters.search.toLowerCase();
    return task.title?.toLowerCase().includes(s) || task.description?.toLowerCase().includes(s);
  });

  // Stats
  const totalApts = appointments.length;
  const confirmedApts = appointments.filter(a => a.status === 'confirmed' || a.status === 'completed').length;
  const totalTasks = tasks.length;
  const todoTasks = tasks.filter(t => t.status === 'todo').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;

  // Today helper
  const today = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }, []);

  const formatLocalDateTime = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Sorting
  const sortedAppointments = useMemo(() => {
    const arr = [...filteredAppointments];
    switch (sort) {
      case 'date-asc': return arr.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      case 'date-desc': return arr.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      case 'priority': {
        const order: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
        return arr.sort((a, b) => (order[a.priority] ?? 2) - (order[b.priority] ?? 2));
      }
      default: return arr;
    }
  }, [filteredAppointments, sort]);

  const sortedTasks = useMemo(() => {
    const arr = [...filteredTasks];
    switch (sort) {
      case 'date-asc': return arr.sort((a, b) => new Date(a.dueDate || '9999').getTime() - new Date(b.dueDate || '9999').getTime());
      case 'date-desc': return arr.sort((a, b) => new Date(b.dueDate || '0').getTime() - new Date(a.dueDate || '0').getTime());
      case 'priority': {
        const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
        return arr.sort((a, b) => (order[a.priority] ?? 1) - (order[b.priority] ?? 1));
      }
      default: return arr;
    }
  }, [filteredTasks, sort]);

  // Task completion percentage
  const taskCompletionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Open new RDV with auto-populated dates
  const openNewRdv = () => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    const start = formatLocalDateTime(now);
    now.setHours(now.getHours() + 1);
    const end = formatLocalDateTime(now);
    setRdvForm({ title: '', type: 'visit', priority: 'medium', startTime: start, endTime: end, location: '', description: '' });
    setShowNewRdv(true);
  };

  // Handlers
  const handleCreateRdv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rdvForm.title || !rdvForm.startTime || !rdvForm.endTime) {
      setError('Titre, début et fin sont requis');
      return;
    }
    setSubmitting(true);
    try {
      await appointmentsAPI.create(rdvForm);
      setSuccess('Rendez-vous créé !');
      setShowNewRdv(false);
      setRdvForm({ title: '', type: 'visit', priority: 'medium', startTime: '', endTime: '', location: '', description: '' });
      setTimeout(() => setSuccess(null), 3000);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title) {
      setError('Le titre est requis');
      return;
    }
    setSubmitting(true);
    try {
      if (editingTask) {
        await tasksService.update(editingTask.id, taskForm);
        setSuccess('Tâche mise à jour !');
      } else {
        await tasksService.create(taskForm);
        setSuccess('Tâche créée !');
      }
      setShowNewTask(false);
      setEditingTask(null);
      setTaskForm({ title: '', description: '', status: 'todo', priority: 'medium', dueDate: '' });
      setTimeout(() => setSuccess(null), 3000);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteTask = async (id: string) => {
    try {
      await tasksService.complete(id);
      setSuccess('Tâche terminée !');
      setTimeout(() => setSuccess(null), 3000);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erreur');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Supprimer cette tâche ?')) return;
    try {
      await tasksService.remove(id);
      setSuccess('Tâche supprimée');
      setTimeout(() => setSuccess(null), 3000);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erreur');
    }
  };

  const handleDeleteApt = async (id: string) => {
    if (!confirm('Supprimer ce rendez-vous ?')) return;
    try {
      await appointmentsAPI.delete(id);
      setSuccess('Rendez-vous supprimé');
      setTimeout(() => setSuccess(null), 3000);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erreur');
    }
  };

  const handleCompleteApt = async (id: string) => {
    try {
      await appointmentsAPI.complete(id);
      setSuccess('Rendez-vous terminé !');
      setTimeout(() => setSuccess(null), 3000);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erreur');
    }
  };

  const handleMoveTask = async (taskId: string, columnId: string, position: number) => {
    await moveTask({ taskId, columnId, position });
    loadData();
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    });
    setShowNewTask(true);
  };

  const viewModes: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'list', label: 'Liste', icon: <LayoutList className="w-4 h-4" /> },
    { id: 'calendar', label: 'Calendrier', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'kanban', label: 'Kanban', icon: <Kanban className="w-4 h-4" /> },
  ];

  const dataTabs: { id: DataTab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'all', label: 'Tout', icon: <LayoutList className="w-4 h-4" />, count: totalApts + totalTasks },
    { id: 'appointments', label: 'Rendez-vous', icon: <Calendar className="w-4 h-4" />, count: totalApts },
    { id: 'tasks', label: 'Tâches', icon: <CheckSquare className="w-4 h-4" />, count: totalTasks },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            Planification
          </h1>
          <p className="text-gray-400 mt-1 text-sm capitalize ml-14">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition" title="Rafraîchir">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="h-6 w-px bg-gray-200" />
          <button
            onClick={openNewRdv}
            className="px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2 shadow-sm shadow-blue-200"
          >
            <Calendar className="w-4 h-4" /> Rendez-vous
          </button>
          <button
            onClick={() => { setEditingTask(null); setTaskForm({ title: '', description: '', status: 'todo', priority: 'medium', dueDate: '' }); setShowNewTask(true); }}
            className="px-4 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 active:scale-95 transition-all flex items-center gap-2 shadow-sm shadow-teal-200"
          >
            <CheckSquare className="w-4 h-4" /> Tâche
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white rounded-xl border border-l-4 border-l-blue-500 p-3 hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500">RDV</p>
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-600">{totalApts}</p>
        </div>
        <div className="bg-white rounded-xl border border-l-4 border-l-indigo-500 p-3 hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500">Confirmés</p>
            <CalendarCheck className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-indigo-600">{confirmedApts}</p>
        </div>
        <div className="bg-white rounded-xl border border-l-4 border-l-teal-500 p-3 hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500">Tâches</p>
            <ListTodo className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <p className="text-2xl font-bold text-teal-600">{totalTasks}</p>
        </div>
        <div className="bg-white rounded-xl border border-l-4 border-l-slate-400 p-3 hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500">À faire</p>
            <CircleDot className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-600">{todoTasks}</p>
        </div>
        <div className="bg-white rounded-xl border border-l-4 border-l-amber-500 p-3 hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500">En cours</p>
            <Timer className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{inProgressTasks}</p>
        </div>
        <div className="bg-white rounded-xl border border-l-4 border-l-green-500 p-3 hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500">Terminées</p>
            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-600">{doneTasks}</p>
        </div>
        <div className={`rounded-xl border border-l-4 border-l-red-500 p-3 hover:shadow-sm transition ${overdueTasks > 0 ? 'bg-red-50 ring-1 ring-red-200' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-red-500">En retard</p>
            <AlertTriangle className={`w-3.5 h-3.5 text-red-400 ${overdueTasks > 0 ? 'animate-pulse' : ''}`} />
          </div>
          <p className="text-2xl font-bold text-red-600">{overdueTasks}</p>
        </div>
      </div>

      {/* Task completion progress */}
      {totalTasks > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Progression des tâches</span>
            <span className="text-sm font-bold text-gray-900">{taskCompletionPct}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-green-500 rounded-full transition-all duration-500"
              style={{ width: `${taskCompletionPct}%` }}
            />
          </div>
        </div>
      )}

      {/* View modes + Data tabs + Filters */}
      <div className="bg-white rounded-xl border">
        {/* Top bar: view modes + search + sort + filter */}
        <div className="flex items-center justify-between px-4 py-3 border-b gap-3">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {viewModes.map((v) => (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${viewMode === v.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {v.icon} {v.label}
              </button>
            ))}
          </div>
          <div className="flex-1 max-w-xs">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Rechercher..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {viewMode === 'list' && (
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-600 focus:ring-2 focus:ring-blue-500"
              >
                <option value="date-desc">Plus récent</option>
                <option value="date-asc">Plus ancien</option>
                <option value="priority">Priorité</option>
              </select>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 text-sm rounded-lg border transition flex items-center gap-2 ${showFilters || filters.status || filters.priority
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
            >
              <Filter className="w-4 h-4" />
              Filtres
              {(filters.status || filters.priority) && (
                <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                  {(filters.status ? 1 : 0) + (filters.priority ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="px-4 py-3 border-b flex flex-wrap gap-3 items-end bg-gray-50/50">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
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
                className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes</option>
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            <button
              onClick={() => setFilters(f => ({ ...f, status: '', priority: '' }))}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border rounded-lg hover:bg-gray-50 transition"
            >
              Réinitialiser
            </button>
          </div>
        )}

        {/* Data tabs */}
        <div className="flex items-center gap-6 px-4 border-b">
          {dataTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDataTab(tab.id)}
              className={`py-3 text-sm font-medium transition-all flex items-center gap-2 border-b-2 -mb-px ${dataTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.icon} {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${dataTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-3" />
              <span className="text-gray-500">Chargement...</span>
            </div>
          ) : viewMode === 'calendar' ? (
            <div className="p-4">
              <CalendarView
                appointments={filteredAppointments}
                tasks={filteredTasks}
                onDateClick={(date) => {
                  const start = new Date(date);
                  start.setHours(9, 0, 0, 0);
                  const end = new Date(date);
                  end.setHours(10, 0, 0, 0);
                  setRdvForm(prev => ({ ...prev, startTime: formatLocalDateTime(start), endTime: formatLocalDateTime(end) }));
                  setShowNewRdv(true);
                }}
                onAppointmentClick={(apt) => router.push(`/appointments/${apt.id}`)}
              />
            </div>
          ) : viewMode === 'kanban' && board ? (
            <div className="p-4">
              <KanbanBoardView
                board={board}
                onMoveTask={handleMoveTask}
                onTaskClick={(task) => openEditTask(task as any)}
                onAddTask={(columnId) => { setEditingTask(null); setTaskForm({ title: '', description: '', status: 'todo', priority: 'medium', dueDate: '' }); setShowNewTask(true); }}
              />
            </div>
          ) : viewMode === 'kanban' && !board ? (
            <div className="text-center py-20">
              <Kanban className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun tableau Kanban</h2>
              <p className="text-gray-500 mb-6">Initialisez votre premier tableau</p>
              <button
                onClick={async () => {
                  try {
                    const b = await initializeDefaultBoard();
                    setBoard(b);
                  } catch (err: any) {
                    setError(err.message || 'Erreur lors de la création du tableau');
                  }
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold"
              >
                Créer le tableau par défaut
              </button>
            </div>
          ) : (
            /* ===== LIST VIEW ===== */
            <div className="divide-y divide-gray-100">
              {/* Rendez-vous */}
              {dataTab !== 'tasks' && sortedAppointments.length > 0 && (
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Rendez-vous ({sortedAppointments.length})
                  </h3>
                  <div className="space-y-2">
                    {sortedAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center gap-4 p-4 rounded-xl border hover:shadow-md transition cursor-pointer group"
                        style={{ borderLeft: `4px solid ${apt.color || '#3B82F6'}` }}
                      >
                        <div className="flex-1 min-w-0" onClick={() => router.push(`/appointments/${apt.id}`)}>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">{apt.title}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[apt.status] || 'bg-gray-100'}`}>
                              {STATUS_LABELS[apt.status] || apt.status}
                            </span>
                            {apt.type && (
                              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{apt.type}</span>
                            )}
                            {apt.priority && apt.priority !== 'medium' && (
                              <span className={`px-2 py-0.5 rounded-full text-xs ${PRIORITY_COLORS[apt.priority]}`}>
                                {PRIORITY_LABELS[apt.priority]}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(apt.startTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {apt.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {apt.location}
                              </span>
                            )}
                            {apt.prospects && (
                              <span>👤 {apt.prospects.firstName} {apt.prospects.lastName}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                            <button onClick={(e) => { e.stopPropagation(); handleCompleteApt(apt.id); }} className="p-1.5 hover:bg-green-100 rounded-lg text-green-600" title="Terminer">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteApt(apt.id); }} className="p-1.5 hover:bg-red-100 rounded-lg text-red-500" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tâches */}
              {dataTab !== 'appointments' && sortedTasks.length > 0 && (
                <div className="p-4">
                  {/* Overdue section */}
                  {overdueTasks > 0 && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">{overdueTasks} tâche{overdueTasks > 1 ? 's' : ''} en retard</span>
                    </div>
                  )}
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" /> Tâches ({sortedTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {sortedTasks.map((task) => {
                      const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
                      return (
                        <div
                          key={task.id}
                          className={`flex items-center gap-4 p-4 rounded-xl border hover:shadow-md transition group ${isOverdue ? 'border-red-200 bg-red-50/30' : ''}`}
                        >
                          {/* Complete checkbox */}
                          <button
                            onClick={() => task.status !== 'done' && handleCompleteTask(task.id)}
                            className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition ${task.status === 'done'
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300 hover:border-green-500'
                              }`}
                          >
                            {task.status === 'done' && <CheckCircle className="w-3 h-3" />}
                          </button>

                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openEditTask(task)}>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-medium text-sm truncate ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                                {task.title}
                              </h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[task.status] || 'bg-gray-100'}`}>
                                {STATUS_LABELS[task.status] || task.status}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${PRIORITY_COLORS[task.priority]}`}>
                                {PRIORITY_LABELS[task.priority]}
                              </span>
                            </div>
                            {task.description && (
                              <p className="text-xs text-gray-400 truncate">{task.description}</p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                              {task.dueDate && (
                                <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                                  <Clock className="w-3 h-3" />
                                  {new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                </span>
                              )}
                              {task.prospects && (
                                <span>👤 {task.prospects.firstName} {task.prospects.lastName}</span>
                              )}
                              {task.properties && (
                                <span>🏠 {task.properties.title}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => openEditTask(task)} className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600" title="Modifier">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 hover:bg-red-100 rounded-lg text-red-500" title="Supprimer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {filteredAppointments.length === 0 && filteredTasks.length === 0 && (
                <div className="text-center py-20">
                  <CalendarDays className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {filters.search || filters.status || filters.priority ? 'Aucun résultat' : 'Rien de planifié'}
                  </h2>
                  <p className="text-gray-500 mb-6">
                    {filters.search || filters.status || filters.priority
                      ? 'Essayez de modifier vos filtres'
                      : 'Commencez par créer un rendez-vous ou une tâche'}
                  </p>
                  {!filters.search && !filters.status && !filters.priority && (
                    <div className="flex gap-3 justify-center">
                      <button onClick={openNewRdv} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all text-sm font-semibold shadow-sm shadow-blue-200 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Rendez-vous
                      </button>
                      <button onClick={() => setShowNewTask(true)} className="px-5 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 active:scale-95 transition-all text-sm font-semibold shadow-sm shadow-teal-200 flex items-center gap-2">
                        <CheckSquare className="w-4 h-4" /> Tâche
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== NEW RDV MODAL ===== */}
      {showNewRdv && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNewRdv(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold">Nouveau rendez-vous</h2>
              <button onClick={() => setShowNewRdv(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateRdv} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input
                  type="text"
                  value={rdvForm.title}
                  onChange={e => setRdvForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Visite appartement Paris 15ème"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={rdvForm.type} onChange={e => setRdvForm(f => ({ ...f, type: e.target.value as any }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="visit">Visite</option>
                    <option value="signature">Signature</option>
                    <option value="expertise">Expertise</option>
                    <option value="estimation">Estimation</option>
                    <option value="meeting">Réunion</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                  <select value={rdvForm.priority} onChange={e => setRdvForm(f => ({ ...f, priority: e.target.value as any }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Début *</label>
                  <input type="datetime-local" value={rdvForm.startTime} onChange={e => setRdvForm(f => ({ ...f, startTime: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fin *</label>
                  <input type="datetime-local" value={rdvForm.endTime} onChange={e => setRdvForm(f => ({ ...f, endTime: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
                <input type="text" value={rdvForm.location} onChange={e => setRdvForm(f => ({ ...f, location: e.target.value }))} placeholder="Adresse du rendez-vous" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={rdvForm.description} onChange={e => setRdvForm(f => ({ ...f, description: e.target.value }))} placeholder="Informations complémentaires..." className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowNewRdv(false)} className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 text-sm">Annuler</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                  {submitting ? 'Création...' : 'Créer le rendez-vous'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== NEW/EDIT TASK MODAL ===== */}
      {showNewTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowNewTask(false); setEditingTask(null); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold">{editingTask ? 'Modifier la tâche' : 'Nouvelle tâche'}</h2>
              <button onClick={() => { setShowNewTask(false); setEditingTask(null); }} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Relancer M. Dupont"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} placeholder="Détails de la tâche..." className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <select value={taskForm.status} onChange={e => setTaskForm(f => ({ ...f, status: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="todo">À faire</option>
                    <option value="in_progress">En cours</option>
                    <option value="done">Terminé</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
                <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowNewTask(false); setEditingTask(null); }} className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 text-sm">Annuler</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm">
                  {submitting ? 'Enregistrement...' : editingTask ? 'Mettre à jour' : 'Créer la tâche'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanificationDashboard;
