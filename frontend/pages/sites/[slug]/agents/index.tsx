import React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import { Users } from 'lucide-react';
import { AgencyLayout, AgentCard, WhatsAppWidget } from '@/modules/vitrine/components';
import { publicVitrineApi } from '@/shared/utils/public-vitrine-api';
import type { VitrineConfig, PublicAgent } from '@/shared/utils/public-vitrine-api';

interface AgentsPageProps {
  config: VitrineConfig;
  agents: PublicAgent[];
  slug: string;
}

const AgentsPage: NextPage<AgentsPageProps> = ({ config, agents, slug }) => {
  const primaryColor = config.primaryColor || '#1e40af';

  return (
    <AgencyLayout config={config} pageTitle="Notre équipe">
      {/* Page Header */}
      <div
        className="py-16 text-white"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold">Notre équipe</h1>
          <p className="mt-3 text-white/80 text-lg">Des experts immobiliers à votre service</p>
        </div>
      </div>

      {/* Team Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {agents.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg">Aucun agent disponible pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} primaryColor={primaryColor} />
            ))}
          </div>
        )}
      </div>

      {config.whatsappNumber && (
        <WhatsAppWidget phoneNumber={config.whatsappNumber} agencyName={config.agencyName} />
      )}
    </AgencyLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const slug = params?.slug as string;
  try {
    const [agents, home] = await Promise.all([
      publicVitrineApi.getAgents(slug),
      publicVitrineApi.getHome(slug),
    ]);
    return {
      props: { config: home.config, agents, slug },
    };
  } catch {
    return { notFound: true };
  }
};

export default AgentsPage;
