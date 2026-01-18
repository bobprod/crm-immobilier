import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface PlanificationModuleProps {
    activeTab?: 'appointments' | 'tasks';
}

/**
 * Module de Planification - Gère Rendez-vous et Tâches en tabs
 */
export const PlanificationModule: React.FC<PlanificationModuleProps> = ({ activeTab = 'appointments' }) => {
    const [currentTab, setCurrentTab] = useState<'appointments' | 'tasks'>(activeTab);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Load data based on active tab
    useEffect(() => {
        loadData();
    }, [currentTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (currentTab === 'appointments') {
                // Load appointments
                // const response = await fetch('/api/appointments');
                // const data = await response.json();
                // setAppointments(data);
            } else {
                // Load tasks
                // const response = await fetch('/api/tasks');
                // const data = await response.json();
                // setTasks(data);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            {/* Header */}
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
                        <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
                            <span className="text-xl">+</span>
                            Nouveau
                        </button>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <nav className="bg-white border-b shadow-sm sticky top-[73px] z-30">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex gap-1 py-2">
                        <button
                            onClick={() => setCurrentTab('appointments')}
                            className={`px-6 py-3 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${currentTab === 'appointments'
                                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            📅 Rendez-vous
                        </button>
                        <button
                            onClick={() => setCurrentTab('tasks')}
                            className={`px-6 py-3 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${currentTab === 'tasks'
                                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            ✓ Tâches
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-6">
                {/* Appointments Tab */}
                {currentTab === 'appointments' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                            <div className="text-6xl mb-4">📅</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Rendez-vous</h2>
                            <p className="text-gray-500 text-lg mb-6">
                                Gérez tous vos rendez-vous, appels et réunions
                            </p>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-3 gap-4 mt-8 max-w-md mx-auto">
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <div className="text-3xl font-bold text-blue-600">0</div>
                                    <div className="text-sm text-blue-700 mt-1">Aujourd'hui</div>
                                </div>
                                <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                                    <div className="text-3xl font-bold text-cyan-600">0</div>
                                    <div className="text-sm text-cyan-700 mt-1">Cette semaine</div>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                    <div className="text-3xl font-bold text-purple-600">0</div>
                                    <div className="text-sm text-purple-700 mt-1">Ce mois</div>
                                </div>
                            </div>

                            <button className="mt-8 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold">
                                Créer un rendez-vous
                            </button>
                        </div>

                        {/* Empty state or appointments list would go here */}
                        {appointments.length === 0 && (
                            <div className="bg-white rounded-xl shadow-lg p-12 text-center border-2 border-dashed border-gray-300">
                                <p className="text-gray-500">Aucun rendez-vous prévu pour le moment</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Tasks Tab */}
                {currentTab === 'tasks' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                            <div className="text-6xl mb-4">✓</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tâches</h2>
                            <p className="text-gray-500 text-lg mb-6">
                                Suivez vos tâches et améliorez votre productivité
                            </p>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-3 gap-4 mt-8 max-w-md mx-auto">
                                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                    <div className="text-3xl font-bold text-green-600">0</div>
                                    <div className="text-sm text-green-700 mt-1">Complétées</div>
                                </div>
                                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                    <div className="text-3xl font-bold text-yellow-600">0</div>
                                    <div className="text-sm text-yellow-700 mt-1">En cours</div>
                                </div>
                                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                    <div className="text-3xl font-bold text-red-600">0</div>
                                    <div className="text-sm text-red-700 mt-1">En retard</div>
                                </div>
                            </div>

                            <button className="mt-8 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold">
                                Créer une tâche
                            </button>
                        </div>

                        {/* Empty state or tasks list would go here */}
                        {tasks.length === 0 && (
                            <div className="bg-white rounded-xl shadow-lg p-12 text-center border-2 border-dashed border-gray-300">
                                <p className="text-gray-500">Aucune tâche pour le moment</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Loading indicator */}
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
