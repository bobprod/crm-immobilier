import React from 'react';
import { MainLayout } from '@/shared/components/layout';
import TaskManager from '@/modules/business/tasks/components/TaskManager';

export default function TasksPage() {
  return (
    <MainLayout title="Tâches" breadcrumbs={[{ label: 'Tâches' }]}>
      <TaskManager />
    </MainLayout>
  );
}
