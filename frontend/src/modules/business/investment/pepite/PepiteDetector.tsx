'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import {
  Flame, RefreshCw, Globe, AlertCircle, Loader2, MapPin, Info,
  Search, Link, X, ChevronDown, ChevronUp, Sparkles,
} from 'lucide-react';
import { pepiteApi, PepiteOpportunity, PepiteScanResult, PepiteSource } from '../api/pepite.api';
import { PepiteCard } from './PepiteCard';

interface PepiteDetectorProps {
  defaultCountry?: string;
}

const SCORE_LABELS = ['PÉPITE', 'BONNE', 'NORMALE', 'FAIBLE'] as const;

const COUNTRY_FLAGS: Record<string, string> = {
  Tunisie: '🇹🇳',
  France: '🇫🇷',
  Maroc: '🇲🇦',
};

const KEYWORD_PRESETS: Record<string, string[]> = {
  Tunisie: ['terrain agricole titre bleu', 'lot zone UA', 'terrain viabilisé', 'vente judiciaire terrain', 'terrain constructible'],
  France: ['terrain à bâtir', 'bien sous-évalué', 'terrain viabilisé', 'vente rapide', 'terrain PLU constructible'],
  Maroc: ['terrain titre', 'terrain urbanisable', 'vente rapide terrain'],
};

export function PepiteDetector({ defaultCountry = 'Tunisie' }: PepiteDetectorProps) {
  const [country, setCountry] = useState(defaultCountry);
  const [result, setResult] = useState<PepiteScanResult | null>(null);
  const [sources, setSources] = useState<PepiteSource[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterLabel, setFilterLabel] = useState<string>('all');

  // Champs de recherche avancée
  const [keywords, setKeywords] = useState('');
  const [urlsInput, setUrlsInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPrompt, setShowAiPrompt] = useState(false);

  const loadSources = useCallback(async (c: string) => {
    try {
      const data = await pepiteApi.getSources(c);
      setSources(data.sources);
      setAvailableCountries(data.availableCountries);
    } catch { /* silencieux */ }
  }, []);

  const runAiPrompt = useCallback(async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const parsed = await pepiteApi.analyzePrompt(aiPrompt, country);
      setKeywords(parsed.keywords.join(', '));
      setShowAiPrompt(false);
    } catch {
      // silencieux
    } finally {
      setAiLoading(false);
    }
  }, [aiPrompt, country]);

  const runScan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cleanUrls = urlsInput
        .split('\n')
        .map((u) => u.trim())
        .filter((u) => u.startsWith('http'))
        .join(',');

      const data = await pepiteApi.scan(country, {
        keywords: keywords.trim() || undefined,
        urls: cleanUrls || undefined,
      });
      setResult(data);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Erreur lors du scan';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [country, keywords, urlsInput]);

  useEffect(() => {
    loadSources(country);
    setResult(null);
  }, [country, loadSources]);

  const filtered: PepiteOpportunity[] = (result?.opportunities ?? []).filter(
    (o) => filterLabel === 'all' || o.scoreLabel === filterLabel,
  );

  const pepiteCount = result?.opportunities.filter((o) => o.scoreLabel === 'PÉPITE').length ?? 0;
  const presets = KEYWORD_PRESETS[country] ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Radar Spot
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Détection automatique d'opportunités foncières selon le marché local de l'agence
          </p>
        </div>
        <Select value={country} onValueChange={(v) => { setCountry(v); }}>
          <SelectTrigger className="w-44">
            <Globe className="h-4 w-4 mr-2 shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(availableCountries.length ? availableCountries : [country]).map((c) => (
              <SelectItem key={c} value={c}>
                {COUNTRY_FLAGS[c] ?? '🌍'} {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sources actives */}
      {sources.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground font-medium">Sources actives :</span>
          {sources.map((s) => (
            <Badge key={s.id} variant="outline" className="text-xs">{s.label}</Badge>
          ))}
        </div>
      )}

      {/* ── Barre de recherche principale ── */}
      <Card className="border-orange-100 bg-orange-50/30">
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 bg-white"
                placeholder={`Recherche libre... ex: "terrain agricole zone UA Tunis"`}
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runScan()}
              />
            </div>
            <Button onClick={runScan} disabled={loading} className="gap-2 shrink-0">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {loading ? 'Scan...' : 'Scanner'}
            </Button>
          </div>

          {/* Mode IA : langage naturel → mots-clés */}
          {showAiPrompt ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  className="bg-white text-sm"
                  placeholder={`Ex: "trouve terrain Ariana sous 150k TND viabilisé zone urbaine"`}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runAiPrompt()}
                  autoFocus
                />
                <Button size="sm" onClick={runAiPrompt} disabled={aiLoading} className="shrink-0 gap-1.5">
                  {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {aiLoading ? 'IA...' : 'Convertir'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAiPrompt(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">L'IA va extraire les mots-clés de votre description</p>
            </div>
          ) : (
            <button
              onClick={() => setShowAiPrompt(true)}
              className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              Décrire en langage naturel (IA)
            </button>
          )}

          {/* Mots-clés prédéfinis */}
          {presets.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs text-muted-foreground">Rapide :</span>
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => setKeywords(p)}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                    keywords === p
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-muted-foreground border-gray-200 hover:border-orange-300 hover:text-orange-600'
                  }`}
                >
                  {p}
                </button>
              ))}
              {keywords && (
                <button onClick={() => setKeywords('')} className="text-xs text-gray-400 hover:text-gray-600 ml-1">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {/* Options avancées : URLs à scraper */}
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Link className="h-3 w-3" />
            Ajouter des liens à analyser
            {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {showAdvanced && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                URLs à scraper (une par ligne — Tayara, Mubawab, SeLoger, annonce personnelle…)
              </Label>
              <Textarea
                className="text-xs bg-white font-mono h-24 resize-none"
                placeholder={
                  country === 'Tunisie'
                    ? 'https://www.tayara.tn/item/...\nhttps://www.mubawab.tn/fr/...'
                    : 'https://www.seloger.com/annonces/...\nhttps://www.leboncoin.fr/annonces/...'
                }
                value={urlsInput}
                onChange={(e) => setUrlsInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Le Radar Spot va scraper ces pages et extraire les données (titre, prix, surface) pour les scorer.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Erreur */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-2 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </CardContent>
        </Card>
      )}

      {/* Résultats */}
      {result && !loading && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-2xl font-bold text-orange-500">{pepiteCount}</p>
                <p className="text-xs text-muted-foreground">Spots détectés 📡</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-2xl font-bold">{result.totalScanned}</p>
                <p className="text-xs text-muted-foreground">Opportunités scannées</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-2xl font-bold">{COUNTRY_FLAGS[result.country] ?? '🌍'} {result.country}</p>
                <p className="text-xs text-muted-foreground">Marché analysé</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-2xl font-bold">{result.sources.length}</p>
                <p className="text-xs text-muted-foreground">Sources interrogées</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtres */}
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant={filterLabel === 'all' ? 'default' : 'outline'} onClick={() => setFilterLabel('all')}>
              Tous ({result.opportunities.length})
            </Button>
            {SCORE_LABELS.map((label) => {
              const count = result.opportunities.filter((o) => o.scoreLabel === label).length;
              if (count === 0) return null;
              return (
                <Button key={label} size="sm" variant={filterLabel === label ? 'default' : 'outline'} onClick={() => setFilterLabel(label)}>
                  {label === 'PÉPITE' && '📡 '}
                  {label === 'PÉPITE' ? 'HOT SPOT' : label} ({count})
                </Button>
              );
            })}
          </div>

          {/* Liste */}
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p>Aucune opportunité trouvée pour ce filtre.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((o) => <PepiteCard key={o.id} opportunity={o} />)}
            </div>
          )}

          <p className="text-xs text-muted-foreground text-right">
            Scan effectué le {new Date(result.scanDate).toLocaleString('fr-FR')}
          </p>
        </>
      )}

      {/* État initial */}
      {!result && !loading && !error && (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center space-y-4">
            <Flame className="h-12 w-12 mx-auto text-orange-300" />
            <div>
              <p className="font-semibold">Radar Spot — Marché {COUNTRY_FLAGS[country]} {country}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tapez des mots-clés ou collez des liens, puis lancez le radar
              </p>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 max-w-md mx-auto text-left">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                Le Radar Spot croise : prix sous le marché, vocation PAU urbaine, titre foncier
                valide et absence de risques. Score ≥ 70 = HOT SPOT 📡
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
