import React from 'react';
import MatchingPanel from '@/modules/intelligence/matching/components/MatchingPanel';
import DashboardLayout from '@/shared/components/layout/DashboardLayout';

export default function MatchingPage() {
    return (
        <DashboardLayout>
            <div className="p-6">
                <MatchingPanel />
            </div>
        </DashboardLayout>
    );
}
