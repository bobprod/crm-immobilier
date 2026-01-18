import React, { useState, useEffect } from 'react';

interface PlanificationDashboardProps {
    language?: 'fr' | 'en';
}

type TabType = 'appointments' | 'tasks';

/**
 * Module Planification - Dashboard avec tabs Rendez-vous et Tâches
 * Format identique au ProspectingDashboard
 */
export const PlanificationDashboard: React.FC<PlanificationDashboardProps> = ({ language = 'fr' }) => {
    const [activeTab, setActiveTab] = useState<TabType>('appointments');
    const [appointments, setAppointments] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Load data based on active tab
    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'appointments') {
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

    const tabs: { id: TabType; label: string; icon: string }[] = [
        { id: 'appointments', label: 'Rendez-vous', icon: '📅' },
        { id: 'tasks', label: 'Tâches', icon: '✓' },
    ];

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
                    <div className="flex gap-1 overflow-x-auto py-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-3 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-6">
                {/* Appointments Tab */}
                {activeTab === 'appointments' && (
                    <div className="space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium">Aujourd'hui</p>
                                        <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
                                    </div>
                                    <div className="text-4xl">📅</div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-cyan-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium">Cette semaine</p>
                                        <p className="text-3xl font-bold text-cyan-600 mt-2">0</p>
                                    </div>
                                    <div className="text-4xl">📆</div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium">Ce mois</p>
                                        <p className="text-3xl font-bold text-purple-600 mt-2">0</p>
                                    </div>
                                    <div className="text-4xl">📊</div>
                                </div>
                            </div>
                        </div>

                        {/* Empty State */}
                        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                            <div className="text-6xl mb-4">📅</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucun rendez-vous</h2>
                            <p className="text-gray-500 text-lg mb-6">
                                Vous n'avez pas de rendez-vous prévu pour le moment
                            </p>
                            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold">
                                Créer un rendez-vous
                            </button>
                        </div>
                    </div>
                )}

                {/* Tasks Tab */}
                {activeTab === 'tasks' && (
                    <div className="space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium">Complétées</p>
                                        <p className="text-3xl font-bold text-green-600 mt-2">0</p>
                                    </div>
                                    <div className="text-4xl">✓</div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium">En cours</p>
                                        <p className="text-3xl font-bold text-yellow-600 mt-2">0</p>
                                    </div>
                                    <div className="text-4xl">⏳</div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium">En retard</p>
                                        <p className="text-3xl font-bold text-red-600 mt-2">0</p>
                                    </div>
                                    <div className="text-4xl">⚠️</div>
                                </div>
                            </div>
                        </div>

                        {/* Empty State */}
                        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                            <div className="text-6xl mb-4">✓</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucune tâche</h2>
                            <p className="text-gray-500 text-lg mb-6">
                                Vous n'avez pas de tâche pour le moment - Restez productif!
                            </p>
                            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold">
                                Créer une tâche
                            </button>
                        </div>
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

export default PlanificationDashboard;
