import React from 'react';
import TaskManager from '@/modules/business/tasks/components/TaskManager';
import DashboardLayout from '@/shared/components/layout/DashboardLayout';

export default function TasksPage() {
    return (
        <DashboardLayout>
            <div className="p-6">
                <TaskManager />
            </div>
        </DashboardLayout>
    );
}
