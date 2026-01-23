import React from 'react';
import { MainLayout } from '@/shared/components/layout';
import { SitesVitriniesDashboard } from '@/modules/business/vitrine/components/SitesVitriniesDashboard';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';

export default function SitesVitriniesDashboardPage() {
    return (
        <ProtectedRoute>
            <MainLayout title="Sites Vitrines">
                <SitesVitriniesDashboard />
            </MainLayout>
        </ProtectedRoute>
    );
}
