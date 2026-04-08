'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { DollarSign, Percent, Calendar } from 'lucide-react';

interface MortgageCalculatorProps {
  propertyPrice: number;
  currency?: string;
}

interface CalculationResult {
  monthlyPayment: number;
  totalCost: number;
  totalInterest: number;
  downPayment: number;
  loanAmount: number;
  costBreakdown: {
    principal: number;
    interest: number;
    insuranceAndTaxes: number;
  };
}

export const MortgageCalculator: React.FC<MortgageCalculatorProps> = ({
  propertyPrice,
  currency = 'TND',
}) => {
  // Input states
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(4.5);
  const [loanTerm, setLoanTerm] = useState(20);
  const [includeInsurance, setIncludeInsurance] = useState(true);
  const [insuranceRate, setInsuranceRate] = useState(0.5); // 0.5% of loan amount per year

  // Calculate all values
  const calculation: CalculationResult = useMemo(() => {
    const downPayment = (propertyPrice * downPaymentPercent) / 100;
    const loanAmount = propertyPrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    // Monthly payment formula: P * [r(1+r)^n] / [(1+r)^n - 1]
    let monthlyPayment = 0;
    if (monthlyRate === 0) {
      monthlyPayment = loanAmount / numberOfPayments;
    } else {
      const numerator = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments);
      const denominator = Math.pow(1 + monthlyRate, numberOfPayments) - 1;
      monthlyPayment = numerator / denominator;
    }

    // Add insurance if enabled
    const monthlyInsurance = includeInsurance ? (loanAmount * insuranceRate) / 100 / 12 : 0;
    const totalMonthlyPayment = monthlyPayment + monthlyInsurance;

    // Total cost over loan period
    const totalCost = totalMonthlyPayment * numberOfPayments;
    const totalInterest = totalCost - loanAmount;

    // Insurance and taxes breakdown
    const totalInsurance = monthlyInsurance * numberOfPayments;

    return {
      monthlyPayment: totalMonthlyPayment,
      totalCost,
      totalInterest,
      downPayment,
      loanAmount,
      costBreakdown: {
        principal: loanAmount,
        interest: totalInterest - totalInsurance,
        insuranceAndTaxes: totalInsurance,
      },
    };
  }, [propertyPrice, downPaymentPercent, interestRate, loanTerm, includeInsurance, insuranceRate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: currency === 'TND' ? 'TND' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Calculatrice Hypothécaire
        </CardTitle>
        <p className="text-sm text-slate-600 mt-1">
          Estimez vos mensualités pour l'achat de ce bien
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Parameters */}
        <div className="space-y-6 bg-slate-50 p-4 rounded-lg">
          {/* Down Payment */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 font-semibold text-sm">
              <DollarSign className="h-4 w-4" />
              Apport initial : {downPaymentPercent}%
            </label>
            <input
              type="range"
              min={5}
              max={50}
              step={1}
              value={downPaymentPercent}
              onChange={(e) => setDownPaymentPercent(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-slate-600">
              {formatCurrency(calculation.downPayment)} de {formatCurrency(propertyPrice)}
            </div>
          </div>

          {/* Interest Rate */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 font-semibold text-sm">
              <Percent className="h-4 w-4" />
              Taux d'intérêt annuel : {interestRate.toFixed(2)}%
            </label>
            <input
              type="range"
              min={1}
              max={10}
              step={0.1}
              value={interestRate}
              onChange={(e) => setInterestRate(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-slate-600">Taux indicatif (consulter votre banque)</div>
          </div>

          {/* Loan Term */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 font-semibold text-sm">
              <Calendar className="h-4 w-4" />
              Durée du crédit : {loanTerm} ans
            </label>
            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={loanTerm}
              onChange={(e) => setLoanTerm(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-slate-600">{loanTerm * 12} mois</div>
          </div>

          {/* Insurance Toggle */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                id="insurance"
                checked={includeInsurance}
                onChange={(e) => setIncludeInsurance(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="insurance" className="font-semibold cursor-pointer text-sm">
                Inclure l'assurance crédit ({insuranceRate.toFixed(1)}% par an)
              </label>
            </div>
            {includeInsurance && (
              <input
                type="range"
                min={0.3}
                max={1.5}
                step={0.1}
                value={insuranceRate}
                onChange={(e) => setInsuranceRate(parseFloat(e.target.value))}
                className="w-full"
              />
            )}
          </div>
        </div>

        {/* Results */}
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Mensualités</TabsTrigger>
            <TabsTrigger value="breakdown">Détails</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="space-y-4">
            {/* Main monthly payment - prominent display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <div className="text-sm font-medium text-blue-900 mb-2">Mensualité estimée</div>
              <div className="text-4xl font-bold text-blue-600 mb-1">
                {formatCurrency(calculation.monthlyPayment)}
              </div>
              <div className="text-xs text-blue-800">par mois</div>
            </div>

            {/* Summary grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="text-xs font-medium text-slate-600 mb-1">Montant emprunté</div>
                <div className="text-lg font-semibold text-slate-900">
                  {formatCurrency(calculation.loanAmount)}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="text-xs font-medium text-slate-600 mb-1">Apport initial</div>
                <div className="text-lg font-semibold text-slate-900">
                  {formatCurrency(calculation.downPayment)}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="text-xs font-medium text-slate-600 mb-1">Total à payer</div>
                <div className="text-lg font-semibold text-slate-900">
                  {formatCurrency(calculation.totalCost)}
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-xs font-medium text-red-600 mb-1">Intérêts + Assurance</div>
                <div className="text-lg font-semibold text-red-700">
                  {formatCurrency(calculation.totalInterest)}
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 italic">
              Durée totale : {loanTerm} ans ({loanTerm * 12} mois)
            </div>
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-4">
            {/* Cost breakdown pie chart simulation */}
            <div className="space-y-3">
              <div className="text-sm font-semibold text-slate-900">Répartition du coût total</div>

              {/* Principal */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700">Capital emprunté</span>
                  <span className="font-semibold">
                    {((calculation.costBreakdown.principal / calculation.totalCost) * 100).toFixed(
                      1
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded h-2">
                  <div
                    className="bg-blue-500 h-2 rounded"
                    style={{
                      width: `${(calculation.costBreakdown.principal / calculation.totalCost) * 100}%`,
                    }}
                  />
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {formatCurrency(calculation.costBreakdown.principal)}
                </div>
              </div>

              {/* Interest */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700">Intérêts</span>
                  <span className="font-semibold">
                    {((calculation.costBreakdown.interest / calculation.totalCost) * 100).toFixed(
                      1
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded h-2">
                  <div
                    className="bg-orange-500 h-2 rounded"
                    style={{
                      width: `${(calculation.costBreakdown.interest / calculation.totalCost) * 100}%`,
                    }}
                  />
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {formatCurrency(calculation.costBreakdown.interest)}
                </div>
              </div>

              {/* Insurance */}
              {includeInsurance && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700">Assurance & Taxes</span>
                    <span className="font-semibold">
                      {(
                        (calculation.costBreakdown.insuranceAndTaxes / calculation.totalCost) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded h-2">
                    <div
                      className="bg-green-500 h-2 rounded"
                      style={{
                        width: `${(calculation.costBreakdown.insuranceAndTaxes / calculation.totalCost) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {formatCurrency(calculation.costBreakdown.insuranceAndTaxes)}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-800">
              💡 <span className="font-semibold">Conseil :</span> Ces estimations sont indicatives.
              Consultez votre banque pour un devis précis incluant tous les frais.
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
