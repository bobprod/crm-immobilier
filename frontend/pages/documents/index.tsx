import { useState, useEffect, useRef, useCallback } from 'react';
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
  Search,
  FileText,
  Download,
  Trash2,
  Upload,
  Folder,
  Tag,
  Eye,
  ScanLine,
  Sparkles,
  LayoutTemplate,
  FolderOpen,
  File,
  FileImage,
  FileSpreadsheet,
  FileCode,
  Loader2,
  Calendar,
  HardDrive,
  X,
  CheckCircle2,
} from 'lucide-react';
import DocumentOcr from '@/modules/content/documents/components/DocumentOcr';
import DocumentGenerator from '@/modules/content/documents/components/DocumentGenerator';
import DocumentTemplates from '@/modules/content/documents/components/DocumentTemplates';

// Backend Prisma model → frontend mapping
interface BackendDocument {
  id: string;
  name: string;
  originalName: string;
  description?: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  extension: string;
  tags?: string[];
  status?: string;
  realEstateDocType?: string;
  ocrProcessed?: boolean;
  aiGenerated?: boolean;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string; color?: string; icon?: string } | null;
  prospects?: { id: string; firstName: string; lastName: string } | null;
  properties?: { id: string; title: string } | null;
}

const FILE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
  jpg: FileImage,
  jpeg: FileImage,
  png: FileImage,
  gif: FileImage,
  webp: FileImage,
  tiff: FileImage,
  bmp: FileImage,
  html: FileCode,
  json: FileCode,
  xml: FileCode,
};

const FILE_COLORS: Record<string, string> = {
  pdf: 'text-red-500',
  doc: 'text-blue-600',
  docx: 'text-blue-600',
  xls: 'text-green-600',
  xlsx: 'text-green-600',
  csv: 'text-green-600',
  jpg: 'text-purple-500',
  jpeg: 'text-purple-500',
  png: 'text-purple-500',
  gif: 'text-purple-500',
  webp: 'text-purple-500',
  tiff: 'text-purple-500',
  bmp: 'text-purple-500',
};

const STATUS_STYLES: Record<string, { label: string; class: string }> = {
  draft: { label: 'Brouillon', class: 'bg-gray-100 text-gray-700' },
  pending: { label: 'En attente', class: 'bg-yellow-100 text-yellow-700' },
  validated: { label: 'Validé', class: 'bg-green-100 text-green-700' },
  signed: { label: 'Signé', class: 'bg-blue-100 text-blue-700' },
  archived: { label: 'Archivé', class: 'bg-slate-100 text-slate-600' },
  rejected: { label: 'Rejeté', class: 'bg-red-100 text-red-700' },
};

function getFileIcon(ext: string) {
  return FILE_ICONS[ext?.toLowerCase()] || File;
}

function getFileColor(ext: string) {
  return FILE_COLORS[ext?.toLowerCase()] || 'text-gray-500';
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<BackendDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<BackendDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const activeTab = (router.query.tab as string) || 'documents';

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      loadDocuments();
    }
  }, [user]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const response = await api.get('/documents', { params });
      setDocuments(response.data?.documents || response.data || []);
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

  // Upload one file at a time (backend expects single 'file' field)
  const uploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < fileArray.length; i++) {
      try {
        const formData = new FormData();
        formData.append('file', fileArray[i]);
        formData.append('name', fileArray[i].name);
        await api.post('/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        successCount++;
      } catch {
        errorCount++;
      }
      setUploadProgress(Math.round(((i + 1) / fileArray.length) * 100));
    }

    if (successCount > 0) {
      toast({ title: 'Succès', description: `${successCount} document(s) téléversé(s)` });
    }
    if (errorCount > 0) {
      toast({
        title: 'Erreur',
        description: `${errorCount} fichier(s) en échec`,
        variant: 'destructive',
      });
    }
    setUploading(false);
    setUploadProgress(0);
    loadDocuments();
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    await uploadFiles(files);
    event.target.value = '';
  };

  // Drag-and-drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadFiles(files);
    }
  }, []);

  const handleDownload = async (doc: BackendDocument) => {
    try {
      const response = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.originalName || doc.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le document',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;
    try {
      await api.delete(`/documents/${id}`);
      toast({ title: 'Succès', description: 'Document supprimé' });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le document',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 o';
    const k = 1024;
    const sizes = ['o', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredDocuments = documents.filter((doc) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      doc.name?.toLowerCase().includes(q) ||
      doc.originalName?.toLowerCase().includes(q) ||
      doc.description?.toLowerCase().includes(q) ||
      doc.category?.name?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalSize = documents.reduce((s, d) => s + (d.fileSize || 0), 0);
  const uniqueCategories = new Set(documents.map((d) => d.category?.name).filter(Boolean)).size;
  const thisMonthCount = documents.filter((d) => {
    const dt = new Date(d.createdAt);
    const now = new Date();
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
  }).length;

  const statusOptions = [
    { value: 'all', label: 'Tous' },
    { value: 'draft', label: 'Brouillons' },
    { value: 'pending', label: 'En attente' },
    { value: 'validated', label: 'Validés' },
    { value: 'signed', label: 'Signés' },
    { value: 'archived', label: 'Archivés' },
  ];

  return (
    <ProtectedRoute>
      <MainLayout title="Documents" breadcrumbs={[{ label: 'Documents' }]}>
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <FileText className="h-7 w-7 text-blue-600" />
                </div>
                {t('documents.pageTitle')}
              </h1>
              <p className="text-gray-500 mt-1 ml-14">{t('documents.pageSubtitle')}</p>
            </div>
            <label htmlFor="file-upload-header">
              <Button disabled={uploading} asChild className="gap-2">
                <span>
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Envoi {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" /> Téléverser
                    </>
                  )}
                </span>
              </Button>
              <input
                id="file-upload-header"
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t('documents.totalDocs')}
                    </p>
                    <p className="text-2xl font-bold mt-1">{documents.length}</p>
                  </div>
                  <div className="p-2.5 bg-blue-50 rounded-xl">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t('documents.totalSize')}
                    </p>
                    <p className="text-2xl font-bold mt-1">{formatFileSize(totalSize)}</p>
                  </div>
                  <div className="p-2.5 bg-green-50 rounded-xl">
                    <HardDrive className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t('documents.categories')}
                    </p>
                    <p className="text-2xl font-bold mt-1">{uniqueCategories}</p>
                  </div>
                  <div className="p-2.5 bg-purple-50 rounded-xl">
                    <Folder className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t('documents.thisMonth')}
                    </p>
                    <p className="text-2xl font-bold mt-1">{thisMonthCount}</p>
                  </div>
                  <div className="p-2.5 bg-orange-50 rounded-xl">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => router.push({ query: { tab: v } }, undefined, { shallow: true })}
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" /> {t('documents.tabs.documents')}
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
              {/* Drag-and-drop zone */}
              <div
                ref={dropRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative transition-all duration-200 ${
                  dragging ? 'ring-2 ring-blue-400 ring-offset-2 rounded-xl' : ''
                }`}
              >
                {dragging && (
                  <div className="absolute inset-0 bg-blue-50/90 z-10 rounded-xl flex items-center justify-center border-2 border-dashed border-blue-400">
                    <div className="text-center">
                      <Upload className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                      <p className="text-blue-700 font-semibold text-lg">
                        Déposez vos fichiers ici
                      </p>
                      <p className="text-blue-500 text-sm">PDF, images, documents — Max 50 Mo</p>
                    </div>
                  </div>
                )}

                {/* Filters */}
                <Card>
                  <CardContent className="pt-5 pb-5">
                    <div className="flex gap-3 items-center flex-wrap">
                      <div className="flex-1 min-w-[220px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Rechercher par nom, description..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && loadDocuments()}
                          className="pl-10"
                        />
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {statusOptions.map((opt) => (
                          <Button
                            key={opt.value}
                            variant={statusFilter === opt.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter(opt.value)}
                            className="text-xs"
                          >
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Upload progress */}
                {uploading && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-blue-700 font-medium">Téléversement en cours...</span>
                        <span className="text-blue-600">{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents List */}
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="text-sm text-gray-500">Chargement des documents...</p>
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="text-center py-16">
                      <div className="p-4 bg-gray-50 rounded-full w-fit mx-auto mb-4">
                        <FileText className="h-12 w-12 text-gray-300" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-1">
                        Aucun document trouvé
                      </h3>
                      <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        {documents.length === 0
                          ? "Commencez par téléverser un fichier ou générez un document avec l'IA."
                          : 'Aucun document ne correspond à vos filtres.'}
                      </p>
                      <div className="flex gap-3 justify-center">
                        <label htmlFor="file-upload-empty">
                          <Button asChild className="gap-2">
                            <span>
                              <Upload className="h-4 w-4" /> Téléverser un fichier
                            </span>
                          </Button>
                          <input
                            id="file-upload-empty"
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleUpload}
                          />
                        </label>
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() =>
                            router.push({ query: { tab: 'generate' } }, undefined, {
                              shallow: true,
                            })
                          }
                        >
                          <Sparkles className="h-4 w-4" /> Générer avec l'IA
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 px-1">
                      {filteredDocuments.length} document{filteredDocuments.length > 1 ? 's' : ''}
                      {statusFilter !== 'all' &&
                        ` · Filtre: ${statusOptions.find((o) => o.value === statusFilter)?.label}`}
                    </p>
                    {filteredDocuments.map((doc) => {
                      const IconComp = getFileIcon(doc.extension);
                      const iconColor = getFileColor(doc.extension);
                      const statusStyle = doc.status ? STATUS_STYLES[doc.status] : null;
                      const tags = Array.isArray(doc.tags) ? doc.tags : [];

                      return (
                        <Card
                          key={doc.id}
                          className="group hover:shadow-md hover:border-gray-300 transition-all"
                        >
                          <CardContent className="py-4 px-5">
                            <div className="flex items-center gap-4">
                              {/* File icon */}
                              <div
                                className={`p-2.5 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors shrink-0`}
                              >
                                <IconComp className={`h-5 w-5 ${iconColor}`} />
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-gray-900 truncate">
                                    {doc.name}
                                  </h3>
                                  {doc.aiGenerated && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] gap-1 shrink-0 border-violet-200 text-violet-600"
                                    >
                                      <Sparkles className="h-2.5 w-2.5" /> IA
                                    </Badge>
                                  )}
                                  {doc.ocrProcessed && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] gap-1 shrink-0 border-teal-200 text-teal-600"
                                    >
                                      <ScanLine className="h-2.5 w-2.5" /> OCR
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 flex-wrap">
                                  <span className="uppercase font-medium">{doc.extension}</span>
                                  <span className="text-gray-200">·</span>
                                  <span>{formatFileSize(doc.fileSize)}</span>
                                  <span className="text-gray-200">·</span>
                                  <span>
                                    {new Date(doc.createdAt).toLocaleDateString('fr-FR', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </span>
                                  {doc.category && (
                                    <>
                                      <span className="text-gray-200">·</span>
                                      <Badge variant="outline" className="text-[10px] py-0">
                                        {doc.category.name}
                                      </Badge>
                                    </>
                                  )}
                                  {statusStyle && (
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusStyle.class}`}
                                    >
                                      {statusStyle.label}
                                    </span>
                                  )}
                                </div>
                                {tags.length > 0 && (
                                  <div className="flex gap-1 mt-1.5">
                                    {(tags as string[]).slice(0, 4).map((tag, i) => (
                                      <Badge
                                        key={i}
                                        variant="secondary"
                                        className="text-[10px] py-0"
                                      >
                                        {tag}
                                      </Badge>
                                    ))}
                                    {tags.length > 4 && (
                                      <span className="text-[10px] text-gray-400">
                                        +{tags.length - 4}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setPreviewDoc(doc)}
                                  title="Aperçu"
                                  className="text-gray-400 hover:text-blue-600"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownload(doc)}
                                  title="Télécharger"
                                  className="text-gray-400 hover:text-green-600"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(doc.id)}
                                  title="Supprimer"
                                  className="text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
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

          {/* ──── Preview Modal ──── */}
          {previewDoc && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label={previewDoc.name}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={() => setPreviewDoc(null)}
              onKeyDown={(e) => e.key === 'Escape' && setPreviewDoc(null)}
            >
              <div
                className="bg-white rounded-xl shadow-2xl max-w-lg w-full m-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <h3 className="font-semibold text-lg truncate pr-4">{previewDoc.name}</h3>
                  <Button variant="ghost" size="sm" onClick={() => setPreviewDoc(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs mb-0.5">Nom original</p>
                      <p className="font-medium truncate">{previewDoc.originalName}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-0.5">Type</p>
                      <p className="font-medium uppercase">
                        {previewDoc.extension} · {previewDoc.mimeType}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-0.5">Taille</p>
                      <p className="font-medium">{formatFileSize(previewDoc.fileSize)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-0.5">Date</p>
                      <p className="font-medium">
                        {new Date(previewDoc.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {previewDoc.category && (
                      <div>
                        <p className="text-gray-400 text-xs mb-0.5">Catégorie</p>
                        <Badge variant="outline">{previewDoc.category.name}</Badge>
                      </div>
                    )}
                    {previewDoc.status && STATUS_STYLES[previewDoc.status] && (
                      <div>
                        <p className="text-gray-400 text-xs mb-0.5">Statut</p>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${STATUS_STYLES[previewDoc.status].class}`}
                        >
                          {STATUS_STYLES[previewDoc.status].label}
                        </span>
                      </div>
                    )}
                    {previewDoc.description && (
                      <div className="col-span-2">
                        <p className="text-gray-400 text-xs mb-0.5">Description</p>
                        <p className="text-sm text-gray-700">{previewDoc.description}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    {previewDoc.aiGenerated && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Sparkles className="h-3 w-3" /> Généré par IA
                      </Badge>
                    )}
                    {previewDoc.ocrProcessed && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <CheckCircle2 className="h-3 w-3" /> OCR traité
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 px-6 py-4 border-t bg-gray-50">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => {
                      handleDownload(previewDoc);
                      setPreviewDoc(null);
                    }}
                  >
                    <Download className="h-4 w-4" /> Télécharger
                  </Button>
                  <Button
                    variant="destructive"
                    className="gap-2"
                    onClick={() => {
                      handleDelete(previewDoc.id);
                      setPreviewDoc(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4" /> Supprimer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
