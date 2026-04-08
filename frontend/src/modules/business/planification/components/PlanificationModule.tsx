import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { appointmentsAPI, tasksAPI } from '@/shared/utils/api-client-backend';

interface PlanificationModuleProps {
  activeTab?: 'appointments' | 'tasks';
}

export const PlanificationModule: React.FC<PlanificationModuleProps> = ({
  activeTab = 'appointments',
}) => {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<'appointments' | 'tasks'>(activeTab);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [currentTab]);

  useEffect(() => {
    if (router.query.action === 'new' && currentTab === 'tasks') {
      router.push('/tasks?action=new');
    }
  }, [router.query.action, currentTab, router]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (currentTab === 'appointments') {
        const [appointmentsRes, statsRes] = await Promise.all([
          appointmentsAPI.getAll(),
          appointmentsAPI.getStats(),
        ]);
        setAppointments(appointmentsRes.data);
        setStats(statsRes.data);
      } else {
        const [tasksRes, statsRes] = await Promise.all([tasksAPI.getAll(), tasksAPI.getStats()]);
        setTasks(tasksRes.data);
        setStats(statsRes.data);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(error.response?.data?.message || 'Erreur de chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-orange-100 text-orange-800',
      rescheduled: 'bg-purple-100 text-purple-800',
      todo: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      done: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'text-gray-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600',
    };
    return colors[priority] || 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Planification
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Gérez vos rendez-vous et tâches en un seul endroit
              </p>
            </div>
            <button
              onClick={() =>
                router.push(
                  currentTab === 'appointments' ? '/appointments/new' : '/tasks?action=new'
                )
              }
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              Nouveau
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b shadow-sm sticky top-[73px] z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 py-2">
            <button
              onClick={() => setCurrentTab('appointments')}
              className={`px-6 py-3 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
                currentTab === 'appointments'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📅 Rendez-vous
            </button>
            <button
              onClick={() => setCurrentTab('tasks')}
              className={`px-6 py-3 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
                currentTab === 'tasks'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              ✓ Tâches
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {currentTab === 'appointments' && (
          <div className="space-y-6">
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <p className="text-gray-600 text-sm font-medium">Total</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{stats.total || 0}</p>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <p className="text-gray-600 text-sm font-medium">Terminés</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {stats.byStatus?.find((s: any) => s.status === 'completed')?._count || 0}
                  </p>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                  <p className="text-gray-600 text-sm font-medium">Taux de présence</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">
                    {stats.attendanceRate || 0}%
                  </p>
                </div>
              </div>
            )}

            {appointments.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center border-2 border-dashed border-gray-300">
                <div className="text-6xl mb-4">📅</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucun rendez-vous</h2>
                <p className="text-gray-500 text-lg mb-6">Aucun rendez-vous prévu pour le moment</p>
                <button
                  onClick={() => router.push('/appointments/new')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold"
                >
                  Créer un rendez-vous
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{apt.title}</h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}
                          >
                            {apt.status}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>📅 {formatDate(apt.startTime)}</p>
                          {apt.prospects && (
                            <p>
                              👤 {apt.prospects.firstName} {apt.prospects.lastName}
                            </p>
                          )}
                          {apt.properties && (
                            <p>
                              🏠 {apt.properties.title} - {apt.properties.address}
                            </p>
                          )}
                          {apt.location && <p>📍 {apt.location}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/appointments/${apt.id}`)}
                          className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          Voir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentTab === 'tasks' && (
          <div className="space-y-6">
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <p className="text-gray-600 text-sm font-medium">Total</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{stats.total || 0}</p>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                  <p className="text-gray-600 text-sm font-medium">En cours</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.inProgress || 0}</p>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <p className="text-gray-600 text-sm font-medium">Terminées</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.done || 0}</p>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                  <p className="text-gray-600 text-sm font-medium">En retard</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{stats.overdue || 0}</p>
                </div>
              </div>
            )}

            {tasks.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center border-2 border-dashed border-gray-300">
                <div className="text-6xl mb-4">✓</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucune tâche</h2>
                <p className="text-gray-500 text-lg mb-6">Aucune tâche pour le moment</p>
                <button
                  onClick={() => router.push('/tasks?action=new')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold"
                >
                  Créer une tâche
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
                          >
                            {task.status}
                          </span>
                          {task.priority && (
                            <span
                              className={`text-xs font-medium ${getPriorityColor(task.priority)}`}
                            >
                              {task.priority}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          {task.dueDate && <p>📅 Échéance: {formatDate(task.dueDate)}</p>}
                          {task.prospects && (
                            <p>
                              👤 {task.prospects.firstName} {task.prospects.lastName}
                            </p>
                          )}
                          {task.properties && <p>🏠 {task.properties.title}</p>}
                          {task.description && <p className="mt-2">{task.description}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!task.completedAt && (
                          <button
                            onClick={async () => {
                              await tasksAPI.complete(task.id);
                              loadData();
                            }}
                            className="px-3 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            Terminer
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/tasks?id=${task.id}`)}
                          className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          Voir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {loading && (
        <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl px-5 py-4 flex items-center gap-4 z-50">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200 border-t-blue-600"></div>
          <span className="text-sm font-medium text-gray-700">Chargement...</span>
        </div>
      )}
    </div>
  );
};

export default PlanificationModule;
