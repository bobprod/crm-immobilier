import React, { useState, useEffect } from 'react';
import Layout from '../../../src/modules/core/layout/components/Layout';
import communicationsService, { Template, CreateTemplateDto } from '@/modules/communications/communications.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/components/ui/use-toast';
import {
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Edit2,
  Trash2,
  FileText,
  Search,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<CreateTemplateDto>({
    name: '',
    type: 'email',
    subject: '',
    body: '',
    variables: [],
  });

  useEffect(() => {
    loadTemplates();
  }, [filterType]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await communicationsService.getTemplates(
        filterType === 'all' ? undefined : filterType
      );
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

  const handleOpenModal = (template?: Template) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        type: template.type,
        subject: template.subject || '',
        body: template.body,
        variables: template.variables || [],
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        type: 'email',
        subject: '',
        body: '',
        variables: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await communicationsService.createTemplate(formData);
      toast({
        title: 'Succès',
        description: editingTemplate
          ? 'Template mis à jour avec succès'
          : 'Template créé avec succès',
      });
      handleCloseModal();
      loadTemplates();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le template',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'bg-blue-100 text-blue-800';
      case 'sms':
        return 'bg-green-100 text-green-800';
      case 'whatsapp':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const extractVariables = (text: string): string[] => {
    const regex = /\{([^}]+)\}/g;
    const matches = text.match(regex);
    return matches ? matches.map((m) => m.slice(1, -1)) : [];
  };

  const handleBodyChange = (value: string) => {
    const vars = extractVariables(value);
    setFormData({ ...formData, body: value, variables: vars });
  };

  const handleSubjectChange = (value: string) => {
    const bodyVars = extractVariables(formData.body);
    const subjectVars = extractVariables(value);
    const allVars = [...new Set([...bodyVars, ...subjectVars])];
    setFormData({ ...formData, subject: value, variables: allVars });
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-600" />
            Templates de Communications
          </h1>
          <p className="text-gray-600 mt-1">
            Créez et gérez vos templates réutilisables pour emails, SMS et WhatsApp
          </p>
        </div>

        {/* Filters & Actions */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-2 flex-1 w-full md:w-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher un template..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => handleOpenModal()}>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Templates List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">
                {searchQuery
                  ? 'Aucun template trouvé pour cette recherche'
                  : 'Aucun template créé. Commencez par en créer un !'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getTypeColor(template.type)}>
                          <span className="flex items-center gap-1">
                            {getTypeIcon(template.type)}
                            <span className="capitalize">{template.type}</span>
                          </span>
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {template.subject && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                          {template.subject}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                    {template.body}
                  </p>
                  {template.variables && template.variables.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Variables:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((variable, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {'{' + variable + '}'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenModal(template)}
                      className="flex-1"
                    >
                      <Edit2 className="mr-2 h-3 w-3" />
                      Modifier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal Create/Edit */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Modifier le template' : 'Nouveau template'}
              </DialogTitle>
              <DialogDescription>
                Créez un template réutilisable avec des variables pour la personnalisation
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom du template</Label>
                <Input
                  placeholder="Ex: Email de bienvenue"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'email' && (
                <div className="space-y-2">
                  <Label>Sujet</Label>
                  <Input
                    placeholder="Ex: Bienvenue chez {agencyName}"
                    value={formData.subject}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Utilisez {variable} pour les champs dynamiques&#10;Ex: Bonjour {firstName}, bienvenue chez {agencyName}!"
                  value={formData.body}
                  onChange={(e) => handleBodyChange(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  Utilisez des accolades pour définir des variables: {'{firstName}'}, {'{lastName}'},
                  etc.
                </p>
              </div>

              {formData.variables && formData.variables.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Variables détectées:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {formData.variables.map((variable, idx) => (
                      <Badge key={idx} variant="outline" className="bg-white">
                        {'{' + variable + '}'}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseModal}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving || !formData.name || !formData.body}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
