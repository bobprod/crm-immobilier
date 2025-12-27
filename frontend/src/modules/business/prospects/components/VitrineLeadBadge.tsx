import React from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { Globe, Calendar, Home, FileText } from 'lucide-react';

interface VitrineLeadBadgeProps {
  vitrineData?: {
    formType: 'contact' | 'visit' | 'estimation';
    propertyId?: string;
    message?: string;
    preferredDate?: string;
  };
}

/**
 * Badge pour identifier et afficher les leads depuis la vitrine
 */
export function VitrineLeadBadge({ vitrineData }: VitrineLeadBadgeProps) {
  if (!vitrineData) return null;

  const getFormTypeInfo = () => {
    switch (vitrineData.formType) {
      case 'visit':
        return {
          label: 'Demande de visite',
          icon: Calendar,
          color: 'bg-blue-500',
        };
      case 'estimation':
        return {
          label: "Demande d'estimation",
          icon: FileText,
          color: 'bg-purple-500',
        };
      case 'contact':
      default:
        return {
          label: 'Contact vitrine',
          icon: Globe,
          color: 'bg-green-500',
        };
    }
  };

  const { label, icon: Icon, color } = getFormTypeInfo();

  return (
    <Badge className={`${color} text-white flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

/**
 * Composant détails lead vitrine
 */
export function VitrineLeadDetails({ vitrineData }: VitrineLeadBadgeProps) {
  if (!vitrineData) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900">Lead depuis la vitrine publique</h3>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">Type :</span> <VitrineLeadBadge vitrineData={vitrineData} />
        </div>

        {vitrineData.propertyId && (
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-gray-600" />
            <span className="font-medium">Bien concerné :</span>
            <a
              href={`/properties/${vitrineData.propertyId}`}
              className="text-blue-600 hover:underline"
            >
              Voir le bien
            </a>
          </div>
        )}

        {vitrineData.preferredDate && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            <span className="font-medium">Date souhaitée :</span>
            <span>{new Date(vitrineData.preferredDate).toLocaleDateString('fr-FR')}</span>
          </div>
        )}

        {vitrineData.message && (
          <div>
            <span className="font-medium">Message :</span>
            <p className="mt-1 text-gray-700 bg-white p-2 rounded border">{vitrineData.message}</p>
          </div>
        )}

        <div className="pt-2 border-t border-blue-200">
          <p className="text-xs text-gray-600">
            ✨ Ce lead a été capturé automatiquement depuis votre site vitrine
          </p>
        </div>
      </div>
    </div>
  );
}
