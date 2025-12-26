import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import apiClient from '@/shared/utils/backend-api';
import { Save, Eye, Trash2 } from 'lucide-react';
import { useRouter } from 'next/router';

export default function PageBuilderEditor() {
  const router = useRouter();
  const { id } = router.query;
  const [page, setPage] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);

  useEffect(() => {
    if (id) loadPage();
  }, [id]);

  const loadPage = async () => {
    const response = await apiClient.get(`/page-builder/pages/${id}`);
    setPage(response.data);
    setBlocks(response.data.blocks);
  };

  const addBlock = (type: string) => {
    setBlocks([
      ...blocks,
      {
        id: `block-${Date.now()}`,
        type,
        order: blocks.length,
        props: {},
      },
    ]);
  };

  const savePage = async () => {
    await apiClient.put(`/page-builder/pages/${id}`, { blocks });
    alert('Sauvegardé !');
  };

  return (
    <div className="flex h-screen">
      <div className="w-64 bg-gray-100 p-4">
        <h2 className="font-bold mb-4">Blocs</h2>
        <Button onClick={() => addBlock('heading')}>Titre</Button>
        <Button onClick={() => addBlock('text')}>Texte</Button>
        <Button onClick={() => addBlock('image')}>Image</Button>
      </div>

      <div className="flex-1 p-8">
        <Button onClick={savePage}>Sauvegarder</Button>

        <div className="space-y-4 mt-4">
          {blocks.map((block) => (
            <Card key={block.id} className="p-4">
              {block.type}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
