import React from 'react';
import Layout from '@/modules/core/layout/components/Layout';
import PlanificationDashboard from '@/modules/business/planification/components/PlanificationDashboard';

/**
 * Page Planification - Module Dashboard
 */
export default function PlanificationPage() {
    return (
        <Layout>
            <PlanificationDashboard />
        </Layout>
    );
}
