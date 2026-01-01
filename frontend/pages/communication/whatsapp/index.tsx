import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { MessageCircle, Settings, Users, FileText, BarChart3, Send, Plus, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useWhatsAppConfig } from '../../../src/modules/communication/whatsapp/hooks/useWhatsAppConfig';
import { WhatsAppStats, StatsPeriodSelector } from '../../../src/modules/communication/whatsapp/components/WhatsAppStats';
import { WhatsAppStats as StatsType } from '../../../src/modules/communication/whatsapp/types/whatsapp.types';

/**
 * WhatsApp Dashboard - Main Page
 * Overview of WhatsApp messaging, conversations, and analytics
 */
export default function WhatsAppDashboard() {
  const { config, hasConfig, isLoading } = useWhatsAppConfig();
  const [statsPeriod, setStatsPeriod] = useState<'7days' | '30days' | '90days' | 'today'>('7days');

  // Mock stats (replace with real API call)
  const stats: StatsType | null = hasConfig ? {
    totalMessages: 1247,
    totalConversations: 89,
    activeConversations: 23,
    messagesReceived: 673,
    messagesSent: 574,
    responseRate: 87.3,
    averageResponseTime: 18, // minutes
    templatesUsed: 34,
    period: statsPeriod,
  } : null;

  // Mock recent conversations
  const recentConversations = [
    {
      id: '1',
      contactName: 'Sophie Martin',
      phoneNumber: '+33612345678',
      lastMessage: 'Merci pour votre réponse rapide!',
      timestamp: '2 min',
      unreadCount: 0,
      status: 'resolved',
    },
    {
      id: '2',
      contactName: 'Thomas Dubois',
      phoneNumber: '+33698765432',
      lastMessage: 'Je suis intéressé par le bien au 15 rue...',
      timestamp: '15 min',
      unreadCount: 2,
      status: 'open',
    },
    {
      id: '3',
      contactName: 'Marie Lambert',
      phoneNumber: '+33611223344',
      lastMessage: 'Quels sont les horaires de visite?',
      timestamp: '1h',
      unreadCount: 1,
      status: 'assigned',
    },
  ];

  // Mock trending templates
  const trendingTemplates = [
    { name: 'welcome_message', sent: 145, rate: 94.5, trend: 'up' },
    { name: 'appointment_reminder', sent: 89, rate: 91.2, trend: 'up' },
    { name: 'property_alert', sent: 67, rate: 76.8, trend: 'down' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // No Config State
  if (!hasConfig) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>WhatsApp - CRM Immobilier</title>
        </Head>

        <div className="max-w-4xl mx-auto py-16 px-4">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">WhatsApp Business</h1>
            <p className="text-xl text-gray-600">
              Communiquez avec vos prospects et clients via WhatsApp
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <Send className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Messages Automatisés</h3>
              <p className="text-sm text-gray-600">
                Envoyez des messages de bienvenue et des réponses automatiques
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <Users className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Gestion de Conversations</h3>
              <p className="text-sm text-gray-600">
                Organisez et suivez toutes vos conversations WhatsApp
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <FileText className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Templates Approuvés</h3>
              <p className="text-sm text-gray-600">
                Utilisez des templates pré-approuvés par WhatsApp
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/communication/whatsapp/config"
              className="inline-flex items-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-600 text-white text-lg font-semibold rounded-lg transition-colors"
            >
              <Settings className="w-6 h-6" />
              Configurer WhatsApp
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              Connectez votre compte WhatsApp Business en quelques minutes
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard with Config
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>WhatsApp Dashboard - CRM Immobilier</title>
      </Head>

      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <MessageCircle className="w-8 h-8 text-green-600" />
              WhatsApp Business
            </h1>
            <p className="text-gray-600 mt-1">Vue d'ensemble de vos communications WhatsApp</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/communication/whatsapp/conversations"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <Users className="w-4 h-4" />
              Conversations
            </Link>
            <Link
              href="/communication/whatsapp/config"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Paramètres
            </Link>
          </div>
        </div>

        {/* Config Status Banner */}
        {!config?.isActive && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Settings className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-yellow-900">WhatsApp est actuellement désactivé</p>
                <p className="text-sm text-yellow-700">Activez-le pour commencer à recevoir et envoyer des messages</p>
              </div>
            </div>
            <Link
              href="/communication/whatsapp/config"
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
            >
              Activer
            </Link>
          </div>
        )}

        {/* Period Selector */}
        <div className="mb-6 flex justify-end">
          <StatsPeriodSelector value={statsPeriod} onChange={setStatsPeriod} />
        </div>

        {/* Stats Grid */}
        <div className="mb-8">
          <WhatsAppStats stats={stats} isLoading={false} />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Conversations */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Conversations Récentes</h2>
              <Link href="/communication/whatsapp/conversations" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                Voir tout <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentConversations.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/communication/whatsapp/conversations/${conv.id}`}
                  className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                        {conv.contactName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{conv.contactName}</h3>
                        <p className="text-xs text-gray-500">{conv.phoneNumber}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-gray-500">{conv.timestamp}</span>
                      {conv.unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                  <span className={`inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded ${
                    conv.status === 'open' ? 'bg-green-100 text-green-700' :
                    conv.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {conv.status === 'open' ? 'Ouvert' : conv.status === 'assigned' ? 'Assigné' : 'Résolu'}
                  </span>
                </Link>
              ))}
            </div>

            <button className="w-full mt-4 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 flex items-center justify-center gap-2 transition-colors">
              <Plus className="w-5 h-5" />
              Nouvelle Conversation
            </button>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h2>
              <div className="space-y-2">
                <Link
                  href="/communication/whatsapp/conversations?status=open"
                  className="block px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Conversations Ouvertes</span>
                    <span className="text-2xl font-bold">23</span>
                  </div>
                </Link>

                <Link
                  href="/communication/whatsapp/templates"
                  className="block px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Templates</span>
                    <FileText className="w-5 h-5" />
                  </div>
                </Link>

                <Link
                  href="/communication/whatsapp/analytics"
                  className="block px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Analytics</span>
                    <BarChart3 className="w-5 h-5" />
                  </div>
                </Link>
              </div>
            </div>

            {/* Trending Templates */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Templates Populaires</h2>
              <div className="space-y-3">
                {trendingTemplates.map((template, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{template.name}</span>
                      {template.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{template.sent} envoyés</span>
                      <span className="font-medium text-green-600">{template.rate}% taux</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
