import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import propertiesAPI, { Property } from '../../shared/utils/properties-api';
import { Button } from '../../shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../shared/components/ui/table';
import { Trash2, RefreshCw, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '../../shared/components/ui/use-toast';

export default function TrashedPropertiesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadTrashed = async () => {
    try {
      setLoading(true);
      const data = await propertiesAPI.getTrashed();
      setProperties(data);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de charger les biens supprimés',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrashed();
  }, []);

  const handleRestore = async (id: string) => {
    try {
      await propertiesAPI.restore(id);
      toast({
        title: 'Succès',
        description: 'Bien restauré avec succès',
      });
      loadTrashed();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de restaurer le bien',
        variant: 'destructive',
      });
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement ce bien ? Cette action est irréversible.')) {
      return;
    }

    try {
      await propertiesAPI.permanentDelete(id);
      toast({
        title: 'Succès',
        description: 'Bien supprimé définitivement',
      });
      loadTrashed();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer le bien',
        variant: 'destructive',
      });
    }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => propertiesAPI.restore(id))
      );
      toast({
        title: 'Succès',
        description: `${selectedIds.size} bien(s) restauré(s)`,
      });
      setSelectedIds(new Set());
      loadTrashed();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la restauration',
        variant: 'destructive',
      });
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === properties.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(properties.map((p) => p.id)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-6 w-6" />
                Corbeille
              </CardTitle>
              <CardDescription>
                Biens supprimés - {properties.length} bien(s)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedIds.size > 0 && (
                <Button onClick={handleBulkRestore} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restaurer ({selectedIds.size})
                </Button>
              )}
              <Button onClick={() => router.push('/properties')} variant="outline">
                Retour
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun bien dans la corbeille</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === properties.length}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead>Supprimé le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(property.id)}
                        onChange={() => toggleSelection(property.id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{property.title}</TableCell>
                    <TableCell>{property.type}</TableCell>
                    <TableCell>
                      {property.price.toLocaleString()} {property.currency || 'TND'}
                    </TableCell>
                    <TableCell>{property.city || '-'}</TableCell>
                    <TableCell>
                      {property.deletedAt
                        ? new Date(property.deletedAt).toLocaleDateString('fr-FR')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleRestore(property.id)}
                          size="sm"
                          variant="outline"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handlePermanentDelete(property.id)}
                          size="sm"
                          variant="destructive"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
