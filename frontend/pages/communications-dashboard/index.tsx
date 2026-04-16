import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '@/shared/components/layout';
import { CommunicationsDashboard } from '@/modules/business/communications/components/CommunicationsDashboard';
import { TeamChat } from '@/modules/business/communications/components/TeamChat';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Mail, MessageCircle } from 'lucide-react';

type CommTab = 'messages' | 'chat';

export default function CommunicationsDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CommTab>('messages');

  useEffect(() => {
    if (router.query.tab && typeof router.query.tab === 'string') {
      setActiveTab(router.query.tab as CommTab);
    }
  }, [router.query.tab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as CommTab);
    router.push(`/communications-dashboard?tab=${tab}`, undefined, { shallow: true });
  };

  return (
    <ProtectedRoute>
      <MainLayout title="Communications">
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> Messages
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" /> Chat Équipe
              </TabsTrigger>
            </TabsList>

            <TabsContent value="messages">
              <CommunicationsDashboard />
            </TabsContent>

            <TabsContent value="chat">
              <TeamChat />
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
