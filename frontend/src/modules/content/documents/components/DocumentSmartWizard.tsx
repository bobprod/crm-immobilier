/**
 * DocumentSmartWizard
 *
 * Workflow en 4 étapes :
 *   1. Scanner – L'agent téléverse des photos (carte d'identité, etc.) et l'OCR extrait le texte.
 *   2. Instructions – L'agent décrit en langage naturel le document voulu.
 *   3. Génération – L'IA produit le document complet.
 *   4. Résultat – Aperçu HTML + téléchargement.
 */
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { useToast } from '@/shared/components/ui/use-toast';
import { api } from '../../../../../lib/api-client';
import {
  ScanLine,
  Upload,
  Sparkles,
  FileText,
  Trash2,
  Loader2,
  CheckCircle2,
  Download,
  ArrowRight,
  ArrowLeft,
  Eye,
  Wand2,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScannedDoc {
  /** Label chosen by the agent (e.g. "Carte d'identité locataire") */
  docType: string;
  /** Raw OCR text extracted from the image */
  text: string;
  /** Preview filename */
  filename: string;
}

const DOC_TYPES = [
  { value: 'contrat_location', label: 'Contrat de Location' },
  { value: 'contrat_vente', label: 'Contrat de Vente' },
  { value: 'promesse_vente', label: 'Promesse de Vente' },
  { value: 'mandat_vente', label: 'Mandat de Vente' },
  { value: 'mandat_location', label: 'Mandat de Location (Gestion)' },
  { value: 'fiche_visite', label: 'Fiche de Visite' },
  { value: 'evaluation_bien', label: "Rapport d'Évaluation" },
  { value: 'facture_honoraires', label: "Facture d'Honoraires" },
  { value: 'etat_des_lieux', label: 'État des Lieux' },
  { value: 'quittance_loyer', label: 'Quittance de Loyer' },
  { value: 'attestation', label: 'Attestation / Certificat' },
  { value: 'courrier_officiel', label: 'Courrier Officiel' },
];

const SCAN_DOC_LABELS = [
  "Carte d'identité (locataire)",
  "Carte d'identité (propriétaire)",
  "Carte d'identité (acheteur)",
  "Carte d'identité (vendeur)",
  'Justificatif de domicile',
  'Fiche de salaire',
  "Acte de propriété",
  'Autre document',
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function DocumentSmartWizard() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [scannedDocs, setScannedDocs] = useState<ScannedDoc[]>([]);
  const [scanningIndex, setScanningIndex] = useState<number | null>(null);
  const [pendingDocType, setPendingDocType] = useState(SCAN_DOC_LABELS[0]);

  const [instruction, setInstruction] = useState('');
  const [selectedDocType, setSelectedDocType] = useState(DOC_TYPES[0].value);

  const [generating, setGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [generatedDocId, setGeneratedDocId] = useState('');

  // ── Step 1 helpers ────────────────────────────────────────────────────────

  const handleScanFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setScanningIndex(scannedDocs.length);

      // 1. Upload the image
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      const uploadRes = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const docId = uploadRes.data?.id || uploadRes.data?.document?.id;

      // 2. Run OCR
      const ocrRes = await api.post(`/documents/${docId}/ocr`, { language: 'fra+eng' });
      const extractedText: string = ocrRes.data?.text || '';

      if (!extractedText.trim()) {
        toast({
          title: 'OCR : texte vide',
          description:
            'Aucun texte détecté dans cette image. Vérifiez la qualité de la photo.',
          variant: 'destructive',
        });
        return;
      }

      setScannedDocs((prev) => [
        ...prev,
        { docType: pendingDocType, text: extractedText, filename: file.name },
      ]);

      toast({
        title: 'Document scanné',
        description: `"${pendingDocType}" ajouté — ${extractedText.length} caractères extraits.`,
      });
    } catch (err: any) {
      toast({
        title: 'Erreur de scan',
        description: err?.response?.data?.message || err.message || 'Erreur inconnue',
        variant: 'destructive',
      });
    } finally {
      setScanningIndex(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeScannedDoc = (index: number) => {
    setScannedDocs((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Step 3 : generate ─────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!instruction.trim()) {
      toast({
        title: 'Instruction manquante',
        description: 'Décrivez le document que vous souhaitez générer.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setGenerating(true);
      setStep(3);

      const payload = {
        scannedDocuments: scannedDocs.map((d) => ({ docType: d.docType, text: d.text })),
        userInstruction: instruction,
        documentType: DOC_TYPES.find((d) => d.value === selectedDocType)?.label || selectedDocType,
      };

      const res = await api.post('/documents/ai/smart-generate', payload);
      setGeneratedHtml(res.data?.response || '');
      setGeneratedDocId(res.data?.document?.id || '');
      setStep(4);
    } catch (err: any) {
      toast({
        title: 'Erreur de génération',
        description: err?.response?.data?.message || err.message || 'Erreur inconnue',
        variant: 'destructive',
      });
      setStep(2);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedDocId) return;
    try {
      const res = await api.get(`/documents/${generatedDocId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `document-${selectedDocType}-${Date.now()}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de télécharger', variant: 'destructive' });
    }
  };

  const reset = () => {
    setStep(1);
    setScannedDocs([]);
    setInstruction('');
    setSelectedDocType(DOC_TYPES[0].value);
    setGeneratedHtml('');
    setGeneratedDocId('');
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {[
          { n: 1, label: 'Scanner' },
          { n: 2, label: 'Instructions' },
          { n: 3, label: 'Génération' },
          { n: 4, label: 'Résultat' },
        ].map(({ n, label }, idx, arr) => (
          <div key={n} className="flex items-center gap-2 flex-1">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                step === n
                  ? 'bg-blue-600 text-white'
                  : step > n
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {step > n ? <CheckCircle2 className="h-4 w-4" /> : <span>{n}</span>}
              <span className="hidden sm:inline">{label}</span>
            </div>
            {idx < arr.length - 1 && (
              <div className={`flex-1 h-0.5 ${step > n ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── STEP 1: SCAN ───────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanLine className="h-5 w-5 text-blue-600" />
                Étape 1 – Scanner les documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Photographiez ou téléversez les documents d'identité ou autres pièces justificatives
                (carte d'identité, passeport, acte de propriété…). L'OCR extraira automatiquement
                les informations.
              </p>

              {/* Label selector */}
              <div className="space-y-1">
                <Label>Type du document à scanner</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={pendingDocType}
                  onChange={(e) => setPendingDocType(e.target.value)}
                >
                  {SCAN_DOC_LABELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              {/* Drop zone */}
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                onClick={() => !scanningIndex && fileInputRef.current?.click()}
              >
                {scanningIndex !== null ? (
                  <div className="space-y-2">
                    <Loader2 className="h-10 w-10 mx-auto text-blue-500 animate-spin" />
                    <p className="text-blue-600 font-medium">Extraction OCR en cours…</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-10 w-10 mx-auto text-gray-400" />
                    <p className="font-medium">Cliquez pour scanner un document</p>
                    <p className="text-sm text-gray-500">JPG, PNG, PDF — Max 50 Mo</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf,.bmp,.tiff"
                  onChange={handleScanFile}
                  disabled={scanningIndex !== null}
                />
              </div>

              {/* Scanned docs list */}
              {scannedDocs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    {scannedDocs.length} document(s) scanné(s) :
                  </p>
                  {scannedDocs.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-3"
                    >
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-800">{doc.docType}</p>
                        <p className="text-xs text-gray-500 truncate">{doc.filename}</p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{doc.text}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeScannedDoc(idx)}
                        className="shrink-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => setStep(2)}>
              Continuer <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2: INSTRUCTIONS ────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-purple-600" />
                Étape 2 – Décrivez le document à générer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Dites à l'IA en langage naturel quel document vous souhaitez créer, avec toutes les
                informations complémentaires (dates, montants, durées…).
              </p>

              {/* Scanned docs recap */}
              {scannedDocs.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-800 mb-1">
                    Documents scannés disponibles :
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {scannedDocs.map((d, i) => (
                      <Badge key={i} variant="secondary">
                        {d.docType}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Document type selector */}
              <div className="space-y-1">
                <Label>Type de document à générer</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                >
                  {DOC_TYPES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Natural language instruction */}
              <div className="space-y-1">
                <Label>Votre instruction</Label>
                <Textarea
                  placeholder={`Ex : Fais-moi un contrat de location du 01/01/2025 au 31/12/2025. Loyer mensuel 800€ charges comprises. Le locataire est la personne sur la carte d'identité scannée, le propriétaire est Mohamed Amine Benali au 15 rue des Fleurs, Alger.`}
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">
                  L'IA utilisera les informations des documents scannés + votre instruction pour
                  générer le document.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Retour
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!instruction.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="h-4 w-4 mr-2" /> Générer le document
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: GENERATING ──────────────────────────────────────────── */}
      {step === 3 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-16 w-16 text-purple-600 animate-spin" />
            <p className="text-xl font-semibold text-gray-800">Génération en cours…</p>
            <p className="text-sm text-gray-500 text-center max-w-sm">
              L'IA analyse les documents scannés et rédige votre document immobilier. Cela peut
              prendre quelques secondes.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── STEP 4: RESULT ──────────────────────────────────────────────── */}
      {step === 4 && generatedHtml && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Document généré avec succès
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" /> Télécharger
                  </Button>
                  <Button size="sm" variant="outline" onClick={reset}>
                    Nouveau document
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <Eye className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Aperçu du document généré :</span>
              </div>
              <div
                className="border rounded-lg p-6 bg-white max-h-[600px] overflow-y-auto prose max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: generatedHtml }}
              />
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Modifier les instructions
            </Button>
            <Button onClick={reset}>
              <FileText className="h-4 w-4 mr-2" /> Nouveau document
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
