import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { MainLayout } from '@/shared/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import {
  usePersonnel,
  AgentProfile,
  CommissionOverride,
  MonthlyPerformance,
  AnnualSummary,
} from '@/shared/hooks/usePersonnel';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import {
  ChevronLeft,
  Save,
  TrendingUp,
  Trophy,
  Settings2,
  Calendar,
  Info,
  Trash2,
} from 'lucide-react';

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function AgentDetailPage() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { user } = useAuth();
  const { commissionConfig, saveAgentCommissionOverride, deleteAgentCommissionOverride, saveMonthlyPerformance } =
    usePersonnel();

  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [summary, setSummary] = useState<AnnualSummary | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  // Override form
  const [overrideForm, setOverrideForm] = useState<Partial<CommissionOverride>>({});
  const [savingOverride, setSavingOverride] = useState(false);
  const [overrideSuccess, setOverrideSuccess] = useState(false);

  // Performance form
  const [perfMonth, setPerfMonth] = useState(new Date().getMonth() + 1);
  const [perfCA, setPerfCA] = useState('');
  const [perfDirectCA, setPerfDirectCA] = useState('');
  const [savingPerf, setSavingPerf] = useState(false);
  const [perfSuccess, setPerfSuccess] = useState(false);

  const loadAgentData = async (year: number) => {
    if (!id) return;
    setLoading(true);
    try {
      const [profileRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/personnel/agents/${id}`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/personnel/agents/${id}/annual-summary?year=${year}`, {
          headers: getAuthHeaders(),
        }),
      ]);
      if (profileRes.ok) {
        const data = await profileRes.json();
        setAgent(data);
        if (data.commissionOverride) {
          setOverrideForm(data.commissionOverride);
        }
      }
      if (summaryRes.ok) {
        setSummary(await summaryRes.json());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadAgentData(selectedYear);
  }, [id, selectedYear]);

  if (!user) {
    if (typeof window !== 'undefined') router.push('/login');
    return null;
  }

  const handleSaveOverride = async () => {
    if (!id) return;
    setSavingOverride(true);
    setOverrideSuccess(false);
    try {
      await saveAgentCommissionOverride(id, overrideForm);
      setOverrideSuccess(true);
      setTimeout(() => setOverrideSuccess(false), 3000);
      loadAgentData(selectedYear);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingOverride(false);
    }
  };

  const handleDeleteOverride = async () => {
    if (!id) return;
    if (!confirm("Supprimer les paramètres personnalisés ? L'agent utilisera le barème de l'agence.")) return;
    try {
      await deleteAgentCommissionOverride(id);
      setOverrideForm({});
      loadAgentData(selectedYear);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSavePerf = async () => {
    if (!id) return;
    setSavingPerf(true);
    setPerfSuccess(false);
    try {
      await saveMonthlyPerformance(id, {
        year: selectedYear,
        month: perfMonth,
        caAmount: perfCA ? parseFloat(perfCA) : 0,
        directSalesCA: perfDirectCA ? parseFloat(perfDirectCA) : 0,
      });
      setPerfSuccess(true);
      setTimeout(() => setPerfSuccess(false), 3000);
      setPerfCA('');
      setPerfDirectCA('');
      loadAgentData(selectedYear);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingPerf(false);
    }
  };

  const effectiveTier1Max = overrideForm.tier1MaxAmount ?? commissionConfig?.tier1MaxAmount ?? 4000;
  const effectiveTier2Min = overrideForm.tier2MinAmount ?? commissionConfig?.tier2MinAmount ?? 7000;
  const effectiveTier2Rate = overrideForm.tier2Rate ?? commissionConfig?.tier2Rate ?? 15;
  const effectiveTier3Min = overrideForm.tier3MinAmount ?? commissionConfig?.tier3MinAmount ?? 11000;
  const effectiveTier3Rate = overrideForm.tier3Rate ?? commissionConfig?.tier3Rate ?? 20;
  const effectiveDirectRate = overrideForm.directSaleRate ?? commissionConfig?.directSaleRate ?? 20;

  const currency = 'TND';

  if (loading) {
    return (
      <MainLayout title="Chargement...">
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </MainLayout>
    );
  }

  if (!agent) {
    return (
      <MainLayout title="Agent introuvable">
        <div className="text-center py-16 text-gray-500">
          <p>Agent non trouvé.</p>
          <Link href="/personnel">
            <Button className="mt-4">Retour au personnel</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const agentName = `${agent.user.firstName ?? ''} ${agent.user.lastName ?? ''}`.trim();

  return (
    <MainLayout
      title={agentName}
      breadcrumbs={[
        { label: 'Personnel', href: '/personnel' },
        { label: agentName },
      ]}
    >
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
              {(agent.user.firstName?.[0] ?? '') + (agent.user.lastName?.[0] ?? '')}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{agentName}</h1>
              <p className="text-gray-500 text-sm">{agent.user.email}</p>
              {agent.jobTitle && <p className="text-xs text-gray-400">{agent.jobTitle}</p>}
            </div>
          </div>
          <Link href="/personnel">
            <Button variant="ghost" className="gap-1">
              <ChevronLeft className="w-4 h-4" />
              Retour
            </Button>
          </Link>
        </div>

        {/* Annual summary */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Année :</label>
          <select
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'CA annuel', value: summary.totalAnnualCA, icon: TrendingUp, color: 'blue' },
              { label: 'Commissions', value: summary.totalCommissions, icon: Settings2, color: 'green' },
              { label: 'Prime annuelle', value: summary.annualBonus, icon: Trophy, color: 'yellow' },
              {
                label: `Taux prime (${summary.bonusRate}%)`,
                value: summary.totalAnnualCA,
                icon: Calendar,
                color: 'purple',
                hide: true,
              },
            ]
              .filter((s) => !s.hide)
              .map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {stat.value.toLocaleString('fr-TN', { maximumFractionDigits: 0 })} {currency}
                    </p>
                    {stat.label === 'Prime annuelle' && summary.bonusRate > 0 && (
                      <p className="text-xs text-yellow-600 mt-1">{summary.bonusRate}% du CA annuel</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500">Taux prime annuelle</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{summary.bonusRate}%</p>
                {summary.bonusRate === 0 && (
                  <p className="text-xs text-gray-400 mt-1">Seuil non atteint</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Monthly performance entry */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-5 h-5 text-blue-600" />
              Saisir performance mensuelle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mois</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={perfMonth}
                  onChange={(e) => setPerfMonth(parseInt(e.target.value, 10))}
                >
                  {MONTHS.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CA mensuel ({currency})
                </label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={perfCA}
                  onChange={(e) => setPerfCA(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CA transactions directes ({currency})
                </label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={perfDirectCA}
                  onChange={(e) => setPerfDirectCA(e.target.value)}
                />
              </div>
            </div>

            {/* Commission preview */}
            {(perfCA || perfDirectCA) && (
              <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-sm">
                {(() => {
                  const ca = parseFloat(perfCA || '0');
                  const directCA = parseFloat(perfDirectCA || '0');
                  let rate = 0;
                  if (ca >= effectiveTier3Min) rate = effectiveTier3Rate;
                  else if (ca >= effectiveTier2Min) rate = effectiveTier2Rate;
                  const comm = (ca * rate) / 100;
                  const directComm = (directCA * effectiveDirectRate) / 100;
                  const total = comm + directComm;
                  return (
                    <div className="space-y-1 text-green-800">
                      <p className="font-medium">Calcul automatique :</p>
                      <p>• Taux CA mensuel : <strong>{rate}%</strong></p>
                      <p>• Commission CA : <strong>{comm.toLocaleString('fr-TN', { maximumFractionDigits: 2 })} {currency}</strong></p>
                      {directCA > 0 && (
                        <p>• Commission directe ({effectiveDirectRate}%) : <strong>{directComm.toLocaleString('fr-TN', { maximumFractionDigits: 2 })} {currency}</strong></p>
                      )}
                      <p className="border-t border-green-200 pt-1 font-bold">
                        Total commission : {total.toLocaleString('fr-TN', { maximumFractionDigits: 2 })} {currency}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button
                onClick={handleSavePerf}
                disabled={savingPerf}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {savingPerf ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Enregistrer
              </Button>
              {perfSuccess && <span className="text-green-600 text-sm font-medium">✓ Enregistré</span>}
            </div>
          </CardContent>
        </Card>

        {/* Monthly breakdown table */}
        {summary && summary.monthlyBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performances {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500 text-xs uppercase">
                    <th className="pb-2 pr-4">Mois</th>
                    <th className="pb-2 pr-4 text-right">CA mensuel</th>
                    <th className="pb-2 pr-4 text-right">Taux</th>
                    <th className="pb-2 pr-4 text-right">Commission CA</th>
                    <th className="pb-2 pr-4 text-right">CA direct</th>
                    <th className="pb-2 text-right">Total commission</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.monthlyBreakdown.map((p: MonthlyPerformance) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2 pr-4 font-medium">{MONTHS[p.month - 1]}</td>
                      <td className="py-2 pr-4 text-right">
                        {p.caAmount.toLocaleString('fr-TN', { maximumFractionDigits: 0 })} {currency}
                      </td>
                      <td className="py-2 pr-4 text-right">
                        <Badge className={p.commissionRate > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                          {p.commissionRate}%
                        </Badge>
                      </td>
                      <td className="py-2 pr-4 text-right">
                        {p.commissionAmount.toLocaleString('fr-TN', { maximumFractionDigits: 2 })} {currency}
                      </td>
                      <td className="py-2 pr-4 text-right">
                        {p.directSalesCA.toLocaleString('fr-TN', { maximumFractionDigits: 0 })} {currency}
                      </td>
                      <td className="py-2 text-right font-semibold text-green-700">
                        {p.totalCommission.toLocaleString('fr-TN', { maximumFractionDigits: 2 })} {currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-bold">
                    <td className="py-2 pr-4">Total</td>
                    <td className="py-2 pr-4 text-right">
                      {summary.totalAnnualCA.toLocaleString('fr-TN', { maximumFractionDigits: 0 })} {currency}
                    </td>
                    <td />
                    <td />
                    <td className="py-2 pr-4 text-right">
                      {summary.totalDirectSalesCA.toLocaleString('fr-TN', { maximumFractionDigits: 0 })} {currency}
                    </td>
                    <td className="py-2 text-right text-green-700">
                      {summary.totalCommissions.toLocaleString('fr-TN', { maximumFractionDigits: 2 })} {currency}
                    </td>
                  </tr>
                </tfoot>
              </table>
              {summary.bonusRate > 0 && (
                <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-sm text-yellow-800 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                  <span>
                    Prime de fin d'année : <strong>{summary.bonusRate}%</strong> sur{' '}
                    {summary.totalAnnualCA.toLocaleString()} {currency} ={' '}
                    <strong>{summary.annualBonus.toLocaleString('fr-TN', { maximumFractionDigits: 2 })} {currency}</strong>
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Per-agent commission override */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="w-5 h-5 text-orange-500" />
              Commission personnalisée (optionnel)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-sm text-orange-800 flex gap-2">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              Si défini, ces paramètres remplacent le barème de l'agence pour cet agent uniquement.
              Laissez vide pour utiliser le barème standard.
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { key: 'tier1MaxAmount', label: `Palier 1 max (${currency})`, suffix: currency },
                { key: 'tier2MinAmount', label: `Palier 2 min (${currency})`, suffix: currency },
                { key: 'tier2Rate', label: 'Taux palier 2', suffix: '%' },
                { key: 'tier3MinAmount', label: `Palier 3 min (${currency})`, suffix: currency },
                { key: 'tier3Rate', label: 'Taux palier 3', suffix: '%' },
                { key: 'directSaleRate', label: 'Taux direct', suffix: '%' },
              ].map(({ key, label, suffix }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      placeholder={`défaut agence`}
                      value={(overrideForm as any)[key] ?? ''}
                      onChange={(e) =>
                        setOverrideForm((f) => ({
                          ...f,
                          [key]: e.target.value === '' ? undefined : parseFloat(e.target.value),
                        }))
                      }
                      className="pr-10 text-sm"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      {suffix}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSaveOverride}
                disabled={savingOverride}
                className="gap-2 bg-orange-500 hover:bg-orange-600"
              >
                {savingOverride ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Enregistrer
              </Button>
              {agent.commissionOverride && (
                <Button
                  variant="ghost"
                  onClick={handleDeleteOverride}
                  className="gap-1 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer l'override
                </Button>
              )}
              {overrideSuccess && (
                <span className="text-green-600 text-sm font-medium">✓ Enregistré</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
