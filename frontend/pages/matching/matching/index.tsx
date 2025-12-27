import React from 'react';
import MatchingPanel from '@/modules/intelligence/matching/components/MatchingPanel';
import Layout from '../../../src/modules/core/layout/components/Layout';

export default function MatchingPage() {
  return (
    <Layout>
      <div className="p-6">
        <MatchingPanel />
      </div>
    </Layout>
  );
}
