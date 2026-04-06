import React from 'react';
import { MainLayout } from '@/shared/components/layout';
import { PlanificationDashboard } from '@/modules/business/planification/components/PlanificationDashboard';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';

/**
 * Page Rendez-vous
 */
export default function AppointmentsPage() {
  return (
    <ProtectedRoute>
      <MainLayout
        title="Rendez-vous"
        breadcrumbs={[{ label: 'Planification', href: '/planification' }, { label: 'Rendez-vous' }]}
      >
        <PlanificationDashboard />
      </MainLayout>
    </ProtectedRoute>
  );
}
