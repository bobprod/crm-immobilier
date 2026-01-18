import React, { useState, useEffect } from 'react';

interface SitesVitriniesDashboardProps {
    language?: 'fr' | 'en';
}

type TabType = 'my-sites' | 'page-builder';

/**
 * Module Sites Vitrines - Dashboard avec tabs Mes Sites et Page Builder
 * Format identique aux autres modules dashboard
 */
export const SitesVitriniesDashboard: React.FC<SitesVitriniesDashboardProps> = ({ language = 'fr' }) => {
    const [activeTab, setActiveTab] = useState<TabType>('my-sites');
    const [sites, setSites] = useState<any[]>([]);
    const [pages, setPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Load data based on active tab
    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'my-sites') {
                // Load sites
                // const response = await fetch('/api/vitrine/sites');
                // const data = await response.json();
                // setSites(data);
            } else {
                // Load pages
                // const response = await fetch('/api/vitrine/pages');
                // const data = await response.json();
                // setPages(data);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const tabs: { id: TabType; label: string; icon: string }[] = [
        { id: 'my-sites', label: 'Mes Sites', icon: '🏛️' },
        { id: 'page-builder', label: 'Page Builder', icon: '🔨' },
    ];

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Sites Vitrines</h1>
                <p className="text-gray-600">Créez et gérez vos sites vitrines</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-8 border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 font-medium transition-colors ${activeTab === tab.id
                                ? 'text-teal-600 border-b-2 border-teal-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="space-y-6">
                {/* Mes Sites Tab */}
                {activeTab === 'my-sites' && (
                    <div>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            {/* Total Sites */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-teal-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Total</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">🌐</span>
                                </div>
                            </div>

                            {/* Active Sites */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Actifs</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">✓</span>
                                </div>
                            </div>

                            {/* Visitors */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Visiteurs</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">👁️</span>
                                </div>
                            </div>

                            {/* Conversions */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Conversions</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">🎯</span>
                                </div>
                            </div>
                        </div>

                        {/* Empty State */}
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <span className="text-6xl mb-4 block">🏛️</span>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun site créé</h3>
                            <p className="text-gray-600 mb-6">Créez votre premier site vitrine</p>
                            <button className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-medium hover:from-teal-600 hover:to-cyan-700 transition">
                                + Créer un site
                            </button>
                        </div>
                    </div>
                )}

                {/* Page Builder Tab */}
                {activeTab === 'page-builder' && (
                    <div>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            {/* Total Pages */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-teal-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Total pages</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">📄</span>
                                </div>
                            </div>

                            {/* Published */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Publiées</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">✓</span>
                                </div>
                            </div>

                            {/* Drafts */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Brouillons</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">📝</span>
                                </div>
                            </div>

                            {/* Page Views */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Vues</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">📊</span>
                                </div>
                            </div>
                        </div>

                        {/* Empty State */}
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <span className="text-6xl mb-4 block">🔨</span>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucune page créée</h3>
                            <p className="text-gray-600 mb-6">Utilisez le Page Builder pour créer vos pages</p>
                            <button className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-medium hover:from-teal-600 hover:to-cyan-700 transition">
                                + Créer une page
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SitesVitriniesDashboard;
