import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { MainLayout } from '@/shared/components/layout';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import { Search, Plus, FileText, Download, Trash2, Eye, Upload, Folder, Tag } from 'lucide-react';
import { api } from '../../lib/api-client';
import { useToast } from '@/shared/components/ui/use-toast';

interface Document {
  id: string;
  title: string;
  filename: string;
  type: string;
  category?: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
  tags?: string[];
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      loadDocuments();
    }
  }, [user, router, categoryFilter]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (categoryFilter !== 'all') {
        params.category = categoryFilter;
      }
      const response = await api.get('/documents', { params });
      setDocuments(response.data.documents || response.data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      setUploading(true);
      await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast({
        title: 'Succès',
        description: `${files.length} document(s) téléversé(s)`,
      });
      loadDocuments();
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de téléverser les documents',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDownload = async (id: string, filename: string) => {
    try {
      const response = await api.get(`/documents/${id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le document',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      await api.delete(`/documents/${id}`);
      toast({
        title: 'Succès',
        description: 'Document supprimé avec succès',
      });
      loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le document',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileTypeIcon = (type: string) => {
    return <FileText className="h-5 w-5 text-blue-600" />;
  };

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title?.toLowerCase().includes(search.toLowerCase()) ||
      doc.filename?.toLowerCase().includes(search.toLowerCase()) ||
      doc.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <MainLayout title="Documents">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout
        title="Documents"
        breadcrumbs={[
          { label: 'Documents' },
        ]}
      >
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Documents</h1>
              <p className="text-gray-600 mt-1">Téléversez, organisez et gérez vos documents</p>
            </div>
            <div className="flex gap-2">
              <Link href="/documents/generate">
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Générer avec IA
                </Button>
              </Link>
              <label htmlFor="file-upload">
                <Button disabled={uploading}>
                  {uploading ? (
                    <>Téléversement...</>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Téléverser
                    </>
                  )}
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Documents</p>
                    <p className="text-2xl font-bold">{documents.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Taille Totale</p>
                    <p className="text-2xl font-bold">
                      {formatFileSize(documents.reduce((sum, doc) => sum + (doc.size || 0), 0))}
                    </p>
                  </div>
                  <Folder className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Catégories</p>
                    <p className="text-2xl font-bold">
                      {new Set(documents.map((d) => d.category).filter(Boolean)).size}
                    </p>
                  </div>
                  <Tag className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Ce mois</p>
                    <p className="text-2xl font-bold">
                      {
                        documents.filter((d) => {
                          const docDate = new Date(d.createdAt);
                          const now = new Date();
                          return (
                            docDate.getMonth() === now.getMonth() &&
                            docDate.getFullYear() === now.getFullYear()
                          );
                        }).length
                      }
                    </p>
                  </div>
                  <Upload className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher un document..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={categoryFilter === 'all' ? 'default' : 'outline'}
                    onClick={() => setCategoryFilter('all')}
                  >
                    Tous
                  </Button>
                  <Button
                    variant={categoryFilter === 'contract' ? 'default' : 'outline'}
                    onClick={() => setCategoryFilter('contract')}
                  >
                    Contrats
                  </Button>
                  <Button
                    variant={categoryFilter === 'invoice' ? 'default' : 'outline'}
                    onClick={() => setCategoryFilter('invoice')}
                  >
                    Factures
                  </Button>
                  <Button
                    variant={categoryFilter === 'report' ? 'default' : 'outline'}
                    onClick={() => setCategoryFilter('report')}
                  >
                    Rapports
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents List */}
          <div className="grid gap-4">
            {filteredDocuments.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Aucun document trouvé</p>
                  <label htmlFor="file-upload-empty">
                    <Button>
                      <Upload className="h-4 w-4 mr-2" />
                      Téléverser votre premier document
                    </Button>
                    <input
                      id="file-upload-empty"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleUpload}
                    />
                  </label>
                </CardContent>
              </Card>
            ) : (
              filteredDocuments.map((doc) => (
                <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {getFileTypeIcon(doc.type)}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{doc.title || doc.filename}</h3>
                          <div className="flex gap-3 text-sm text-gray-500 mt-1">
                            <span>{doc.filename}</span>
                            <span>•</span>
                            <span>{formatFileSize(doc.size)}</span>
                            {doc.category && (
                              <>
                                <span>•</span>
                                <Badge variant="outline">{doc.category}</Badge>
                              </>
                            )}
                            <span>•</span>
                            <span>{new Date(doc.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                          {doc.tags && doc.tags.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {doc.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc.id, doc.filename)}
                          title="Télécharger"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(doc.id)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
