import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/components/ui/use-toast';
import { api } from '../../../../../lib/api-client';
import {
  FileText,
  Sparkles,
  Download,
  Loader2,
  FileSignature,
  Receipt,
  Home,
  ClipboardList,
  BarChart3,
  HandIcon,
  KeyRound,
  ScrollText,
  Globe,
} from 'lucide-react';

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇹🇳' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
];

interface DocumentType {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  fields: FieldDef[];
}

interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

const commonFields: FieldDef[] = [
  {
    name: 'agencyName',
    label: "Nom de l'agence",
    type: 'text',
    placeholder: 'Agence Immobilière XYZ',
  },
  { name: 'agentName', label: "Nom de l'agent", type: 'text', placeholder: 'Jean Dupont' },
  { name: 'date', label: 'Date', type: 'date', required: true },
];

const propertyFields: FieldDef[] = [
  {
    name: 'propertyTitle',
    label: 'Titre du bien',
    type: 'text',
    placeholder: 'Appartement T3 - Paris 15e',
    required: true,
  },
  {
    name: 'propertyAddress',
    label: 'Adresse du bien',
    type: 'text',
    placeholder: '12 rue de la Paix, 75015 Paris',
    required: true,
  },
  {
    name: 'propertyType',
    label: 'Type de bien',
    type: 'select',
    options: [
      { value: 'apartment', label: 'Appartement' },
      { value: 'house', label: 'Maison' },
      { value: 'land', label: 'Terrain' },
      { value: 'commercial', label: 'Local commercial' },
      { value: 'parking', label: 'Parking / Garage' },
    ],
  },
  { name: 'surface', label: 'Surface (m²)', type: 'number', placeholder: '75' },
  { name: 'rooms', label: 'Nombre de pièces', type: 'number', placeholder: '3' },
];

const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 'promesse_vente',
    label: 'Promesse de Vente',
    description: 'Engagement de vente entre les parties avant la signature définitive',
    icon: <HandIcon className="h-6 w-6" />,
    category: 'Vente',
    fields: [
      ...commonFields,
      ...propertyFields,
      { name: 'sellerName', label: 'Nom du vendeur', type: 'text', required: true },
      { name: 'buyerName', label: "Nom de l'acquéreur", type: 'text', required: true },
      { name: 'price', label: 'Prix de vente (€)', type: 'number', required: true },
      { name: 'depositAmount', label: "Montant de l'acompte (€)", type: 'number' },
      {
        name: 'validityDays',
        label: 'Durée de validité (jours)',
        type: 'number',
        placeholder: '30',
      },
      {
        name: 'conditions',
        label: 'Conditions suspensives',
        type: 'textarea',
        placeholder: 'Obtention du prêt bancaire...',
      },
    ],
  },
  {
    id: 'contrat_vente',
    label: 'Contrat de Vente',
    description: 'Acte de vente définitif entre vendeur et acquéreur',
    icon: <FileSignature className="h-6 w-6" />,
    category: 'Vente',
    fields: [
      ...commonFields,
      ...propertyFields,
      { name: 'sellerName', label: 'Nom du vendeur', type: 'text', required: true },
      { name: 'buyerName', label: "Nom de l'acquéreur", type: 'text', required: true },
      { name: 'price', label: 'Prix de vente (€)', type: 'number', required: true },
      { name: 'agencyCommission', label: 'Commission agence (%)', type: 'number' },
      { name: 'notaryName', label: 'Nom du notaire', type: 'text' },
      { name: 'conditions', label: 'Conditions particulières', type: 'textarea' },
    ],
  },
  {
    id: 'contrat_location',
    label: 'Contrat de Location',
    description: 'Bail de location entre propriétaire et locataire',
    icon: <KeyRound className="h-6 w-6" />,
    category: 'Location',
    fields: [
      ...commonFields,
      ...propertyFields,
      { name: 'ownerName', label: 'Nom du propriétaire', type: 'text', required: true },
      { name: 'tenantName', label: 'Nom du locataire', type: 'text', required: true },
      { name: 'monthlyRent', label: 'Loyer mensuel (€)', type: 'number', required: true },
      { name: 'charges', label: 'Charges mensuelles (€)', type: 'number' },
      { name: 'deposit', label: 'Dépôt de garantie (€)', type: 'number' },
      { name: 'startDate', label: 'Date de début', type: 'date', required: true },
      { name: 'duration', label: 'Durée (mois)', type: 'number', placeholder: '36' },
      {
        name: 'furnished',
        label: 'Meublé',
        type: 'select',
        options: [
          { value: 'no', label: 'Non meublé' },
          { value: 'yes', label: 'Meublé' },
        ],
      },
    ],
  },
  {
    id: 'facture',
    label: 'Facture',
    description: 'Facture pour commission, honoraires ou services immobiliers',
    icon: <Receipt className="h-6 w-6" />,
    category: 'Finance',
    fields: [
      ...commonFields,
      {
        name: 'invoiceNumber',
        label: 'Numéro de facture',
        type: 'text',
        placeholder: 'FAC-2026-001',
        required: true,
      },
      { name: 'clientName', label: 'Nom du client', type: 'text', required: true },
      { name: 'clientAddress', label: 'Adresse du client', type: 'text' },
      {
        name: 'description',
        label: 'Description de la prestation',
        type: 'textarea',
        required: true,
        placeholder: 'Commission sur vente du bien...',
      },
      { name: 'amountHT', label: 'Montant HT (€)', type: 'number', required: true },
      { name: 'tvaRate', label: 'Taux TVA (%)', type: 'number', placeholder: '20' },
      {
        name: 'paymentTerms',
        label: 'Conditions de paiement',
        type: 'select',
        options: [
          { value: 'immediate', label: 'Paiement immédiat' },
          { value: '30days', label: '30 jours' },
          { value: '60days', label: '60 jours' },
        ],
      },
      { name: 'propertyRef', label: 'Référence du bien (optionnel)', type: 'text' },
    ],
  },
  {
    id: 'fiche_visite',
    label: 'Fiche de Visite',
    description: "Compte-rendu détaillé après la visite d'un bien immobilier",
    icon: <ClipboardList className="h-6 w-6" />,
    category: 'Visite',
    fields: [
      ...commonFields,
      ...propertyFields,
      { name: 'visitorName', label: 'Nom du visiteur', type: 'text', required: true },
      { name: 'visitDate', label: 'Date de visite', type: 'date', required: true },
      { name: 'price', label: 'Prix affiché (€)', type: 'number' },
      {
        name: 'generalCondition',
        label: 'État général',
        type: 'select',
        options: [
          { value: 'excellent', label: 'Excellent' },
          { value: 'good', label: 'Bon' },
          { value: 'average', label: 'Moyen' },
          { value: 'poor', label: 'Mauvais' },
          { value: 'renovation', label: 'À rénover' },
        ],
      },
      {
        name: 'strengths',
        label: 'Points forts',
        type: 'textarea',
        placeholder: 'Luminosité, emplacement, vue...',
      },
      {
        name: 'weaknesses',
        label: 'Points faibles',
        type: 'textarea',
        placeholder: 'Bruit, travaux à prévoir...',
      },
      { name: 'visitorFeedback', label: 'Commentaire du visiteur', type: 'textarea' },
      {
        name: 'interestLevel',
        label: "Niveau d'intérêt",
        type: 'select',
        options: [
          { value: 'very_interested', label: 'Très intéressé' },
          { value: 'interested', label: 'Intéressé' },
          { value: 'hesitant', label: 'Hésitant' },
          { value: 'not_interested', label: 'Pas intéressé' },
        ],
      },
      {
        name: 'nextSteps',
        label: 'Prochaines étapes',
        type: 'textarea',
        placeholder: 'Deuxième visite, offre...',
      },
    ],
  },
  {
    id: 'evaluation_bien',
    label: 'Évaluation de Bien',
    description: "Rapport d'estimation de la valeur d'un bien immobilier",
    icon: <BarChart3 className="h-6 w-6" />,
    category: 'Estimation',
    fields: [
      ...commonFields,
      ...propertyFields,
      { name: 'ownerName', label: 'Nom du propriétaire', type: 'text', required: true },
      { name: 'constructionYear', label: 'Année de construction', type: 'number' },
      { name: 'floors', label: "Étage / Nombre d'étages", type: 'text' },
      {
        name: 'parking',
        label: 'Parking',
        type: 'select',
        options: [
          { value: 'none', label: 'Aucun' },
          { value: 'outdoor', label: 'Extérieur' },
          { value: 'indoor', label: 'Couvert / Garage' },
        ],
      },
      { name: 'heating', label: 'Type de chauffage', type: 'text', placeholder: 'Gaz collectif' },
      {
        name: 'dpe',
        label: 'Classe DPE',
        type: 'select',
        options: [
          { value: 'A', label: 'A' },
          { value: 'B', label: 'B' },
          { value: 'C', label: 'C' },
          { value: 'D', label: 'D' },
          { value: 'E', label: 'E' },
          { value: 'F', label: 'F' },
          { value: 'G', label: 'G' },
        ],
      },
      {
        name: 'generalCondition',
        label: 'État général',
        type: 'select',
        options: [
          { value: 'excellent', label: 'Excellent' },
          { value: 'good', label: 'Bon' },
          { value: 'average', label: 'Moyen' },
          { value: 'renovation', label: 'À rénover' },
        ],
      },
      { name: 'estimatedValue', label: 'Valeur estimée (€)', type: 'number', required: true },
      { name: 'pricePerSqm', label: 'Prix au m² zone (€)', type: 'number' },
      {
        name: 'comparables',
        label: 'Biens comparables vendus récemment',
        type: 'textarea',
        placeholder: 'T3 72m² vendu 285 000€ au 5 rue...',
      },
      { name: 'strengths', label: 'Points de valorisation', type: 'textarea' },
      { name: 'weaknesses', label: 'Points de dévalorisation', type: 'textarea' },
      {
        name: 'methodology',
        label: "Méthode d'estimation",
        type: 'select',
        options: [
          { value: 'comparison', label: 'Par comparaison' },
          { value: 'income', label: 'Par capitalisation des revenus' },
          { value: 'cost', label: 'Par le coût de remplacement' },
          { value: 'mixed', label: 'Méthode mixte' },
        ],
      },
    ],
  },
  {
    id: 'mandat_vente',
    label: 'Mandat de Vente',
    description: "Mandat confié à l'agence pour la vente d'un bien",
    icon: <ScrollText className="h-6 w-6" />,
    category: 'Mandat',
    fields: [
      ...commonFields,
      ...propertyFields,
      { name: 'ownerName', label: 'Nom du mandant (propriétaire)', type: 'text', required: true },
      {
        name: 'mandateType',
        label: 'Type de mandat',
        type: 'select',
        required: true,
        options: [
          { value: 'exclusive', label: 'Exclusif' },
          { value: 'semi_exclusive', label: 'Semi-exclusif' },
          { value: 'simple', label: 'Simple' },
        ],
      },
      { name: 'price', label: 'Prix de vente souhaité (€)', type: 'number', required: true },
      { name: 'commissionRate', label: 'Commission (%)', type: 'number', required: true },
      { name: 'duration', label: 'Durée du mandat (mois)', type: 'number', placeholder: '3' },
      { name: 'conditions', label: 'Conditions particulières', type: 'textarea' },
    ],
  },
];

export default function DocumentGenerator() {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedFilePath, setGeneratedFilePath] = useState('');
  const [language, setLanguage] = useState('fr');

  const categories = [...new Set(DOCUMENT_TYPES.map((t) => t.category))];

  const handleSelectType = (docType: DocumentType) => {
    setSelectedType(docType);
    setFormData({ date: new Date().toISOString().split('T')[0] });
    setGeneratedContent('');
    setGeneratedFilePath('');
  };

  const handleFieldChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    if (!selectedType) return;

    // Vérifier les champs requis
    const missing = selectedType.fields.filter((f) => f.required && !formData[f.name]);
    if (missing.length > 0) {
      toast({
        title: 'Champs manquants',
        description: `Veuillez remplir: ${missing.map((f) => f.label).join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setGenerating(true);

      // Build a detailed prompt from form data
      const fieldDescriptions = selectedType.fields
        .filter((f) => formData[f.name])
        .map((f) => `${f.label}: ${formData[f.name]}`)
        .join('\n');

      const langName = LANGUAGES.find((l) => l.code === language)?.label || 'Français';
      const prompt = `Génère un document immobilier professionnel de type "${selectedType.label}" (${selectedType.description}) en ${langName}.\n\nInformations fournies:\n${fieldDescriptions}\n\nGénère un document complet, structuré et prêt à l'emploi avec un formatage HTML professionnel. Rédige entièrement en ${langName}.`;

      const response = await api.post('/documents/ai/generate', {
        prompt,
        documentType: selectedType.id,
        saveAsDocument: true,
      });

      if (response.data?.response || response.data?.content) {
        setGeneratedContent(response.data.response || response.data.content);
      }
      if (response.data?.document?.id || response.data?.id) {
        setGeneratedFilePath(response.data.document?.id || response.data.id);
      }

      toast({ title: 'Document généré', description: `${selectedType.label} créé avec succès` });
    } catch (err) {
      console.error(err);
      // Fallback: générer un aperçu local
      const preview = generateLocalPreview(selectedType, formData);
      setGeneratedContent(preview);
      toast({
        title: 'Aperçu généré',
        description: 'API indisponible — aperçu généré localement',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (generatedFilePath) {
      try {
        const response = await api.get(`/documents/${generatedFilePath}/download`, {
          responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedType?.id || 'document'}_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      } catch {
        /* fallback to text */
      }
    }
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedType?.id || 'document'}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (!selectedType) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            Choisissez un type de document
          </h2>
          <p className="text-gray-500 mt-1">
            Sélectionnez le modèle de document immobilier à générer avec l'IA
          </p>
        </div>

        {categories.map((cat) => (
          <div key={cat}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <div className="h-px flex-1 bg-gray-100" />
              {cat}
              <div className="h-px flex-1 bg-gray-100" />
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
              {DOCUMENT_TYPES.filter((t) => t.category === cat).map((docType) => (
                <Card
                  key={docType.id}
                  className="cursor-pointer hover:shadow-lg hover:border-blue-300 hover:-translate-y-0.5 transition-all group"
                  onClick={() => handleSelectType(docType)}
                >
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-100 transition-colors shrink-0">
                        {docType.icon}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm">{docType.label}</h4>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                          {docType.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back + Title */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setSelectedType(null)}>
          ← Retour
        </Button>
        <div className="flex items-center gap-2">
          {selectedType.icon}
          <h2 className="text-xl font-bold">{selectedType.label}</h2>
        </div>
        <Badge variant="outline">{selectedType.category}</Badge>

        <div className="ml-auto flex items-center gap-2">
          <Globe className="h-4 w-4 text-gray-400" />
          <div className="flex gap-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                title={lang.label}
                className={`px-2.5 py-1.5 rounded-md text-sm border transition-all ${
                  language === lang.code
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                {lang.flag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Informations du document</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {selectedType.fields.map((field) => (
                <div key={field.name} className="space-y-1">
                  <Label htmlFor={field.name}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {field.type === 'textarea' ? (
                    <Textarea
                      id={field.name}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      rows={3}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      id={field.name}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      value={formData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    >
                      <option value="">Sélectionner...</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id={field.name}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    />
                  )}
                </div>
              ))}

              <Button onClick={handleGenerate} disabled={generating} className="w-full mt-4">
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" /> Générer le document
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Aperçu
              </CardTitle>
              {generatedContent && (
                <Button size="sm" variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" /> Télécharger
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {generatedContent ? (
              <div className="bg-white border rounded-lg p-6 max-h-[600px] overflow-y-auto">
                {generatedContent.includes('<') ? (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: generatedContent }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-sm">Remplissez le formulaire et cliquez sur "Générer"</p>
                <p className="text-xs mt-1 text-gray-300">
                  Le document sera créé par intelligence artificielle
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function generateLocalPreview(docType: DocumentType, data: Record<string, string>): string {
  const date = data.date
    ? new Date(data.date).toLocaleDateString('fr-FR')
    : new Date().toLocaleDateString('fr-FR');
  const lines: string[] = [];

  lines.push(`${'='.repeat(60)}`);
  lines.push(`  ${docType.label.toUpperCase()}`);
  lines.push(`${'='.repeat(60)}`);
  lines.push(`Date: ${date}`);
  if (data.agencyName) lines.push(`Agence: ${data.agencyName}`);
  if (data.agentName) lines.push(`Agent: ${data.agentName}`);
  lines.push('');

  switch (docType.id) {
    case 'facture':
      lines.push(`FACTURE N° ${data.invoiceNumber || 'XXX'}`);
      lines.push(`Client: ${data.clientName || ''}`);
      if (data.clientAddress) lines.push(`Adresse: ${data.clientAddress}`);
      lines.push('');
      lines.push(`Description: ${data.description || ''}`);
      lines.push(`Montant HT: ${Number(data.amountHT || 0).toLocaleString('fr-FR')} €`);
      const tva = Number(data.tvaRate || 20);
      const ht = Number(data.amountHT || 0);
      lines.push(`TVA (${tva}%): ${((ht * tva) / 100).toLocaleString('fr-FR')} €`);
      lines.push(`TOTAL TTC: ${(ht * (1 + tva / 100)).toLocaleString('fr-FR')} €`);
      break;

    case 'promesse_vente':
      lines.push('ENTRE LES SOUSSIGNÉS:');
      lines.push(`  Vendeur: ${data.sellerName || ''}`);
      lines.push(`  Acquéreur: ${data.buyerName || ''}`);
      lines.push('');
      lines.push('OBJET:');
      lines.push(`  Bien: ${data.propertyTitle || ''}`);
      lines.push(`  Adresse: ${data.propertyAddress || ''}`);
      lines.push(`  Prix: ${Number(data.price || 0).toLocaleString('fr-FR')} €`);
      if (data.depositAmount)
        lines.push(`  Acompte: ${Number(data.depositAmount).toLocaleString('fr-FR')} €`);
      if (data.conditions) {
        lines.push('');
        lines.push(`CONDITIONS SUSPENSIVES:`);
        lines.push(`  ${data.conditions}`);
      }
      break;

    case 'contrat_vente':
      lines.push('ACTE DE VENTE');
      lines.push(`  Vendeur: ${data.sellerName || ''}`);
      lines.push(`  Acquéreur: ${data.buyerName || ''}`);
      lines.push(`  Bien: ${data.propertyTitle || ''} — ${data.propertyAddress || ''}`);
      lines.push(`  Prix: ${Number(data.price || 0).toLocaleString('fr-FR')} €`);
      break;

    case 'contrat_location':
      lines.push('BAIL DE LOCATION');
      lines.push(`  Propriétaire: ${data.ownerName || ''}`);
      lines.push(`  Locataire: ${data.tenantName || ''}`);
      lines.push(`  Bien: ${data.propertyTitle || ''} — ${data.propertyAddress || ''}`);
      lines.push(`  Loyer: ${Number(data.monthlyRent || 0).toLocaleString('fr-FR')} €/mois`);
      if (data.charges)
        lines.push(`  Charges: ${Number(data.charges).toLocaleString('fr-FR')} €/mois`);
      if (data.deposit)
        lines.push(`  Dépôt de garantie: ${Number(data.deposit).toLocaleString('fr-FR')} €`);
      break;

    case 'fiche_visite':
      lines.push(`FICHE DE VISITE — ${data.propertyTitle || ''}`);
      lines.push(`  Adresse: ${data.propertyAddress || ''}`);
      lines.push(`  Visiteur: ${data.visitorName || ''}`);
      lines.push(`  Date de visite: ${data.visitDate || ''}`);
      if (data.price) lines.push(`  Prix: ${Number(data.price).toLocaleString('fr-FR')} €`);
      if (data.generalCondition) lines.push(`  État: ${data.generalCondition}`);
      if (data.strengths) {
        lines.push('');
        lines.push(`POINTS FORTS: ${data.strengths}`);
      }
      if (data.weaknesses) {
        lines.push(`POINTS FAIBLES: ${data.weaknesses}`);
      }
      if (data.visitorFeedback) {
        lines.push('');
        lines.push(`COMMENTAIRE: ${data.visitorFeedback}`);
      }
      break;

    case 'evaluation_bien':
      lines.push(`RAPPORT D'ÉVALUATION — ${data.propertyTitle || ''}`);
      lines.push(`  Adresse: ${data.propertyAddress || ''}`);
      lines.push(`  Propriétaire: ${data.ownerName || ''}`);
      lines.push(`  Surface: ${data.surface || '?'} m² — ${data.rooms || '?'} pièces`);
      if (data.constructionYear) lines.push(`  Année de construction: ${data.constructionYear}`);
      if (data.dpe) lines.push(`  DPE: ${data.dpe}`);
      lines.push('');
      lines.push(`VALEUR ESTIMÉE: ${Number(data.estimatedValue || 0).toLocaleString('fr-FR')} €`);
      if (data.pricePerSqm)
        lines.push(`  Prix/m² zone: ${Number(data.pricePerSqm).toLocaleString('fr-FR')} €`);
      if (data.methodology) lines.push(`  Méthode: ${data.methodology}`);
      break;

    default:
      docType.fields.forEach((f) => {
        if (data[f.name]) lines.push(`${f.label}: ${data[f.name]}`);
      });
  }

  lines.push('');
  lines.push('-'.repeat(60));
  lines.push('Signatures:');
  lines.push('');
  lines.push('  _____________________     _____________________');
  lines.push(`  ${data.agentName || 'Agent'}                    Client`);
  lines.push('');
  lines.push(`Document généré le ${date}`);

  return lines.join('\n');
}
