import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface MarketingDashboardProps {
    language?: 'fr' | 'en';
}

type TabType = 'campaigns' | 'tracking' | 'seo';

/**
 * Module Marketing - Dashboard avec tabs Campagnes, Tracking et SEO
 */
export const MarketingDashboard: React.FC<MarketingDashboardProps> = ({ language = 'fr' }) => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('campaigns');
    const [loading, setLoading] = useState(false);

    // Load data based on active tab
    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'campaigns') {
                // Load campaigns
                // const response = await fetch('/api/marketing/campaigns');
                // const data = await response.json();
                // setCampaigns(data);
            } else if (activeTab === 'tracking') {
                // Load tracking data
                // const response = await fetch('/api/marketing/tracking');
                // const data = await response.json();
                // setTracking(data);
            } else {
                // Load SEO data
                // const response = await fetch('/api/marketing/seo');
                // const data = await response.json();
                // setSeo(data);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const tabs: { id: TabType; label: string; icon: string }[] = [
        { id: 'campaigns', label: 'Campagnes', icon: '🎯' },
        { id: 'tracking', label: 'Tracking', icon: '📊' },
        { id: 'seo', label: 'SEO', icon: '🔍' },
    ];

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Marketing</h1>
                <p className="text-gray-600">Gérez vos campagnes, tracking et SEO</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-8 border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 font-medium transition-colors ${activeTab === tab.id
                            ? 'text-red-600 border-b-2 border-red-600'
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
                {/* Campagnes Tab */}
                {activeTab === 'campaigns' && (
                    <div>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            {/* Total Campaigns */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Total</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">🎯</span>
                                </div>
                            </div>

                            {/* Active Campaigns */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Actives</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">✓</span>
                                </div>
                            </div>

                            {/* Budget */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Budget</p>
                                        <p className="text-3xl font-bold text-gray-900">€0</p>
                                    </div>
                                    <span className="text-4xl">💰</span>
                                </div>
                            </div>

                            {/* ROI */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">ROI</p>
                                        <p className="text-4xl font-bold text-gray-900">0%</p>
                                    </div>
                                    <span className="text-4xl">📈</span>
                                </div>
                            </div>
                        </div>

                        {/* Empty State */}
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <span className="text-6xl mb-4 block">🎯</span>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucune campagne créée</h3>
                            <p className="text-gray-600 mb-6">Lancez votre première campagne marketing</p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => router.push('/marketing/campaigns/new')}
                                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-orange-700 transition"
                                >
                                    + Créer une campagne
                                </button>
                                <button
                                    onClick={() => router.push('/marketing/campaigns')}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                                >
                                    Voir toutes les campagnes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tracking Tab */}
                {activeTab === 'tracking' && (
                    <div>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            {/* Total Visits */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Visites</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">👁️</span>
                                </div>
                            </div>

                            {/* Conversions */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Conversions</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">✓</span>
                                </div>
                            </div>

                            {/* CTR */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">CTR</p>
                                        <p className="text-4xl font-bold text-gray-900">0%</p>
                                    </div>
                                    <span className="text-4xl">📊</span>
                                </div>
                            </div>

                            {/* Avg Time */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Temps moyen</p>
                                        <p className="text-3xl font-bold text-gray-900">0s</p>
                                    </div>
                                    <span className="text-4xl">⏱️</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Outils de Tracking</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {[
                                    { label: 'Configuration Pixels', path: '/marketing/tracking', icon: '⚙️' },
                                    { label: 'Analytics en direct', path: '/marketing/tracking/realtime', icon: '📡' },
                                    { label: 'Heatmap', path: '/marketing/tracking/heatmap', icon: '🔥' },
                                    { label: 'Attribution', path: '/marketing/tracking/attribution', icon: '🔀' },
                                    { label: 'A/B Tests', path: '/marketing/tracking/ab-tests', icon: '🧪' },
                                    { label: 'Analytics détaillés', path: '/marketing/tracking/analytics', icon: '📈' },
                                ].map((tool) => (
                                    <button
                                        key={tool.path}
                                        onClick={() => router.push(tool.path)}
                                        className="p-4 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition text-left"
                                    >
                                        <span className="text-2xl block mb-2">{tool.icon}</span>
                                        <span className="text-sm font-medium text-gray-700">{tool.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Empty State */}
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <span className="text-6xl mb-4 block">📊</span>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucune donnée de tracking</h3>
                            <p className="text-gray-600 mb-6">Configurez vos pixels pour commencer à collecter des données</p>
                            <button
                                onClick={() => router.push('/marketing/tracking')}
                                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition"
                            >
                                Configurer le tracking
                            </button>
                        </div>
                    </div>
                )}

                {/* SEO Tab */}
                {activeTab === 'seo' && (
                    <div>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            {/* Keywords Ranking */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Mots-clés ranking</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">🔑</span>
                                </div>
                            </div>

                            {/* Domain Authority */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Autorité domaine</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">🏆</span>
                                </div>
                            </div>

                            {/* Backlinks */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Backlinks</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">🔗</span>
                                </div>
                            </div>

                            {/* Pages Indexed */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-cyan-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Pages indexées</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">📄</span>
                                </div>
                            </div>
                        </div>

                        {/* Empty State */}
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <span className="text-6xl mb-4 block">🔍</span>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucune analyse SEO</h3>
                            <p className="text-gray-600 mb-6">Lancez une analyse SEO pour voir vos données</p>
                            <button
                                onClick={() => router.push('/seo-ai')}
                                className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-teal-700 transition"
                            >
                                + Lancer une analyse
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketingDashboard;
