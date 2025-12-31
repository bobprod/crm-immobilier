import React from 'react';
import Link from 'next/link';
import { Send, Users, CheckCircle, Eye, XCircle, Clock, Play, Pause, Copy, Trash2, Calendar } from 'lucide-react';
import { Campaign, CampaignStatus, getCampaignStatusLabel, getCampaignStatusColor } from '../hooks/useCampaigns';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CampaignCardProps {
  campaign: Campaign;
  onLaunch?: (campaign: Campaign) => void;
  onPause?: (campaign: Campaign) => void;
  onDuplicate?: (campaign: Campaign) => void;
  onDelete?: (campaign: Campaign) => void;
}

/**
 * Campaign Card Component
 */
export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  onLaunch,
  onPause,
  onDuplicate,
  onDelete,
}) => {
  const statusColor = getCampaignStatusColor(campaign.status);
  const statusLabel = getCampaignStatusLabel(campaign.status);

  const colorClasses = {
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    red: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate mb-1">{campaign.name}</h3>
          {campaign.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{campaign.description}</p>
          )}
        </div>
      </div>

      {/* Status & Template */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${colorClasses[statusColor as keyof typeof colorClasses]}`}>
          {statusLabel}
        </span>
        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
          {campaign.templateName}
        </span>
      </div>

      {/* Schedule Info */}
      {campaign.scheduledAt && campaign.status === CampaignStatus.SCHEDULED && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <Calendar className="w-4 h-4" />
          <span>
            Planifiée pour le {format(new Date(campaign.scheduledAt), 'PPP à HH:mm', { locale: fr })}
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-3 pt-3 border-t border-gray-200">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Users className="w-3 h-3 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-900">{campaign.stats.totalRecipients}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Send className="w-3 h-3 text-blue-500" />
          </div>
          <p className="text-sm font-semibold text-blue-600">{campaign.stats.sent}</p>
          <p className="text-xs text-gray-500">Envoyés</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
          </div>
          <p className="text-sm font-semibold text-green-600">
            {campaign.stats.successRate.toFixed(0)}%
          </p>
          <p className="text-xs text-gray-500">Succès</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Eye className="w-3 h-3 text-purple-500" />
          </div>
          <p className="text-sm font-semibold text-purple-600">
            {campaign.stats.readRate.toFixed(0)}%
          </p>
          <p className="text-xs text-gray-500">Lus</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {campaign.status === CampaignStatus.DRAFT && onLaunch && (
          <button
            onClick={() => onLaunch(campaign)}
            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center justify-center gap-1 transition-colors"
          >
            <Play className="w-4 h-4" />
            Lancer
          </button>
        )}

        {campaign.status === CampaignStatus.RUNNING && onPause && (
          <button
            onClick={() => onPause(campaign)}
            className="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm flex items-center justify-center gap-1 transition-colors"
          >
            <Pause className="w-4 h-4" />
            Pause
          </button>
        )}

        <Link
          href={`/communication/whatsapp/campaigns/${campaign.id}`}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-center text-sm transition-colors"
        >
          Détails
        </Link>

        {onDuplicate && (
          <button
            onClick={() => onDuplicate(campaign)}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Dupliquer"
          >
            <Copy className="w-4 h-4 text-gray-600" />
          </button>
        )}

        {onDelete && campaign.status === CampaignStatus.DRAFT && (
          <button
            onClick={() => onDelete(campaign)}
            className="p-2 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        )}
      </div>

      {/* Time Info */}
      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
        {campaign.startedAt && (
          <p>Démarrée {formatDistanceToNow(new Date(campaign.startedAt), { addSuffix: true, locale: fr })}</p>
        )}
        {campaign.completedAt && (
          <p>Terminée {formatDistanceToNow(new Date(campaign.completedAt), { addSuffix: true, locale: fr })}</p>
        )}
        {!campaign.startedAt && !campaign.completedAt && (
          <p>Créée {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true, locale: fr })}</p>
        )}
      </div>
    </div>
  );
};

/**
 * Campaign Grid
 */
interface CampaignGridProps {
  campaigns: Campaign[];
  onLaunch?: (campaign: Campaign) => void;
  onPause?: (campaign: Campaign) => void;
  onDuplicate?: (campaign: Campaign) => void;
  onDelete?: (campaign: Campaign) => void;
  isLoading?: boolean;
}

export const CampaignGrid: React.FC<CampaignGridProps> = ({
  campaigns,
  onLaunch,
  onPause,
  onDuplicate,
  onDelete,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-full mb-3" />
            <div className="flex gap-2 mb-3">
              <div className="h-6 bg-gray-200 rounded-full w-20" />
              <div className="h-6 bg-gray-200 rounded-full w-24" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-12 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12">
        <Send className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 mb-2">Aucune campagne trouvée</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {campaigns.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          onLaunch={onLaunch}
          onPause={onPause}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
