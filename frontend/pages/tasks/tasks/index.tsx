import React from 'react';
import TaskManager from '@/modules/business/tasks/components/TaskManager';
import Layout from '../../../src/modules/core/layout/components/Layout';

export default function TasksPage() {
    return (
        <Layout>
            <div className="p-6">
                <TaskManager />
            </div>
        </Layout>
    );
}
