import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Plus, Building2, Users, Calendar, FileText, Send } from 'lucide-react';
import { useRouter } from 'next/router';

export function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      title: 'Nouvelle propriété',
      description: 'Ajouter un bien immobilier',
      icon: Building2,
      action: () => router.push('/properties/new'),
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'Nouveau prospect',
      description: 'Enregistrer un nouveau prospect',
      icon: Users,
      action: () => router.push('/prospects/new'),
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'Nouveau rendez-vous',
      description: 'Planifier un rendez-vous',
      icon: Calendar,
      action: () => router.push('/appointments/new'),
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: 'Générer document',
      description: 'Créer un document IA',
      icon: FileText,
      action: () => router.push('/documents/generate'),
      color: 'bg-orange-500 hover:bg-orange-600',
    },
    {
      title: 'Envoyer email',
      description: 'Campagne de communication',
      icon: Send,
      action: () => router.push('/communications/email'),
      color: 'bg-red-500 hover:bg-red-600',
    },
    {
      title: 'Matching IA',
      description: 'Trouver des correspondances',
      icon: Plus,
      action: () => router.push('/matching'),
      color: 'bg-indigo-500 hover:bg-indigo-600',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions rapides</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.title}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                onClick={action.action}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
