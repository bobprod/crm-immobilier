import React from 'react';
import TaskManager from '@/modules/business/tasks/components/TaskManager';
import { MainLayout } from '@/shared/components/layout';

export default function TasksPage() {
  return (
    <MainLayout>
      <div className="p-6">
        <TaskManager />
      </div>
    </MainLayout>
  );
}
