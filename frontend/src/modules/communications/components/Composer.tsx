import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import communicationsService, { SendEmailDto, SendSmsDto } from '../communications.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Loader2, Send, FileText, Sparkles } from 'lucide-react';
import { useToast } from '@/shared/components/ui/use-toast';
import { TemplateSelector } from './TemplateSelector';

const emailSchema = z.object({
  to: z.string().email('Email invalide'),
  subject: z.string().min(1, 'Sujet requis'),
  body: z.string().min(1, 'Message requis'),
});

const smsSchema = z.object({
  to: z.string().min(8, 'Numéro invalide'),
  message: z.string().min(1, 'Message requis'),
});

interface ComposerProps {
  onSent: () => void;
  prospectId?: string;
  propertyId?: string;
}

export function Composer({ onSent, prospectId, propertyId }: ComposerProps) {
  const [activeTab, setActiveTab] = useState('email');
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const { toast } = useToast();

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
  });

  const smsForm = useForm<z.infer<typeof smsSchema>>({
    resolver: zodResolver(smsSchema),
  });

  const onSendEmail = async (data: z.infer<typeof emailSchema>) => {
    try {
      setSending(true);
      await communicationsService.sendEmail({
        ...data,
        prospectId,
        propertyId,
      } as SendEmailDto);
      toast({ title: 'Email envoyé', description: `Envoyé à ${data.to}` });
      emailForm.reset();
      onSent();
    } catch (error) {
      toast({ title: 'Erreur', description: "L'envoi a échoué", variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const onSendSms = async (data: z.infer<typeof smsSchema>) => {
    try {
      setSending(true);
      await communicationsService.sendSms({
        ...data,
        prospectId,
        propertyId,
      } as SendSmsDto);
      toast({ title: 'SMS envoyé', description: `Envoyé à ${data.to}` });
      smsForm.reset();
      onSent();
    } catch (error) {
      toast({ title: 'Erreur', description: "L'envoi a échoué", variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleTemplateSelect = (data: { subject?: string; body: string }) => {
    if (activeTab === 'email') {
      if (data.subject) {
        emailForm.setValue('subject', data.subject);
      }
      emailForm.setValue('body', data.body);
    } else {
      smsForm.setValue('message', data.body);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Nouveau Message</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAIAssistant(true)}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4 text-purple-600" />
              Assistant IA
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="sms">SMS / WhatsApp</TabsTrigger>
            </TabsList>



            <TabsContent value="email">
              <div className="mb-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTemplateSelectorOpen(true)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Choisir un template
                </Button>
              </div>
              <form onSubmit={emailForm.handleSubmit(onSendEmail)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Destinataire</Label>
                  <Input placeholder="client@exemple.com" {...emailForm.register('to')} />
                  {emailForm.formState.errors.to && (
                    <p className="text-xs text-red-500">{emailForm.formState.errors.to.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Sujet</Label>
                  <Input placeholder="Sujet du message" {...emailForm.register('subject')} />
                  {emailForm.formState.errors.subject && (
                    <p className="text-xs text-red-500">
                      {emailForm.formState.errors.subject.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Votre message..."
                    className="min-h-[150px]"
                    {...emailForm.register('body')}
                  />
                  {emailForm.formState.errors.body && (
                    <p className="text-xs text-red-500">{emailForm.formState.errors.body.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={sending}>
                  {sending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Envoyer Email
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="sms">
              <div className="mb-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTemplateSelectorOpen(true)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Choisir un template
                </Button>
              </div>
              <form onSubmit={smsForm.handleSubmit(onSendSms)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Numéro de téléphone</Label>
                  <Input placeholder="+33 6 12 34 56 78" {...smsForm.register('to')} />
                  {smsForm.formState.errors.to && (
                    <p className="text-xs text-red-500">{smsForm.formState.errors.to.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Votre SMS..."
                    className="min-h-[100px]"
                    {...smsForm.register('message')}
                  />
                  {smsForm.formState.errors.message && (
                    <p className="text-xs text-red-500">{smsForm.formState.errors.message.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={sending}>
                  {sending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Envoyer SMS
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>

        <TemplateSelector
          type={activeTab === 'email' ? 'email' : 'sms'}
          onSelect={handleTemplateSelect}
          isOpen={isTemplateSelectorOpen}
          onClose={() => setIsTemplateSelectorOpen(false)}
        />
      </Card>
    </>
  );
}
