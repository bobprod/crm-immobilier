import React from 'react';
import Layout from '../../src/modules/core/layout/components/Layout';
import TaskManager from '@/modules/business/tasks/components/TaskManager';

export default function TasksPage() {
  return (
    <Layout>
      <TaskManager />
    </Layout>
  );
}
