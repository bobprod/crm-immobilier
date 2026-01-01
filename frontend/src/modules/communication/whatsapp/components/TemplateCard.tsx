import React from 'react';
import { FileText, Edit, Copy, Trash2, TrendingUp, Send, CheckCircle, XCircle, Clock } from 'lucide-react';
import { WhatsAppTemplate, TemplateStatus, TemplateCategory } from '../types/whatsapp.types';

interface TemplateCardProps {
  template: WhatsAppTemplate;
  onEdit?: (template: WhatsAppTemplate) => void;
  onDuplicate?: (template: WhatsAppTemplate) => void;
  onDelete?: (template: WhatsAppTemplate) => void;
  onView?: (template: WhatsAppTemplate) => void;
  showStats?: boolean;
}

/**
 * Template Card Component
 * Displays a WhatsApp template with stats and actions
 */
export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onEdit,
  onDuplicate,
  onDelete,
  onView,
  showStats = true,
}) => {
  // Get status color
  const getStatusColor = (status: TemplateStatus) => {
    switch (status) {
      case TemplateStatus.APPROVED:
        return 'bg-green-100 text-green-700 border-green-200';
      case TemplateStatus.PENDING:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case TemplateStatus.REJECTED:
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Get status label
  const getStatusLabel = (status: TemplateStatus) => {
    switch (status) {
      case TemplateStatus.APPROVED:
        return 'Approuvé';
      case TemplateStatus.PENDING:
        return 'En attente';
      case TemplateStatus.REJECTED:
        return 'Rejeté';
      default:
        return status;
    }
  };

  // Get category color
  const getCategoryColor = (category: TemplateCategory) => {
    switch (category) {
      case TemplateCategory.MARKETING:
        return 'bg-purple-100 text-purple-700';
      case TemplateCategory.UTILITY:
        return 'bg-blue-100 text-blue-700';
      case TemplateCategory.AUTHENTICATION:
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Get category label
  const getCategoryLabel = (category: TemplateCategory) => {
    switch (category) {
      case TemplateCategory.MARKETING:
        return 'Marketing';
      case TemplateCategory.UTILITY:
        return 'Utilitaire';
      case TemplateCategory.AUTHENTICATION:
        return 'Authentification';
      default:
        return category;
    }
  };

  // Calculate stats
  const total = template.sentCount;
  const successRate = total > 0
    ? ((template.deliveredCount / total) * 100).toFixed(1)
    : '0';
  const readRate = total > 0
    ? ((template.readCount / total) * 100).toFixed(1)
    : '0';
  const failRate = total > 0
    ? ((template.failedCount / total) * 100).toFixed(1)
    : '0';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <h3 className="font-semibold text-gray-900 truncate">
              {template.name}
            </h3>
          </div>
          <p className="text-xs text-gray-500">
            {template.language.toUpperCase()}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-2">
          {onView && (
            <button
              onClick={() => onView(template)}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Voir"
            >
              <FileText className="w-4 h-4 text-gray-600" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(template)}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Modifier"
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
          )}
          {onDuplicate && (
            <button
              onClick={() => onDuplicate(template)}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Dupliquer"
            >
              <Copy className="w-4 h-4 text-gray-600" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(template)}
              className="p-1.5 hover:bg-red-50 rounded transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          )}
        </div>
      </div>

      {/* Body Preview */}
      <div className="mb-3">
        <p className="text-sm text-gray-700 line-clamp-2">
          {template.body}
        </p>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(template.status)}`}>
          {getStatusLabel(template.status)}
        </span>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(template.category)}`}>
          {getCategoryLabel(template.category)}
        </span>
      </div>

      {/* Stats */}
      {showStats && total > 0 && (
        <div className="border-t border-gray-200 pt-3">
          <div className="grid grid-cols-4 gap-2 text-center">
            {/* Total Sent */}
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Send className="w-3 h-3 text-gray-400" />
              </div>
              <p className="text-lg font-semibold text-gray-900">{total}</p>
              <p className="text-xs text-gray-500">Envoyés</p>
            </div>

            {/* Delivered */}
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
              </div>
              <p className="text-lg font-semibold text-green-600">{successRate}%</p>
              <p className="text-xs text-gray-500">Délivrés</p>
            </div>

            {/* Read */}
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-blue-500" />
              </div>
              <p className="text-lg font-semibold text-blue-600">{readRate}%</p>
              <p className="text-xs text-gray-500">Lus</p>
            </div>

            {/* Failed */}
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <XCircle className="w-3 h-3 text-red-500" />
              </div>
              <p className="text-lg font-semibold text-red-600">{failRate}%</p>
              <p className="text-xs text-gray-500">Échecs</p>
            </div>
          </div>
        </div>
      )}

      {/* No Stats Message */}
      {showStats && total === 0 && (
        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <Clock className="w-4 h-4" />
            <p className="text-xs">Aucune statistique disponible</p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Template Card Skeleton Loader
 */
export const TemplateCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="animate-pulse">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="flex gap-1">
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Body */}
        <div className="mb-3">
          <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>

        {/* Badges */}
        <div className="flex gap-2 mb-3">
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          <div className="h-6 bg-gray-200 rounded-full w-24"></div>
        </div>

        {/* Stats */}
        <div className="border-t border-gray-200 pt-3">
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="h-6 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-12 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Template Grid Layout
 */
interface TemplateGridProps {
  templates: WhatsAppTemplate[];
  onEdit?: (template: WhatsAppTemplate) => void;
  onDuplicate?: (template: WhatsAppTemplate) => void;
  onDelete?: (template: WhatsAppTemplate) => void;
  onView?: (template: WhatsAppTemplate) => void;
  isLoading?: boolean;
}

export const TemplateGrid: React.FC<TemplateGridProps> = ({
  templates,
  onEdit,
  onDuplicate,
  onDelete,
  onView,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <TemplateCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 mb-2">Aucun template trouvé</p>
        <p className="text-sm text-gray-400">Créez votre premier template pour commencer</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onView={onView}
        />
      ))}
    </div>
  );
};
