import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { useToast } from '@/shared/components/ui/use-toast';
import { api } from '../../../../../lib/api-client';
import {
  ScanLine,
  Upload,
  FileText,
  Search,
  Clock,
  Eye,
  Copy,
  Download,
  Loader2,
} from 'lucide-react';

interface OcrResult {
  id: string;
  documentId: string;
  extractedText: string;
  confidence: number;
  language: string;
  createdAt: string;
  document?: { title: string; filename: string };
}

export default function DocumentOcr() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [history, setHistory] = useState<OcrResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OcrResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('fra');
  const [tab, setTab] = useState<'scan' | 'history' | 'search'>('scan');

  const languages = [
    { value: 'fra', label: 'Français' },
    { value: 'eng', label: 'Anglais' },
    { value: 'ara', label: 'Arabe' },
    { value: 'fra+eng', label: 'Français + Anglais' },
  ];

  const handleUploadAndOcr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setProcessing(true);
      // 1. Upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      formData.append('category', 'ocr');
      const uploadRes = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const docId = uploadRes.data?.id || uploadRes.data?.document?.id;

      // 2. OCR
      const ocrRes = await api.post(`/documents/${docId}/ocr`, { language: selectedLanguage });
      setOcrResult(ocrRes.data);
      toast({
        title: 'OCR terminé',
        description: `Texte extrait avec ${Math.round((ocrRes.data.confidence || 0) * 100)}% de confiance`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Erreur',
        description: "Impossible de traiter le document avec l'OCR",
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/documents/ocr/history', { params: { limit: 20 } });
      setHistory(res.data || []);
    } catch {
      toast({
        title: 'Erreur',
        description: "Impossible de charger l'historique OCR",
        variant: 'destructive',
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      const res = await api.get('/documents/ocr/search', { params: { query: searchQuery } });
      setSearchResults(res.data || []);
    } catch {
      toast({ title: 'Erreur', description: 'Erreur de recherche OCR', variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copié', description: 'Texte copié dans le presse-papier' });
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-2 border-b pb-3">
        <Button
          variant={tab === 'scan' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTab('scan')}
        >
          <ScanLine className="h-4 w-4 mr-2" /> Scanner
        </Button>
        <Button
          variant={tab === 'history' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            setTab('history');
            loadHistory();
          }}
        >
          <Clock className="h-4 w-4 mr-2" /> Historique
        </Button>
        <Button
          variant={tab === 'search' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTab('search')}
        >
          <Search className="h-4 w-4 mr-2" /> Rechercher
        </Button>
      </div>

      {tab === 'scan' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanLine className="h-5 w-5" /> Extraction de texte (OCR)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Téléversez une image ou un PDF scanné pour en extraire le texte automatiquement.
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium">Langue du document</label>
                <div className="flex gap-2">
                  {languages.map((lang) => (
                    <Button
                      key={lang.value}
                      variant={selectedLanguage === lang.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedLanguage(lang.value)}
                    >
                      {lang.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {processing ? (
                  <div className="space-y-3">
                    <Loader2 className="h-12 w-12 mx-auto text-blue-500 animate-spin" />
                    <p className="text-blue-600 font-medium">Extraction en cours...</p>
                    <p className="text-sm text-gray-500">Analyse du document avec Tesseract</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="font-medium">Glissez ou cliquez pour scanner</p>
                    <p className="text-sm text-gray-500">PDF, JPG, PNG — Max 50 Mo</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.tiff,.bmp"
                  onChange={handleUploadAndOcr}
                  disabled={processing}
                />
              </div>
            </CardContent>
          </Card>

          {/* Result */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" /> Résultat
                </CardTitle>
                {ocrResult && (
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      Confiance: {Math.round((ocrResult.confidence || 0) * 100)}%
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(ocrResult.extractedText)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {ocrResult ? (
                <div className="bg-gray-50 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">{ocrResult.extractedText}</pre>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Le texte extrait apparaîtra ici</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-4">
          {loadingHistory ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : history.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Aucun traitement OCR pour le moment</p>
              </CardContent>
            </Card>
          ) : (
            history.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.document?.title || 'Document'}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(item.createdAt).toLocaleDateString('fr-FR')} — Langue:{' '}
                        {item.language}
                      </p>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {item.extractedText}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge variant="outline">{Math.round((item.confidence || 0) * 100)}%</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setOcrResult(item);
                          setTab('scan');
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === 'search' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher dans les textes extraits..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} disabled={searching}>
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rechercher'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {searchResults.length > 0 ? (
            searchResults.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <h4 className="font-medium">{item.document?.title || 'Document'}</h4>
                  <p className="text-sm text-gray-600 mt-2">{item.extractedText}</p>
                </CardContent>
              </Card>
            ))
          ) : searchQuery && !searching ? (
            <div className="text-center py-8 text-gray-400">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun résultat pour "{searchQuery}"</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
