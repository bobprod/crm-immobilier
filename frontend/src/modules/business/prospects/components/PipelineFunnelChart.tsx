import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ProspectPipelineColumn } from '@/shared/utils/prospects-api';

/**
 * PipelineFunnelChart — Odoo-inspired visual funnel showing prospect conversion
 * through pipeline stages with counts and conversion rates.
 */

interface PipelineFunnelChartProps {
  columns: ProspectPipelineColumn[];
  total: number;
  conversionRate: number;
}

export function PipelineFunnelChart({ columns, total, conversionRate }: PipelineFunnelChartProps) {
  const visibleColumns = columns.filter((c) => c.key !== 'perdu' && c.key !== 'gagne');
  const wonColumn = columns.find((c) => c.key === 'gagne');
  const lostColumn = columns.find((c) => c.key === 'perdu');

  const maxCount = Math.max(...visibleColumns.map((c) => c.count), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Tunnel de Conversion</h3>
          <p className="text-xs text-gray-500 mt-0.5">Analyse du pipeline commercial</p>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
          <TrendingUp className="w-4 h-4" />
          {conversionRate.toFixed(1)}% converti
        </div>
      </div>

      {/* Funnel bars */}
      <div className="space-y-2.5">
        {visibleColumns.map((col, idx) => {
          const width = maxCount > 0 ? Math.max((col.count / maxCount) * 100, 8) : 8;
          const prevCount = idx > 0 ? visibleColumns[idx - 1].count : col.count;
          const dropRate = prevCount > 0 ? Math.round((1 - col.count / prevCount) * 100) : 0;

          return (
            <div key={col.key} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-20 shrink-0 text-right">{col.label}</span>
              <div className="flex-1 relative h-8">
                <div
                  className="h-full rounded-md flex items-center px-3 transition-all duration-500"
                  style={{
                    width: `${width}%`,
                    backgroundColor: col.color + '22',
                    borderLeft: `3px solid ${col.color}`,
                  }}
                >
                  <span className="text-xs font-semibold" style={{ color: col.color }}>
                    {col.count}
                  </span>
                </div>
              </div>
              {idx > 0 && (
                <div
                  className={`text-xs w-12 text-right shrink-0 font-medium ${
                    dropRate > 50
                      ? 'text-red-500'
                      : dropRate > 25
                        ? 'text-amber-500'
                        : 'text-green-500'
                  }`}
                >
                  {dropRate > 0 ? `-${dropRate}%` : '—'}
                </div>
              )}
              {idx === 0 && <div className="w-12 shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Won / Lost summary */}
      <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 rounded-lg p-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <div className="text-lg font-bold text-emerald-700">{wonColumn?.count ?? 0}</div>
            <div className="text-xs text-emerald-600">Gagnés</div>
          </div>
        </div>
        <div className="bg-red-50 rounded-lg p-3 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-red-500 shrink-0" />
          <div>
            <div className="text-lg font-bold text-red-600">{lostColumn?.count ?? 0}</div>
            <div className="text-xs text-red-500">Perdus</div>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="mt-3 text-center text-xs text-gray-400">
        {total} prospect{total !== 1 ? 's' : ''} au total dans le pipeline
      </div>
    </div>
  );
}

export default PipelineFunnelChart;
