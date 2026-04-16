import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/components/ui/use-toast';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { api } from '../../../../../lib/api-client';
import {
  Plus,
  FileText,
  Trash2,
  Edit3,
  Eye,
  Loader2,
  LayoutTemplate,
  GripVertical,
  Wand2,
  Type,
  AlignLeft,
  FileSignature,
  PenLine,
  Hash,
  ChevronDown,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface TemplateBlock {
  id: string;
  type: 'header' | 'paragraph' | 'clause' | 'signature' | 'variable';
  content: string;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  category?: string;
  content: string;
  variables?: string[];
  createdAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const BLOCK_TYPE_ICONS = {
  header: Type,
  paragraph: AlignLeft,
  clause: FileSignature,
  signature: PenLine,
  variable: Hash,
} as const;

const CONTENT_LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇹🇳' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _blockCounter = 0;
const newBlockId = () => `blk-${++_blockCounter}-${Date.now()}`;

const parseContentToBlocks = (content: string): TemplateBlock[] => {
  if (!content.trim()) return [{ id: newBlockId(), type: 'paragraph', content: '' }];
  return content
    .split('\n\n')
    .filter((s) => s.trim())
    .map((section) => ({ id: newBlockId(), type: 'paragraph' as const, content: section }));
};

const blocksToContent = (blocks: TemplateBlock[]): string =>
  blocks.map((b) => b.content).join('\n\n');

const extractVariables = (content: string): string[] => {
  const matches = content.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))];
};

// ─── SortableBlock ────────────────────────────────────────────────────────────

interface SortableBlockProps {
  block: TemplateBlock;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onAiGenerate: (id: string, prompt: string, blockType: string) => Promise<void>;
  isGeneratingId: string | null;
  templateName: string;
  contentLanguage: string;
  blockLabels: Record<string, string>;
  blockPlaceholders: Record<string, string>;
  tAi: {
    generate: string;
    generating: string;
    promptLabel: string;
    promptPlaceholder: string;
    genBtn: string;
    cancel: string;
  };
}

function SortableBlock({
  block,
  onUpdate,
  onDelete,
  onAiGenerate,
  isGeneratingId,
  templateName,
  contentLanguage,
  blockLabels,
  blockPlaceholders,
  tAi,
}: SortableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const IconComp = BLOCK_TYPE_ICONS[block.type] ?? AlignLeft;
  const isGenerating = isGeneratingId === block.id;
  const placeholder = blockPlaceholders[block.type] ?? '';
  const typeLabel = blockLabels[block.type] ?? block.type;

  const handleAiClick = () => {
    setShowAiPanel((v) => !v);
    setAiPrompt('');
  };

  const handleGenerate = async () => {
    const langName = CONTENT_LANGUAGES.find((l) => l.code === contentLanguage)?.label ?? contentLanguage;
    const fullPrompt = `Language: ${langName}. Document template: "${templateName}". Generate content for a "${typeLabel}" block. ${aiPrompt}`;
    await onAiGenerate(block.id, fullPrompt, block.type);
    setShowAiPanel(false);
    setAiPrompt('');
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg bg-white transition-shadow ${
        isDragging ? 'shadow-xl border-blue-300' : 'hover:border-gray-300'
      }`}
    >
      <div className="flex items-start gap-2 p-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-2 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0 touch-none"
          aria-label="drag block"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Content area */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <IconComp className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">{typeLabel}</span>
          </div>

          <Textarea
            value={block.content}
            onChange={(e) => onUpdate(block.id, e.target.value)}
            rows={block.type === 'clause' || block.type === 'paragraph' ? 4 : 2}
            className="text-sm resize-y font-mono"
            placeholder={placeholder}
          />

          {/* AI Panel */}
          {showAiPanel && (
            <div className="border border-violet-200 rounded-lg p-3 bg-violet-50 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-violet-700">
                <Wand2 className="h-4 w-4" />
                {tAi.generate}
              </div>
              <p className="text-xs text-violet-600">{tAi.promptLabel}</p>
              <Input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={tAi.promptPlaceholder}
                className="text-sm"
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleGenerate()}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {isGenerating ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Wand2 className="h-3 w-3 mr-1" />
                  )}
                  {isGenerating ? tAi.generating : tAi.genBtn}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAiPanel(false)}>
                  {tAi.cancel}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Block actions */}
        <div className="flex flex-col gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleAiClick}
            title={tAi.generate}
            className={showAiPanel ? 'text-violet-600 bg-violet-50' : 'text-gray-400 hover:text-violet-600'}
          >
            <Wand2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(block.id)}
            className="text-gray-300 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DocumentTemplates() {
  const { toast } = useToast();
  const { t, locale } = useTranslation();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingBlockId, setGeneratingBlockId] = useState<string | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState(false);

  const [form, setForm] = useState({ name: '', description: '', category: '' });
  const [contentLanguage, setContentLanguage] = useState<string>(locale);
  const [blocks, setBlocks] = useState<TemplateBlock[]>([
    { id: newBlockId(), type: 'paragraph', content: '' },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Translation shortcuts ──────────────────────────────────────────────────
  const tT = (key: string) => t(`documents.templates.${key}`);
  const tAi = {
    generate: tT('aiGenerate'),
    generating: tT('aiGenerating'),
    promptLabel: tT('aiPromptLabel'),
    promptPlaceholder: tT('aiPromptPlaceholder'),
    genBtn: tT('aiGenBtn'),
    cancel: tT('aiCancel'),
  };
  const blockLabels: Record<string, string> = {
    header: tT('blocks.header'),
    paragraph: tT('blocks.paragraph'),
    clause: tT('blocks.clause'),
    signature: tT('blocks.signature'),
    variable: tT('blocks.variable'),
  };
  const blockPlaceholders: Record<string, string> = {
    header: tT('blockPlaceholders.header'),
    paragraph: tT('blockPlaceholders.paragraph'),
    clause: tT('blockPlaceholders.clause'),
    signature: tT('blockPlaceholders.signature'),
    variable: tT('blockPlaceholders.variable'),
  };
  const blockTypes = Object.keys(blockLabels) as TemplateBlock['type'][];

  // ── Data loading ───────────────────────────────────────────────────────────
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
        title: t('common.error'),
        description: tT('loadError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Editor helpers ─────────────────────────────────────────────────────────
  const initEditor = (content = '') => {
    setBlocks(parseContentToBlocks(content));
  };

  const handleCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({ name: '', description: '', category: '' });
    setContentLanguage(locale);
    initEditor('');
  };

  const handleEdit = (template: Template) => {
    setEditing(template);
    setCreating(false);
    setForm({
      name: template.name,
      description: template.description || '',
      category: template.category || '',
    });
    setContentLanguage(locale);
    initEditor(template.content);
  };

  // ── Block management ───────────────────────────────────────────────────────
  const addBlock = (type: TemplateBlock['type']) => {
    setBlocks((prev) => [...prev, { id: newBlockId(), type, content: '' }]);
    setShowBlockMenu(false);
  };

  const updateBlock = (id: string, content: string) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, content } : b)));
  };

  const deleteBlock = (id: string) => {
    setBlocks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      return next.length === 0 ? [{ id: newBlockId(), type: 'paragraph', content: '' }] : next;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks((prev) => {
        const oldIdx = prev.findIndex((b) => b.id === active.id);
        const newIdx = prev.findIndex((b) => b.id === over.id);
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  };

  // ── AI generation ──────────────────────────────────────────────────────────
  const handleAiGenerate = async (blockId: string, prompt: string) => {
    try {
      setGeneratingBlockId(blockId);
      const res = await api.post('/documents/ai/generate', {
        prompt,
        documentType: 'template',
        saveAsDocument: false,
      });
      const generatedText: string = res.data?.content || res.data?.response || '';
      if (generatedText) {
        updateBlock(blockId, generatedText);
      }
    } catch {
      toast({
        title: t('common.error'),
        description: tT('aiError'),
        variant: 'destructive',
      });
    } finally {
      setGeneratingBlockId(null);
    }
  };

  // ── Save / Delete ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim() || blocks.every((b) => !b.content.trim())) {
      toast({ title: t('common.error'), description: tT('requiredFields'), variant: 'destructive' });
      return;
    }
    const content = blocksToContent(blocks);
    const variables = extractVariables(content);
    try {
      setSaving(true);
      if (editing) {
        await api.put(`/documents/templates/${editing.id}`, { ...form, content, variables });
        toast({ title: t('common.success'), description: tT('updateSuccess') });
      } else {
        await api.post('/documents/templates', { ...form, content, variables });
        toast({ title: t('common.success'), description: tT('saveSuccess') });
      }
      setEditing(null);
      setCreating(false);
      loadTemplates();
    } catch {
      toast({ title: t('common.error'), description: tT('saveError'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(tT('deleteConfirm'))) return;
    try {
      await api.delete(`/documents/templates/${id}`);
      toast({ title: tT('deleteSuccess') });
      loadTemplates();
    } catch {
      toast({ title: t('common.error'), description: tT('deleteError'), variant: 'destructive' });
    }
  };

  // ── Editor View ─────────────────────────────────────────────────────────────
  if (creating || editing) {
    const combinedContent = blocksToContent(blocks);
    const detectedVars = extractVariables(combinedContent);

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => {
              setCreating(false);
              setEditing(null);
            }}
          >
            ← {tT('back')}
          </Button>
          <h2 className="text-xl font-bold">{editing ? tT('editTitle') : tT('newTitle')}</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── Left: Editor ──────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Meta fields */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="space-y-1">
                  <Label>{tT('nameLabel')} *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={tT('namePlaceholder')}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{tT('descriptionLabel')}</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder={tT('descriptionPlaceholder')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>{tT('categoryLabel')}</Label>
                    <select
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      <option value="">{t('common.none')}</option>
                      <option value="vente">Vente</option>
                      <option value="location">Location</option>
                      <option value="finance">Finance</option>
                      <option value="visite">Visite</option>
                      <option value="estimation">Estimation</option>
                      <option value="mandat">Mandat</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>{tT('languageLabel')}</Label>
                    <div className="flex gap-1">
                      {CONTENT_LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => setContentLanguage(lang.code)}
                          title={lang.label}
                          className={`px-2 py-1.5 rounded text-sm border transition-colors ${
                            contentLanguage === lang.code
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          {lang.flag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Drag-and-drop blocks */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{tT('editor')}</CardTitle>
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowBlockMenu((v) => !v)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {tT('addBlock')}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                    {showBlockMenu && (
                      <div className="absolute right-0 top-full mt-1 z-10 bg-white border rounded-lg shadow-lg py-1 min-w-[160px]">
                        {blockTypes.map((bt) => {
                          const Icon = BLOCK_TYPE_ICONS[bt];
                          return (
                            <button
                              key={bt}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 text-left"
                              onClick={() => addBlock(bt)}
                            >
                              <Icon className="h-4 w-4 text-gray-400" />
                              {blockLabels[bt]}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-400">{tT('dragHint')}</p>
              </CardHeader>
              <CardContent>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={blocks.map((b) => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {blocks.map((block) => (
                        <SortableBlock
                          key={block.id}
                          block={block}
                          onUpdate={updateBlock}
                          onDelete={deleteBlock}
                          onAiGenerate={handleAiGenerate}
                          isGeneratingId={generatingBlockId}
                          templateName={form.name}
                          contentLanguage={contentLanguage}
                          blockLabels={blockLabels}
                          blockPlaceholders={blockPlaceholders}
                          tAi={tAi}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>

            {/* Detected variables */}
            {detectedVars.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">{tT('variablesDetected')}:</p>
                <div className="flex flex-wrap gap-1">
                  {detectedVars.map((v) => (
                    <Badge key={v} variant="secondary" className="text-xs font-mono">
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? tT('save') : tT('create')}
            </Button>
          </div>

          {/* ── Right: Preview ─────────────────────────────────────────────── */}
          <Card className="sticky top-4 self-start">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4" /> {tT('preview')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-5 max-h-[600px] overflow-y-auto">
                {combinedContent.trim() ? (
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                    {combinedContent}
                  </pre>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8">
                    {t('documents.templates.blockContent')}...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── List View ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">{tT('title')}</h2>
          <p className="text-sm text-gray-600">{tT('subtitle')}</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" /> {tT('new')}
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
            <p className="text-gray-500 mb-4">{tT('empty')}</p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" /> {tT('emptyCreate')}
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
                  {tT('created')} {new Date(tpl.createdAt).toLocaleDateString()}
                  {tpl.variables && tpl.variables.length > 0 && (
                    <> — {tpl.variables.length} {tT('variables')}</>
                  )}
                </p>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(tpl)}>
                    <Edit3 className="h-3 w-3 mr-1" /> {t('common.edit')}
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

      {/* Preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setPreview(null)}
        >
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
          <div
            className="max-w-2xl w-full max-h-[80vh] overflow-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
          <Card>
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
        </div>
      )}
    </div>
  );
}

