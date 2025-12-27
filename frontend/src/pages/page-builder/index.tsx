import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import apiClient from '@/shared/utils/backend-api';
import { Plus, Edit, Copy, Trash2, Globe } from 'lucide-react';
import Link from 'next/link';

export default function PageBuilderListPage() {
  const [pages, setPages] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [pagesData, templatesData] = await Promise.all([
      apiClient.get('/page-builder/pages'),
      apiClient.get('/page-builder/templates'),
    ]);
    setPages(pagesData.data);
    setTemplates(templatesData.data);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">🎨 Page Builder</h1>

      <Tabs defaultValue="pages">
        <TabsList>
          <TabsTrigger value="pages">Mes Pages</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="pages">
          <div className="grid grid-cols-3 gap-4">
            {pages.map((page) => (
              <Card key={page.id}>
                <CardHeader>
                  <CardTitle>{page.title}</CardTitle>
                  {page.isPublished && <Badge>Publié</Badge>}
                </CardHeader>
                <CardContent>
                  <Link href={`/page-builder/edit/${page.id}`}>
                    <Button>Éditer</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button>Utiliser</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
