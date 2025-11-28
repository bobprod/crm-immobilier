import React from 'react';
import CommunicationCenter from '@/modules/communications/components/CommunicationCenter';
import DashboardLayout from '@/shared/components/layout/DashboardLayout';

export default function CommunicationsPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <CommunicationCenter />
      </div>
    </DashboardLayout>
  );
}
