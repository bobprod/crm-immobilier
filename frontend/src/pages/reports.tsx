import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { AutoReportsGenerator } from '@/modules/intelligence/auto-reports';

export default function AutoReportsPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <AutoReportsGenerator />
      </div>
    </MainLayout>
  );
}
