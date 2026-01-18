import React from 'react';
import Layout from '@/modules/core/layout/components/Layout';
import PlanificationModule from '@/modules/business/planification/components/PlanificationModule';

/**
 * Page Rendez-vous
 */
export default function AppointmentsPage() {
    return (
        <Layout>
            <PlanificationModule activeTab="appointments" />
        </Layout>
    );
}
