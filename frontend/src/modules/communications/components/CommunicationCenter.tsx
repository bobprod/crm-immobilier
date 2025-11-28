import React, { useState, useEffect } from 'react';
import communicationsService, { Communication } from '../communications.service';
import { Inbox } from './Inbox';
import { MessageViewer } from './MessageViewer';
import { Composer } from './Composer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { MessageSquare, Plus, RefreshCw } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/shared/components/ui/resizable';

export default function CommunicationCenter() {
    const [messages, setMessages] = useState<Communication[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<Communication | null>(null);
    const [loading, setLoading] = useState(true);
    const [isComposing, setIsComposing] = useState(false);

    useEffect(() => {
        loadMessages();
    }, []);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const data = await communicationsService.getHistory();
            setMessages(data);
        } catch (error) {
            console.error('Erreur chargement messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectMessage = (message: Communication) => {
        setSelectedMessage(message);
        setIsComposing(false);
    };

    const handleCompose = () => {
        setSelectedMessage(null);
        setIsComposing(true);
    };

    const handleSent = () => {
        loadMessages();
        setIsComposing(false);
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <MessageSquare className="h-6 w-6 text-green-600" />
                    Centre de Communications
                </h1>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={loadMessages} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button onClick={handleCompose}>
                        <Plus className="mr-2 h-4 w-4" /> Nouveau Message
                    </Button>
                </div>
            </div>

            <Card className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal">
                    <ResizablePanel defaultSize={35} minSize={25}>
                        <div className="h-full p-4 border-r">
                            <Inbox
                                messages={messages}
                                onSelectMessage={handleSelectMessage}
                                selectedId={selectedMessage?.id}
                            />
                        </div>
                    </ResizablePanel>

                    <ResizableHandle />

                    <ResizablePanel defaultSize={65}>
                        <div className="h-full p-4 bg-gray-50/50">
                            {isComposing ? (
                                <Composer onSent={handleSent} />
                            ) : (
                                <MessageViewer message={selectedMessage} />
                            )}
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </Card>
        </div>
    );
}
