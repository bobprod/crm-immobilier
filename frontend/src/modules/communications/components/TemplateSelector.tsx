import React, { useState, useEffect } from 'react';
import communicationsService, { Template } from '../communications.service';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { FileText, Loader2, Search, Mail, MessageSquare, Phone } from 'lucide-react';
import { ScrollArea } from '@/shared/components/ui/scroll-area';

interface TemplateSelectorProps {
  type: 'email' | 'sms' | 'whatsapp';
  onSelect: (data: { subject?: string; body: string }) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function TemplateSelector({ type, onSelect, isOpen, onClose }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, type]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await communicationsService.getTemplates(type);
      setTemplates(data);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    // Initialize variable values
    const initialValues: Record<string, string> = {};
    template.variables?.forEach((variable) => {
      initialValues[variable] = '';
    });
    setVariableValues(initialValues);
  };

  const replaceVariables = (text: string, values: Record<string, string>): string => {
    let result = text;
    Object.entries(values).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, value || `{${key}}`);
    });
    return result;
  };

  const handleApply = () => {
    if (!selectedTemplate) return;

    const subject = selectedTemplate.subject
      ? replaceVariables(selectedTemplate.subject, variableValues)
      : undefined;
    const body = replaceVariables(selectedTemplate.content, variableValues);

    onSelect({ subject, body });
    handleClose();
  };

  const handleClose = () => {
    setSelectedTemplate(null);
    setVariableValues({});
    setSearchQuery('');
    onClose();
  };

  const getTypeIcon = (templateType: string) => {
    switch (templateType) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'whatsapp':
        return <Phone className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Choisir un template</DialogTitle>
          <DialogDescription>
            Sélectionnez un template et personnalisez les variables
          </DialogDescription>
        </DialogHeader>

        {!selectedTemplate ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un template..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[400px] pr-4">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Aucun template disponible</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(template.type)}
                          <h4 className="font-medium">{template.name}</h4>
                        </div>
                        {template.variables && template.variables.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {template.variables.length} variable(s)
                          </Badge>
                        )}
                      </div>
                      {template.subject && (
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Sujet:</strong> {template.subject}
                        </p>
                      )}
                      <p className="text-sm text-gray-700 line-clamp-2">{template.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{selectedTemplate.name}</h3>
                <p className="text-sm text-gray-500">
                  Remplissez les variables pour personnaliser le template
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)}>
                Changer
              </Button>
            </div>

            {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
              <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
                <p className="text-sm font-medium">Variables du template:</p>
                <div className="grid grid-cols-2 gap-3">
                  {selectedTemplate.variables.map((variable) => (
                    <div key={variable} className="space-y-1">
                      <Label className="text-xs">{variable}</Label>
                      <Input
                        placeholder={`Valeur pour {${variable}}`}
                        value={variableValues[variable] || ''}
                        onChange={(e) =>
                          setVariableValues({ ...variableValues, [variable]: e.target.value })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Aperçu:</p>
              {selectedTemplate.subject && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Sujet:</p>
                  <p className="text-sm font-medium">
                    {replaceVariables(selectedTemplate.subject, variableValues)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 mb-1">Message:</p>
                <div className="text-sm whitespace-pre-wrap bg-white p-3 rounded border">
                  {replaceVariables(selectedTemplate.content, variableValues)}
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          {selectedTemplate && (
            <Button onClick={handleApply}>
              Utiliser ce template
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
