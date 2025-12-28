import React, { useState } from 'react';
import communicationsService from '../communications.service';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';
import {
  Sparkles,
  Wand2,
  Languages,
  CheckCircle2,
  Loader2,
  FileText,
  Lightbulb,
} from 'lucide-react';
import { ScrollArea } from '@/shared/components/ui/scroll-area';

interface AIAssistantPanelProps {
  type: 'email' | 'sms';
  prospectId?: string;
  propertyId?: string;
  onContentGenerated: (content: { subject?: string; body: string }) => void;
}

export function AIAssistantPanel({
  type,
  prospectId,
  propertyId,
  onContentGenerated,
}: AIAssistantPanelProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');
  const { toast } = useToast();

  // Generate Content
  const [generatePurpose, setGeneratePurpose] = useState<string>('follow_up');
  const [generateTone, setGenerateTone] = useState<string>('friendly');
  const [additionalContext, setAdditionalContext] = useState('');

  // Improve Text
  const [textToImprove, setTextToImprove] = useState('');
  const [selectedImprovements, setSelectedImprovements] = useState<string[]>(['grammar']);

  // Translate
  const [textToTranslate, setTextToTranslate] = useState('');
  const [targetLanguage, setTargetLanguage] = useState<'ar' | 'en' | 'fr'>('en');

  const handleGenerateContent = async () => {
    try {
      setLoading(true);

      if (type === 'email') {
        const result = await communicationsService.generateSmartEmail({
          prospectId,
          propertyId,
          purpose: generatePurpose as any,
          tone: generateTone as any,
          additionalContext: additionalContext || undefined,
        });

        onContentGenerated({
          subject: result.subject,
          body: result.body,
        });

        toast({
          title: '✨ Contenu généré !',
          description: `Email créé avec confiance ${result.confidence}%`,
        });
      } else {
        const result = await communicationsService.generateSmartSMS({
          prospectId,
          propertyId,
          purpose: generatePurpose as any,
          maxLength: 160,
          additionalContext: additionalContext || undefined,
        });

        onContentGenerated({
          body: result.body,
        });

        toast({
          title: '✨ SMS généré !',
          description: `${result.length} caractères`,
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le contenu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImproveText = async () => {
    if (!textToImprove.trim()) {
      toast({
        title: 'Attention',
        description: 'Veuillez entrer un texte à améliorer',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const result = await communicationsService.improveText(
        textToImprove,
        selectedImprovements as any,
      );

      onContentGenerated({
        body: result.improved,
      });

      toast({
        title: '✨ Texte amélioré !',
        description: `${result.changes?.length || 0} modifications appliquées`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'améliorer le texte',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!textToTranslate.trim()) {
      toast({
        title: 'Attention',
        description: 'Veuillez entrer un texte à traduire',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const result = await communicationsService.translateMessage(
        textToTranslate,
        targetLanguage,
      );

      onContentGenerated({
        body: result.translated,
      });

      toast({
        title: '✨ Texte traduit !',
        description: `Traduit en ${targetLanguage === 'ar' ? 'arabe' : targetLanguage === 'en' ? 'anglais' : 'français'}`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de traduire le texte',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleImprovement = (improvement: string) => {
    if (selectedImprovements.includes(improvement)) {
      setSelectedImprovements(selectedImprovements.filter((i) => i !== improvement));
    } else {
      setSelectedImprovements([...selectedImprovements, improvement]);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          Assistant IA
        </CardTitle>
        <CardDescription>
          Générez, améliorez et traduisez vos messages avec l'intelligence artificielle
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate">
              <Wand2 className="mr-2 h-4 w-4" />
              Générer
            </TabsTrigger>
            <TabsTrigger value="improve">
              <Lightbulb className="mr-2 h-4 w-4" />
              Améliorer
            </TabsTrigger>
            <TabsTrigger value="translate">
              <Languages className="mr-2 h-4 w-4" />
              Traduire
            </TabsTrigger>
          </TabsList>

          {/* GENERATE TAB */}
          <TabsContent value="generate" className="space-y-4">
            <div className="space-y-2">
              <Label>Objectif</Label>
              <Select value={generatePurpose} onValueChange={setGeneratePurpose}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {type === 'email' ? (
                    <>
                      <SelectItem value="follow_up">Relance</SelectItem>
                      <SelectItem value="appointment">Rendez-vous</SelectItem>
                      <SelectItem value="negotiation">Négociation</SelectItem>
                      <SelectItem value="information">Information</SelectItem>
                      <SelectItem value="custom">Personnalisé</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="appointment_reminder">Rappel RDV</SelectItem>
                      <SelectItem value="follow_up">Suivi</SelectItem>
                      <SelectItem value="confirmation">Confirmation</SelectItem>
                      <SelectItem value="custom">Personnalisé</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {type === 'email' && (
              <div className="space-y-2">
                <Label>Ton</Label>
                <Select value={generateTone} onValueChange={setGenerateTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formel</SelectItem>
                    <SelectItem value="friendly">Amical</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Contexte additionnel (optionnel)</Label>
              <Input
                placeholder="Ex: Le client a visité le bien hier..."
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
              />
            </div>

            <Button onClick={handleGenerateContent} className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Générer le contenu
                </>
              )}
            </Button>

            {prospectId && (
              <div className="p-3 bg-blue-50 rounded-lg text-sm">
                <div className="flex items-center gap-2 text-blue-900 mb-1">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Contexte CRM détecté</span>
                </div>
                <p className="text-blue-700 text-xs">
                  Le message sera personnalisé avec les données du prospect
                </p>
              </div>
            )}
          </TabsContent>

          {/* IMPROVE TAB */}
          <TabsContent value="improve" className="space-y-4">
            <div className="space-y-2">
              <Label>Texte à améliorer</Label>
              <textarea
                className="w-full min-h-[120px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Collez votre texte ici..."
                value={textToImprove}
                onChange={(e) => setTextToImprove(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Améliorations</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'grammar', label: 'Grammaire', icon: CheckCircle2 },
                  { id: 'tone', label: 'Ton', icon: Wand2 },
                  { id: 'clarity', label: 'Clarté', icon: Lightbulb },
                  { id: 'professional', label: 'Professionnel', icon: FileText },
                  { id: 'concise', label: 'Concis', icon: Sparkles },
                ].map((improvement) => {
                  const Icon = improvement.icon;
                  const isSelected = selectedImprovements.includes(improvement.id);
                  return (
                    <Badge
                      key={improvement.id}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleImprovement(improvement.id)}
                    >
                      <Icon className="mr-1 h-3 w-3" />
                      {improvement.label}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <Button onClick={handleImproveText} className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Amélioration...
                </>
              ) : (
                <>
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Améliorer le texte
                </>
              )}
            </Button>
          </TabsContent>

          {/* TRANSLATE TAB */}
          <TabsContent value="translate" className="space-y-4">
            <div className="space-y-2">
              <Label>Texte à traduire</Label>
              <textarea
                className="w-full min-h-[120px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Texte en français, anglais ou arabe..."
                value={textToTranslate}
                onChange={(e) => setTextToTranslate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Langue cible</Label>
              <Select
                value={targetLanguage}
                onValueChange={(value: any) => setTargetLanguage(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">🇫🇷 Français</SelectItem>
                  <SelectItem value="en">🇬🇧 Anglais</SelectItem>
                  <SelectItem value="ar">🇹🇳 Arabe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleTranslate} className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traduction...
                </>
              ) : (
                <>
                  <Languages className="mr-2 h-4 w-4" />
                  Traduire
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Tips */}
        <div className="mt-6 p-4 bg-purple-50 rounded-lg">
          <h4 className="text-sm font-medium text-purple-900 mb-2">💡 Astuce</h4>
          <p className="text-xs text-purple-700">
            {activeTab === 'generate' &&
              'L\'IA utilise les données CRM pour personnaliser automatiquement le message'}
            {activeTab === 'improve' &&
              'Sélectionnez plusieurs améliorations pour un résultat optimal'}
            {activeTab === 'translate' &&
              'Les traductions conservent le ton professionnel de votre message'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
