import React from 'react';
import Layout from '@/modules/core/layout/components/Layout';
import PlanificationModule from '@/modules/business/planification/components/PlanificationModule';

/**
 * Page Tâches
 */
export default function TasksPage() {
    return (
        <Layout>
            <PlanificationModule activeTab="tasks" />
        </Layout>
    );
}
