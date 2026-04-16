import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '@/shared/components/layout';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import { useToast } from '@/shared/components/ui/use-toast';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { api } from '../../lib/api-client';
import {
  Search, FileText, Download, Trash2, Upload, Folder, Tag, Eye,
  ScanLine, Sparkles, LayoutTemplate, FolderOpen, Wand2
} from 'lucide-react';
import DocumentOcr from '@/modules/content/documents/components/DocumentOcr';
import DocumentGenerator from '@/modules/content/documents/components/DocumentGenerator';
import DocumentTemplates from '@/modules/content/documents/components/DocumentTemplates';
import DocumentSmartWizard from '@/modules/content/documents/components/DocumentSmartWizard';

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
  status?: string;
  realEstateType?: string;
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [uploading, setUploading] = useState(false);

  const activeTab = (router.query.tab as string) || 'documents';

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
      if (categoryFilter !== 'all') params.category = categoryFilter;
      const response = await api.get('/documents', { params });
      setDocuments(response.data?.documents || response.data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les documents', variant: 'destructive' });
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
      await api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast({ title: 'Succès', description: `${files.length} document(s) téléversé(s)` });
      loadDocuments();
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de téléverser les documents', variant: 'destructive' });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDownload = async (id: string, filename: string) => {
    try {
      const response = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de télécharger le document', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;
    try {
      await api.delete(`/documents/${id}`);
      toast({ title: 'Succès', description: 'Document supprimé' });
      loadDocuments();
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de supprimer le document', variant: 'destructive' });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 o';
    const k = 1024;
    const sizes = ['o', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title?.toLowerCase().includes(search.toLowerCase()) ||
      doc.filename?.toLowerCase().includes(search.toLowerCase()) ||
      doc.category?.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [
    { value: 'all', label: 'Tous' },
    { value: 'contract', label: 'Contrats' },
    { value: 'invoice', label: 'Factures' },
    { value: 'report', label: 'Rapports' },
    { value: 'visit', label: 'Visites' },
    { value: 'evaluation', label: 'Évaluations' },
    { value: 'mandate', label: 'Mandats' },
    { value: 'ocr', label: 'OCR' },
  ];

  return (
    <ProtectedRoute>
      <MainLayout title="Documents" breadcrumbs={[{ label: 'Documents' }]}>
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('documents.pageTitle')}</h1>
              <p className="text-gray-600 mt-1">{t('documents.pageSubtitle')}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('documents.totalDocs')}</p>
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
                    <p className="text-sm text-gray-600">{t('documents.totalSize')}</p>
                    <p className="text-2xl font-bold">{formatFileSize(documents.reduce((s, d) => s + (d.size || 0), 0))}</p>
                  </div>
                  <Folder className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('documents.categories')}</p>
                    <p className="text-2xl font-bold">{new Set(documents.map((d) => d.category).filter(Boolean)).size}</p>
                  </div>
                  <Tag className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('documents.thisMonth')}</p>
                    <p className="text-2xl font-bold">
                      {documents.filter((d) => {
                        const dt = new Date(d.createdAt), now = new Date();
                        return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
                      }).length}
                    </p>
                  </div>
                  <Upload className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => router.push({ query: { tab: v } }, undefined, { shallow: true })}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" /> {t('documents.tabs.documents')}
              </TabsTrigger>
              <TabsTrigger value="wizard" className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" /> Wizard IA
              </TabsTrigger>
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> {t('documents.tabs.generate')}
              </TabsTrigger>
              <TabsTrigger value="ocr" className="flex items-center gap-2">
                <ScanLine className="h-4 w-4" /> {t('documents.tabs.ocr')}
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4" /> {t('documents.tabs.templates')}
              </TabsTrigger>
            </TabsList>

            {/* ──── TAB: DOCUMENTS ──── */}
            <TabsContent value="documents" className="space-y-4 mt-4">
              {/* Filters + Upload */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4 items-center flex-wrap">
                    <div className="flex-1 min-w-[200px] relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Rechercher un document..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {categories.map((cat) => (
                        <Button
                          key={cat.value}
                          variant={categoryFilter === cat.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCategoryFilter(cat.value)}
                        >
                          {cat.label}
                        </Button>
                      ))}
                    </div>
                    <label htmlFor="file-upload">
                      <Button disabled={uploading} asChild>
                        <span>
                          {uploading ? 'Envoi...' : <><Upload className="h-4 w-4 mr-2" /> Téléverser</>}
                        </span>
                      </Button>
                      <input id="file-upload" type="file" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Documents List */}
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                </div>
              ) : filteredDocuments.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Aucun document trouvé</p>
                    <div className="flex gap-3 justify-center">
                      <label htmlFor="file-upload-empty">
                        <Button asChild><span><Upload className="h-4 w-4 mr-2" /> Téléverser</span></Button>
                        <input id="file-upload-empty" type="file" multiple className="hidden" onChange={handleUpload} />
                      </label>
                      <Button variant="outline" onClick={() => router.push({ query: { tab: 'generate' } }, undefined, { shallow: true })}>
                        <Sparkles className="h-4 w-4 mr-2" /> Générer un document
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {filteredDocuments.map((doc) => (
                    <Card key={doc.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-5 pb-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold truncate">{doc.title || doc.filename}</h3>
                              <div className="flex gap-3 text-sm text-gray-500 mt-1 flex-wrap">
                                <span className="truncate max-w-[200px]">{doc.filename}</span>
                                <span>•</span>
                                <span>{formatFileSize(doc.size)}</span>
                                {doc.category && (<><span>•</span><Badge variant="outline" className="text-xs">{doc.category}</Badge></>)}
                                {doc.status && (<Badge variant="secondary" className="text-xs">{doc.status}</Badge>)}
                                <span>•</span>
                                <span>{new Date(doc.createdAt).toLocaleDateString('fr-FR')}</span>
                              </div>
                              {doc.tags && doc.tags.length > 0 && (
                                <div className="flex gap-1 mt-2">
                                  {doc.tags.map((tag, i) => <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="sm" onClick={() => handleDownload(doc.id, doc.filename)} title="Télécharger">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id)} title="Supprimer">
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ──── TAB: WIZARD IA ──── */}
            <TabsContent value="wizard" className="mt-4">
              <DocumentSmartWizard />
            </TabsContent>

            {/* ──── TAB: GENERATE ──── */}
            <TabsContent value="generate" className="mt-4">
              <DocumentGenerator />
            </TabsContent>

            {/* ──── TAB: OCR ──── */}
            <TabsContent value="ocr" className="mt-4">
              <DocumentOcr />
            </TabsContent>

            {/* ──── TAB: TEMPLATES ──── */}
            <TabsContent value="templates" className="mt-4">
              <DocumentTemplates />
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
