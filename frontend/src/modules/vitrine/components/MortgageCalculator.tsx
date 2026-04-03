import React, { useState, useCallback } from 'react';
import { Calculator } from 'lucide-react';

interface MortgageCalculatorProps {
  defaultAmount?: number;
  primaryColor?: string;
}

export const MortgageCalculator: React.FC<MortgageCalculatorProps> = ({
  defaultAmount = 200000,
  primaryColor,
}) => {
  const [amount, setAmount] = useState(defaultAmount);
  const [duration, setDuration] = useState(20);
  const [rate, setRate] = useState(8);

  const monthly = useCallback(() => {
    if (!amount || !duration || !rate) return 0;
    const r = rate / 100 / 12;
    const n = duration * 12;
    if (r === 0) return amount / n;
    const m = (amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(m);
  }, [amount, duration, rate]);

  const monthlyPayment = monthly();
  const totalCost = monthlyPayment * duration * 12;
  const totalInterest = totalCost - amount;

  const fmt = (n: number) =>
    n.toLocaleString('fr-TN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <Calculator
          className="w-5 h-5"
          style={{ color: primaryColor || 'var(--agency-primary)' }}
        />
        <h3 className="font-bold text-gray-900">Simulateur de financement</h3>
      </div>

      <div className="space-y-4">
        {/* Montant */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">Montant</label>
            <span
              className="text-sm font-semibold"
              style={{ color: primaryColor || 'var(--agency-primary)' }}
            >
              {fmt(amount)} TND
            </span>
          </div>
          <input
            type="range"
            min={50000}
            max={2000000}
            step={10000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: primaryColor || 'var(--agency-primary)' }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>50K</span>
            <span>2M</span>
          </div>
        </div>

        {/* Durée */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">Durée</label>
            <span
              className="text-sm font-semibold"
              style={{ color: primaryColor || 'var(--agency-primary)' }}
            >
              {duration} ans
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={30}
            step={1}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: primaryColor || 'var(--agency-primary)' }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>5 ans</span>
            <span>30 ans</span>
          </div>
        </div>

        {/* Taux */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">Taux d'intérêt</label>
            <span
              className="text-sm font-semibold"
              style={{ color: primaryColor || 'var(--agency-primary)' }}
            >
              {rate} %
            </span>
          </div>
          <input
            type="range"
            min={3}
            max={20}
            step={0.25}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: primaryColor || 'var(--agency-primary)' }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>3 %</span>
            <span>20 %</span>
          </div>
        </div>
      </div>

      {/* Result */}
      <div
        className="mt-6 rounded-xl p-4 text-white"
        style={{
          background: `linear-gradient(135deg, ${primaryColor || '#1e40af'} 0%, ${primaryColor || '#1e40af'}cc 100%)`,
        }}
      >
        <p className="text-white/80 text-sm">Mensualité estimée</p>
        <p className="text-3xl font-bold mt-1">{fmt(monthlyPayment)} TND</p>
        <div className="mt-3 pt-3 border-t border-white/20 flex justify-between text-sm text-white/70">
          <span>Coût total : {fmt(totalCost)} TND</span>
          <span>Intérêts : {fmt(totalInterest)} TND</span>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">
        * Simulation indicative. Consultez votre banque pour une offre personnalisée.
      </p>
    </div>
  );
};

export default MortgageCalculator;
