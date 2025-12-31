import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Plus, Search, Filter } from 'lucide-react';
import { useCampaigns, CampaignStatus } from '../../../../src/modules/communication/whatsapp/hooks/useCampaigns';
import { CampaignGrid } from '../../../../src/modules/communication/whatsapp/components/CampaignCard';

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<CampaignStatus | undefined>();

  const {
    campaigns,
    total,
    isLoading,
    launchCampaign,
    pauseCampaign,
    deleteCampaign,
    duplicateCampaign,
    getStatusCounts,
    getOverallStats,
  } = useCampaigns({
    search: searchQuery || undefined,
    status: selectedStatus,
  });

  const statusCounts = getStatusCounts();
  const overallStats = getOverallStats();

  const handleLaunch = async (campaign: any) => {
    if (!confirm(`Lancer la campagne "${campaign.name}" ?`)) return;
    try {
      await launchCampaign(campaign.id);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handlePause = async (campaign: any) => {
    try {
      await pauseCampaign(campaign.id);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDuplicate = async (campaign: any) => {
    try {
      await duplicateCampaign(campaign.id);
      alert('Campagne dupliquée avec succès');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDelete = async (campaign: any) => {
    if (!confirm(`Supprimer "${campaign.name}" ?`)) return;
    try {
      await deleteCampaign(campaign.id);
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Campagnes WhatsApp - CRM Immobilier</title>
      </Head>

      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/communication/whatsapp" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Campagnes WhatsApp</h1>
              <p className="text-gray-600 mt-1">{total} campagne{total > 1 ? 's' : ''}</p>
            </div>
          </div>

          <Link
            href="/communication/whatsapp/campaigns/create"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvelle campagne
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Campagnes</p>
            <p className="text-2xl font-bold text-gray-900">{overallStats.totalCampaigns}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Messages Envoyés</p>
            <p className="text-2xl font-bold text-blue-600">{overallStats.totalSent}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Taux de Succès</p>
            <p className="text-2xl font-bold text-green-600">{overallStats.avgSuccessRate.toFixed(1)}%</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Taux de Lecture</p>
            <p className="text-2xl font-bold text-purple-600">{overallStats.avgReadRate.toFixed(1)}%</p>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-1 flex gap-1 overflow-x-auto">
          <button
            onClick={() => setSelectedStatus(undefined)}
            className={`flex-1 min-w-[100px] px-4 py-2 rounded-md ${
              !selectedStatus ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Toutes ({total})
          </button>
          <button
            onClick={() => setSelectedStatus(CampaignStatus.DRAFT)}
            className={`flex-1 min-w-[100px] px-4 py-2 rounded-md ${
              selectedStatus === CampaignStatus.DRAFT ? 'bg-gray-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Brouillons ({statusCounts.draft})
          </button>
          <button
            onClick={() => setSelectedStatus(CampaignStatus.SCHEDULED)}
            className={`flex-1 min-w-[100px] px-4 py-2 rounded-md ${
              selectedStatus === CampaignStatus.SCHEDULED ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Planifiées ({statusCounts.scheduled})
          </button>
          <button
            onClick={() => setSelectedStatus(CampaignStatus.RUNNING)}
            className={`flex-1 min-w-[100px] px-4 py-2 rounded-md ${
              selectedStatus === CampaignStatus.RUNNING ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            En cours ({statusCounts.running})
          </button>
          <button
            onClick={() => setSelectedStatus(CampaignStatus.COMPLETED)}
            className={`flex-1 min-w-[100px] px-4 py-2 rounded-md ${
              selectedStatus === CampaignStatus.COMPLETED ? 'bg-purple-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Terminées ({statusCounts.completed})
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une campagne..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Campaigns Grid */}
        <CampaignGrid
          campaigns={campaigns}
          onLaunch={handleLaunch}
          onPause={handlePause}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
