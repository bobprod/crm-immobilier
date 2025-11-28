import React from 'react';
import { cn } from '@/shared/utils/utils';

interface MatchScoreProps {
    score: number;
    size?: 'sm' | 'md' | 'lg';
}

export function MatchScore({ score, size = 'md' }: MatchScoreProps) {
    // Score is between 0 and 1, convert to percentage
    const percentage = Math.round(score * 100);

    const getColor = (val: number) => {
        if (val >= 80) return 'text-green-600 border-green-200 bg-green-50';
        if (val >= 60) return 'text-yellow-600 border-yellow-200 bg-yellow-50';
        return 'text-red-600 border-red-200 bg-red-50';
    };

    const getSize = (s: string) => {
        switch (s) {
            case 'sm': return 'h-8 w-8 text-xs';
            case 'lg': return 'h-16 w-16 text-xl';
            default: return 'h-12 w-12 text-sm';
        }
    };

    return (
        <div className={cn(
            "rounded-full border-2 flex items-center justify-center font-bold",
            getColor(percentage),
            getSize(size)
        )}>
            {percentage}%
        </div>
    );
}
