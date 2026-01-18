import React, { useState, useEffect } from 'react';

interface ProspectsDashboardProps {
    language?: 'fr' | 'en';
}

type TabType = 'prospects' | 'mandates';

/**
 * Module Prospects - Dashboard avec tabs Prospects et Mandats
 * Format identique au ProspectingDashboard
 */
export const ProspectsDashboard: React.FC<ProspectsDashboardProps> = ({ language = 'fr' }) => {
    const [activeTab, setActiveTab] = useState<TabType>('prospects');
    const [prospects, setProspects] = useState<any[]>([]);
    const [mandates, setMandates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Load data based on active tab
    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'prospects') {
                // Load prospects
                // const response = await fetch('/api/prospects');
                // const data = await response.json();
                // setProspects(data);
            } else {
                // Load mandates
                // const response = await fetch('/api/mandates');
                // const data = await response.json();
                // setMandates(data);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const tabs: { id: TabType; label: string; icon: string }[] = [
        { id: 'prospects', label: 'Prospects', icon: '👤' },
        { id: 'mandates', label: 'Mandats', icon: '📋' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                Prospects & Mandats
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Gérez vos prospects et mandats immobiliers
                            </p>
                        </div>
                        <button className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
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
                                        ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md'
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
                {/* Prospects Tab */}
                {activeTab === 'prospects' && (
                    <div className="space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium">Total</p>
                                        <p className="text-3xl font-bold text-orange-600 mt-2">0</p>
                                    </div>
                                    <div className="text-4xl">👥</div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium">Actifs</p>
                                        <p className="text-3xl font-bold text-red-600 mt-2">0</p>
                                    </div>
                                    <div className="text-4xl">✓</div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium">Qualifiés</p>
                                        <p className="text-3xl font-bold text-yellow-600 mt-2">0</p>
                                    </div>
                                    <div className="text-4xl">⭐</div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium">Convertis</p>
                                        <p className="text-3xl font-bold text-purple-600 mt-2">0</p>
                                    </div>
                                    <div className="text-4xl">🎯</div>
                                </div>
                            </div>
                        </div>

                        {/* Empty State */}
                        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                            <div className="text-6xl mb-4">👤</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucun prospect</h2>
                            <p className="text-gray-500 text-lg mb-6">
                                Créez votre premier prospect pour commencer
                            </p>
                            <button className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all font-semibold">
                                Ajouter un prospect
                            </button>
                        </div>
                    </div>
                )}

                {/* Mandates Tab */}
                {activeTab === 'mandates' && (
                    <div className="space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium">Total</p>
                                        <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
                                    </div>
                                    <div className="text-4xl">📋</div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium">Actifs</p>
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
                                        <p className="text-gray-600 text-sm font-medium">Expirés</p>
                                        <p className="text-3xl font-bold text-red-600 mt-2">0</p>
                                    </div>
                                    <div className="text-4xl">⚠️</div>
                                </div>
                            </div>
                        </div>

                        {/* Empty State */}
                        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                            <div className="text-6xl mb-4">📋</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucun mandat</h2>
                            <p className="text-gray-500 text-lg mb-6">
                                Créez votre premier mandat pour commencer
                            </p>
                            <button className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all font-semibold">
                                Ajouter un mandat
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Loading indicator */}
            {loading && (
                <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl px-5 py-4 flex items-center gap-4 z-50">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-200 border-t-orange-600"></div>
                    <span className="text-sm font-medium text-gray-700">Chargement...</span>
                </div>
            )}
        </div>
    );
};

export default ProspectsDashboard;
