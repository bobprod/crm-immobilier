import React from 'react';
import { MainLayout } from '@/shared/components/layout';
import CommunicationCenter from '@/modules/communications/components/CommunicationCenter';

export default function CommunicationsPage() {
  return (
    <MainLayout title="Communications" breadcrumbs={[{ label: 'Communications' }]}>
      <CommunicationCenter />
    </MainLayout>
  );
}
