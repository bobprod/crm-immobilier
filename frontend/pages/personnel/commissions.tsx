import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { MainLayout } from '@/shared/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { usePersonnel, CommissionConfig, AnnualBonusConfig } from '@/shared/hooks/usePersonnel';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import { Settings2, Save, ChevronLeft, Percent, Trophy, Info } from 'lucide-react';

function NumericField({
  label,
  value,
  onChange,
  suffix,
  min,
  max,
  description,
}: {
  label: string;
  value: number | undefined | null;
  onChange: (v: number | null) => void;
  suffix?: string;
  min?: number;
  max?: number;
  description?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {description && <p className="text-xs text-gray-500">{description}</p>}
      <div className="relative">
        <Input
          type="number"
          value={value ?? ''}
          min={min ?? 0}
          max={max}
          onChange={(e) =>
            onChange(e.target.value === '' ? null : parseFloat(e.target.value))
          }
          className="pr-12"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export default function CommissionsConfigPage() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    commissionConfig,
    annualBonusConfig,
    loading,
    saveCommissionConfig,
    saveAnnualBonusConfig,
  } = usePersonnel();

  const [commForm, setCommForm] = useState<Partial<CommissionConfig>>({});
  const [bonusForm, setBonusForm] = useState<Partial<AnnualBonusConfig>>({});
  const [savingComm, setSavingComm] = useState(false);
  const [savingBonus, setSavingBonus] = useState(false);
  const [commSuccess, setCommSuccess] = useState(false);
  const [bonusSuccess, setBonusSuccess] = useState(false);

  useEffect(() => {
    if (commissionConfig) setCommForm({ ...commissionConfig });
  }, [commissionConfig]);

  useEffect(() => {
    if (annualBonusConfig) setBonusForm({ ...annualBonusConfig });
  }, [annualBonusConfig]);

  if (!user) {
    if (typeof window !== 'undefined') router.push('/login');
    return null;
  }

  const handleSaveComm = async () => {
    setSavingComm(true);
    setCommSuccess(false);
    try {
      await saveCommissionConfig(commForm);
      setCommSuccess(true);
      setTimeout(() => setCommSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingComm(false);
    }
  };

  const handleSaveBonus = async () => {
    setSavingBonus(true);
    setBonusSuccess(false);
    try {
      await saveAnnualBonusConfig(bonusForm);
      setBonusSuccess(true);
      setTimeout(() => setBonusSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingBonus(false);
    }
  };

  const currency = commForm.currency ?? 'TND';

  return (
    <MainLayout
      title="Commissions & Primes"
      breadcrumbs={[
        { label: 'Personnel', href: '/personnel' },
        { label: 'Commissions & Primes' },
      ]}
    >
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Settings2 className="w-6 h-6 text-blue-600" />
              Commissions &amp; Primes
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Configurez les barèmes de commissions mensuels et les primes de fin d'année
            </p>
          </div>
          <Link href="/personnel">
            <Button variant="ghost" className="gap-1">
              <ChevronLeft className="w-4 h-4" />
              Retour
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            {/* ── Commission mensuelle ────────────────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Percent className="w-5 h-5 text-blue-600" />
                  Barème de commissions mensuel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 flex gap-2">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Règle de calcul :</strong> Le taux de commission est déterminé par le
                    chiffre d'affaires mensuel de l'agent. En dessous du palier 1, aucune commission
                    n'est versée.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                      Palier 1 — Pas de commission
                    </h3>
                    <NumericField
                      label={`CA mensuel inférieur à (${currency})`}
                      value={commForm.tier1MaxAmount}
                      onChange={(v) => setCommForm((f) => ({ ...f, tier1MaxAmount: v ?? 0 }))}
                      suffix={currency}
                      description="En dessous de ce montant : 0% de commission"
                    />
                  </div>

                  <div className="sm:col-span-2 border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                      Palier 2
                    </h3>
                  </div>
                  <NumericField
                    label={`CA mensuel à partir de (${currency})`}
                    value={commForm.tier2MinAmount}
                    onChange={(v) => setCommForm((f) => ({ ...f, tier2MinAmount: v ?? 0 }))}
                    suffix={currency}
                  />
                  <NumericField
                    label="Taux de commission"
                    value={commForm.tier2Rate}
                    onChange={(v) => setCommForm((f) => ({ ...f, tier2Rate: v ?? 0 }))}
                    suffix="%"
                    min={0}
                    max={100}
                  />

                  <div className="sm:col-span-2 border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                      Palier 3
                    </h3>
                  </div>
                  <NumericField
                    label={`CA mensuel à partir de (${currency})`}
                    value={commForm.tier3MinAmount}
                    onChange={(v) => setCommForm((f) => ({ ...f, tier3MinAmount: v ?? 0 }))}
                    suffix={currency}
                  />
                  <NumericField
                    label="Taux de commission"
                    value={commForm.tier3Rate}
                    onChange={(v) => setCommForm((f) => ({ ...f, tier3Rate: v ?? 0 }))}
                    suffix="%"
                    min={0}
                    max={100}
                  />

                  <div className="sm:col-span-2 border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                      Transactions directes
                    </h3>
                    <NumericField
                      label="Commission sur vente directe"
                      value={commForm.directSaleRate}
                      onChange={(v) => setCommForm((f) => ({ ...f, directSaleRate: v ?? 0 }))}
                      suffix="%"
                      min={0}
                      max={100}
                      description="Taux appliqué sur le CA des transactions directement effectuées par l'agent"
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
                  <p className="font-semibold text-gray-700">Aperçu du barème :</p>
                  <ul className="space-y-1 text-gray-600">
                    <li>
                      • CA &lt; {(commForm.tier1MaxAmount ?? 4000).toLocaleString()} {currency} → <strong>0 %</strong>
                    </li>
                    <li>
                      • CA ≥ {(commForm.tier2MinAmount ?? 7000).toLocaleString()} {currency} → <strong>{commForm.tier2Rate ?? 15} %</strong>
                    </li>
                    <li>
                      • CA ≥ {(commForm.tier3MinAmount ?? 11000).toLocaleString()} {currency} → <strong>{commForm.tier3Rate ?? 20} %</strong>
                    </li>
                    <li>
                      • Transaction directe → <strong>{commForm.directSaleRate ?? 20} %</strong>
                    </li>
                  </ul>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSaveComm}
                    disabled={savingComm}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    {savingComm ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Enregistrer le barème
                  </Button>
                  {commSuccess && (
                    <span className="text-green-600 text-sm font-medium">✓ Enregistré</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ── Prime de fin d'année ────────────────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  Prime de fin d'année
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 text-sm text-yellow-800 flex gap-2">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    La prime annuelle est calculée sur le chiffre d'affaires annuel total de l'agent.
                    Configurez le(s) palier(s) de déclenchement.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                      Palier 1
                    </h3>
                  </div>
                  <NumericField
                    label={`CA annuel à partir de (${currency})`}
                    value={bonusForm.tier1MinAmount}
                    onChange={(v) => setBonusForm((f) => ({ ...f, tier1MinAmount: v ?? 0 }))}
                    suffix={currency}
                  />
                  <NumericField
                    label="Taux de prime"
                    value={bonusForm.tier1Rate}
                    onChange={(v) => setBonusForm((f) => ({ ...f, tier1Rate: v ?? 0 }))}
                    suffix="%"
                    min={0}
                    max={100}
                  />

                  <div className="sm:col-span-2 border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                      Palier 2 (optionnel)
                    </h3>
                  </div>
                  <NumericField
                    label={`CA annuel à partir de (${currency})`}
                    value={bonusForm.tier2MinAmount ?? null}
                    onChange={(v) => setBonusForm((f) => ({ ...f, tier2MinAmount: v }))}
                    suffix={currency}
                  />
                  <NumericField
                    label="Taux de prime"
                    value={bonusForm.tier2Rate ?? null}
                    onChange={(v) => setBonusForm((f) => ({ ...f, tier2Rate: v }))}
                    suffix="%"
                    min={0}
                    max={100}
                  />

                  <div className="sm:col-span-2 border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                      Palier 3 (optionnel)
                    </h3>
                  </div>
                  <NumericField
                    label={`CA annuel à partir de (${currency})`}
                    value={bonusForm.tier3MinAmount ?? null}
                    onChange={(v) => setBonusForm((f) => ({ ...f, tier3MinAmount: v }))}
                    suffix={currency}
                  />
                  <NumericField
                    label="Taux de prime"
                    value={bonusForm.tier3Rate ?? null}
                    onChange={(v) => setBonusForm((f) => ({ ...f, tier3Rate: v }))}
                    suffix="%"
                    min={0}
                    max={100}
                  />
                </div>

                {/* Preview */}
                <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
                  <p className="font-semibold text-gray-700">Aperçu du barème :</p>
                  <ul className="space-y-1 text-gray-600">
                    <li>
                      • CA annuel ≥ {(bonusForm.tier1MinAmount ?? 180000).toLocaleString()} {currency} → prime{' '}
                      <strong>{bonusForm.tier1Rate ?? 5} %</strong>
                    </li>
                    {bonusForm.tier2MinAmount && (
                      <li>
                        • CA annuel ≥ {bonusForm.tier2MinAmount.toLocaleString()} {currency} → prime{' '}
                        <strong>{bonusForm.tier2Rate ?? 0} %</strong>
                      </li>
                    )}
                    {bonusForm.tier3MinAmount && (
                      <li>
                        • CA annuel ≥ {bonusForm.tier3MinAmount.toLocaleString()} {currency} → prime{' '}
                        <strong>{bonusForm.tier3Rate ?? 0} %</strong>
                      </li>
                    )}
                  </ul>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSaveBonus}
                    disabled={savingBonus}
                    className="gap-2 bg-yellow-600 hover:bg-yellow-700"
                  >
                    {savingBonus ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Enregistrer les primes
                  </Button>
                  {bonusSuccess && (
                    <span className="text-green-600 text-sm font-medium">✓ Enregistré</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}
