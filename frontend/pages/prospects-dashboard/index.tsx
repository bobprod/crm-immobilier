import React from 'react';
import { MainLayout } from '@/shared/components/layout';
import { ProspectsDashboard } from '@/modules/business/prospects/components/ProspectsDashboard';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';

/**
 * Page Prospects - Module Dashboard avec Prospects et Mandats
 * Mise à jour pour utiliser MainLayout (Phase 2)
 */
export default function ProspectsPage() {
    return (
        <ProtectedRoute>
            <MainLayout title="Prospects">
                <ProspectsDashboard />
            </MainLayout>
        </ProtectedRoute>
    );
}
