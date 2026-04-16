import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/components/ui/use-toast';
import { api } from '../../../../../lib/api-client';
import { Plus, FileText, Trash2, Edit3, Copy, Eye, Loader2, LayoutTemplate } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description?: string;
  category?: string;
  content: string;
  variables?: string[];
  createdAt: string;
}

export default function DocumentTemplates() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    content: '',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documents/templates/list');
      setTemplates(res.data || []);
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les modèles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({ name: '', description: '', category: '', content: '' });
  };

  const handleEdit = (template: Template) => {
    setEditing(template);
    setCreating(false);
    setForm({
      name: template.name,
      description: template.description || '',
      category: template.category || '',
      content: template.content,
    });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.content.trim()) {
      toast({ title: 'Erreur', description: 'Nom et contenu requis', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      if (editing) {
        await api.put(`/documents/templates/${editing.id}`, form);
        toast({ title: 'Succès', description: 'Modèle mis à jour' });
      } else {
        await api.post('/documents/templates', form);
        toast({ title: 'Succès', description: 'Modèle créé' });
      }
      setEditing(null);
      setCreating(false);
      loadTemplates();
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce modèle ?')) return;
    try {
      await api.delete(`/documents/templates/${id}`);
      toast({ title: 'Modèle supprimé' });
      loadTemplates();
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de supprimer', variant: 'destructive' });
    }
  };

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))];
  };

  if (creating || editing) {
    const variables = extractVariables(form.content);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => {
              setCreating(false);
              setEditing(null);
            }}
          >
            ← Retour
          </Button>
          <h2 className="text-xl font-bold">{editing ? 'Modifier le modèle' : 'Nouveau modèle'}</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Éditeur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Nom du modèle *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contrat de vente standard"
                />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Modèle de contrat de vente..."
                />
              </div>
              <div className="space-y-1">
                <Label>Catégorie</Label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Aucune</option>
                  <option value="vente">Vente</option>
                  <option value="location">Location</option>
                  <option value="finance">Finance</option>
                  <option value="visite">Visite</option>
                  <option value="estimation">Estimation</option>
                  <option value="mandat">Mandat</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Contenu du modèle</Label>
                <p className="text-xs text-gray-500">
                  Utilisez {'{{variable}}'} pour les champs dynamiques
                </p>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={14}
                  className="font-mono text-sm"
                  placeholder="CONTRAT DE VENTE&#10;&#10;Entre {{vendeur}} et {{acquereur}}..."
                />
              </div>
              {variables.length > 0 && (
                <div>
                  <Label className="text-xs">Variables détectées:</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {variables.map((v) => (
                      <Badge key={v} variant="secondary" className="text-xs">{`{{${v}}}`}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {editing ? 'Mettre à jour' : 'Créer le modèle'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" /> Aperçu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-6 max-h-[500px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm">
                  {form.content || 'Le contenu apparaîtra ici...'}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Modèles de documents</h2>
          <p className="text-sm text-gray-600">Créez et gérez vos modèles réutilisables</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" /> Nouveau modèle
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <LayoutTemplate className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">Aucun modèle pour le moment</p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" /> Créer votre premier modèle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <Card key={tpl.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{tpl.name}</h4>
                    {tpl.description && (
                      <p className="text-sm text-gray-500 mt-1">{tpl.description}</p>
                    )}
                  </div>
                  {tpl.category && <Badge variant="outline">{tpl.category}</Badge>}
                </div>
                <p className="text-xs text-gray-400">
                  Créé le {new Date(tpl.createdAt).toLocaleDateString('fr-FR')}
                  {tpl.variables &&
                    tpl.variables.length > 0 &&
                    ` — ${tpl.variables.length} variable(s)`}
                </p>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(tpl)}>
                    <Edit3 className="h-3 w-3 mr-1" /> Modifier
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPreview(tpl)}>
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(tpl.id)}>
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview modal inline */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setPreview(null)}
        >
          <Card
            className="max-w-2xl w-full max-h-[80vh] overflow-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{preview.name}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setPreview(null)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                {preview.content}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
