import React, { useState, useEffect } from 'react';

interface CommunicationsDashboardProps {
    language?: 'fr' | 'en';
}

type TabType = 'all' | 'whatsapp' | 'templates';

/**
 * Module Communications - Dashboard avec tabs Toutes, WhatsApp et Templates
 * Format identique au ProspectsDashboard, BiensDashboard et TransactionsDashboard
 */
export const CommunicationsDashboard: React.FC<CommunicationsDashboardProps> = ({ language = 'fr' }) => {
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [communications, setCommunications] = useState<any[]>([]);
    const [whatsappMessages, setWhatsappMessages] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Load data based on active tab
    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'all') {
                // Load all communications
                // const response = await fetch('/api/communications');
                // const data = await response.json();
                // setCommunications(data);
            } else if (activeTab === 'whatsapp') {
                // Load WhatsApp messages
                // const response = await fetch('/api/communications/whatsapp');
                // const data = await response.json();
                // setWhatsappMessages(data);
            } else {
                // Load templates
                // const response = await fetch('/api/communications/templates');
                // const data = await response.json();
                // setTemplates(data);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const tabs: { id: TabType; label: string; icon: string }[] = [
        { id: 'all', label: 'Toutes', icon: '📨' },
        { id: 'whatsapp', label: 'WhatsApp', icon: '📱' },
        { id: 'templates', label: 'Templates', icon: '📝' },
    ];

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Communications</h1>
                <p className="text-gray-600">Gérez toutes vos communications, WhatsApp et templates</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-8 border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 font-medium transition-colors ${activeTab === tab.id
                                ? 'text-blue-600 border-b-2 border-blue-600'
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
                {/* Toutes Tab */}
                {activeTab === 'all' && (
                    <div>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            {/* Total Communications */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Total</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">📨</span>
                                </div>
                            </div>

                            {/* Sent */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Envoyées</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">✓</span>
                                </div>
                            </div>

                            {/* Pending */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">En attente</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">⏳</span>
                                </div>
                            </div>

                            {/* Failed */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Échouées</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">❌</span>
                                </div>
                            </div>
                        </div>

                        {/* Empty State */}
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <span className="text-6xl mb-4 block">📨</span>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucune communication enregistrée</h3>
                            <p className="text-gray-600 mb-6">Les communications s'afficheront ici une fois créées</p>
                            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-700 transition">
                                + Nouvelle communication
                            </button>
                        </div>
                    </div>
                )}

                {/* WhatsApp Tab */}
                {activeTab === 'whatsapp' && (
                    <div>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            {/* Total Messages */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Total</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">📱</span>
                                </div>
                            </div>

                            {/* Sent Messages */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Envoyés</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">✓</span>
                                </div>
                            </div>

                            {/* Conversations */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Conversations</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">💬</span>
                                </div>
                            </div>

                            {/* Contacts */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-cyan-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Contacts</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">👥</span>
                                </div>
                            </div>
                        </div>

                        {/* Empty State */}
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <span className="text-6xl mb-4 block">📱</span>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun message WhatsApp enregistré</h3>
                            <p className="text-gray-600 mb-6">Les messages WhatsApp s'afficheront ici une fois créés</p>
                            <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-teal-700 transition">
                                + Envoyer un message
                            </button>
                        </div>
                    </div>
                )}

                {/* Templates Tab */}
                {activeTab === 'templates' && (
                    <div>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            {/* Total Templates */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Total</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">📝</span>
                                </div>
                            </div>

                            {/* Active */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Actifs</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">✓</span>
                                </div>
                            </div>

                            {/* Categories */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Catégories</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">📂</span>
                                </div>
                            </div>

                            {/* Usage Count */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-pink-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm mb-1">Utilisations</p>
                                        <p className="text-4xl font-bold text-gray-900">0</p>
                                    </div>
                                    <span className="text-4xl">🔄</span>
                                </div>
                            </div>
                        </div>

                        {/* Empty State */}
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <span className="text-6xl mb-4 block">📝</span>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun template enregistré</h3>
                            <p className="text-gray-600 mb-6">Créez vos premiers templates pour gagner du temps</p>
                            <button className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition">
                                + Créer un template
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommunicationsDashboard;
