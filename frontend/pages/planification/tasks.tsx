import React from 'react';
import { MainLayout } from '@/shared/components/layout';
import { PlanificationDashboard } from '@/modules/business/planification/components/PlanificationDashboard';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';

/**
 * Page Tâches
 */
export default function TasksPage() {
  return (
    <ProtectedRoute>
      <MainLayout
        title="Tâches"
        breadcrumbs={[{ label: 'Planification', href: '/planification' }, { label: 'Tâches' }]}
      >
        <PlanificationDashboard />
      </MainLayout>
    </ProtectedRoute>
  );
}
