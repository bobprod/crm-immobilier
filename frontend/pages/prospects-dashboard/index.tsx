import React from 'react';
import Layout from '@/modules/core/layout/components/Layout';
import ProspectsDashboard from '@/modules/business/prospects/components/ProspectsDashboard';

/**
 * Page Prospects - Module Dashboard avec Prospects et Mandats
 */
export default function ProspectsPage() {
    return (
        <Layout>
            <ProspectsDashboard />
        </Layout>
    );
}
