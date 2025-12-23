import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { PriorityInbox } from '@/modules/intelligence/priority-inbox';

export default function PriorityInboxPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <PriorityInbox />
      </div>
    </MainLayout>
  );
}
