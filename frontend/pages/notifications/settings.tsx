import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Bell, Mail, MessageSquare, Smartphone, Clock, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/shared/components/ui/use-toast';
import axios from 'axios';

interface NotificationSettings {
  preferredChannel: string;
  optimalTimingEnabled: boolean;
  preferredHours: number[];
  enablePush: boolean;
  enableEmail: boolean;
  enableSMS: boolean;
  enableWhatsApp: boolean;
  frequency: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

const NotificationSettingsPage: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    preferredChannel: 'push',
    optimalTimingEnabled: true,
    preferredHours: [9, 10, 11, 14, 15, 16],
    enablePush: true,
    enableEmail: true,
    enableSMS: false,
    enableWhatsApp: false,
    frequency: 'normal',
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    }
    return null;
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await axios.get('/api/notifications/settings', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const token = getAuthToken();
      await axios.post('/api/notifications/settings', settings, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      toast({
        title: 'Paramètres sauvegardés',
        description: 'Vos préférences de notifications ont été mises à jour.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les paramètres.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChannelToggle = (channel: string, enabled: boolean) => {
    const key = `enable${channel.charAt(0).toUpperCase() + channel.slice(1)}` as keyof NotificationSettings;
    setSettings((prev) => ({
      ...prev,
      [key]: enabled,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Paramètres des Notifications</h1>
            <p className="text-gray-600 mt-2">Personnalisez vos préférences de notification intelligentes</p>
          </div>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sauvegarde...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Notifications Intelligentes Activées</h3>
            <p className="text-sm text-blue-700 mt-1">
              L'IA analyse votre comportement pour déterminer le meilleur moment et canal pour vous notifier.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Canal de Notification Préféré</CardTitle>
            <CardDescription>
              Sélectionnez votre canal de communication préféré pour les notifications importantes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Label>Canal préféré</Label>
              <Select
                value={settings.preferredChannel}
                onValueChange={(value) => setSettings({ ...settings, preferredChannel: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionnez un canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="push">
                    <div className="flex items-center">
                      <Bell className="h-4 w-4 mr-2" />
                      Push Notification
                    </div>
                  </SelectItem>
                  <SelectItem value="email">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </div>
                  </SelectItem>
                  <SelectItem value="sms">
                    <div className="flex items-center">
                      <Smartphone className="h-4 w-4 mr-2" />
                      SMS
                    </div>
                  </SelectItem>
                  <SelectItem value="whatsapp">
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      WhatsApp
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Canaux Activés</CardTitle>
            <CardDescription>Choisissez les canaux sur lesquels vous souhaitez recevoir des notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-gray-600" />
                <div>
                  <Label>Notifications Push</Label>
                  <p className="text-sm text-gray-500">Notifications dans le navigateur</p>
                </div>
              </div>
              <Switch
                checked={settings.enablePush}
                onCheckedChange={(checked) => handleChannelToggle('push', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-600" />
                <div>
                  <Label>Email</Label>
                  <p className="text-sm text-gray-500">Notifications par email</p>
                </div>
              </div>
              <Switch
                checked={settings.enableEmail}
                onCheckedChange={(checked) => handleChannelToggle('email', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Smartphone className="h-5 w-5 text-gray-600" />
                <div>
                  <Label>SMS</Label>
                  <p className="text-sm text-gray-500">Notifications par SMS</p>
                </div>
              </div>
              <Switch
                checked={settings.enableSMS}
                onCheckedChange={(checked) => handleChannelToggle('sms', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-5 w-5 text-gray-600" />
                <div>
                  <Label>WhatsApp</Label>
                  <p className="text-sm text-gray-500">Notifications sur WhatsApp</p>
                </div>
              </div>
              <Switch
                checked={settings.enableWhatsApp}
                onCheckedChange={(checked) => handleChannelToggle('whatsApp', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Timing Optimal (IA)
            </CardTitle>
            <CardDescription>
              L'IA détermine le meilleur moment pour vous envoyer des notifications en fonction de votre activité
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Activer le timing optimal</Label>
                <p className="text-sm text-gray-500">Les notifications seront envoyées aux heures où vous êtes le plus actif</p>
              </div>
              <Switch
                checked={settings.optimalTimingEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, optimalTimingEnabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fréquence des Notifications</CardTitle>
            <CardDescription>Contrôlez le nombre de notifications que vous recevez</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Label>Fréquence</Label>
              <Select
                value={settings.frequency}
                onValueChange={(value) => setSettings({ ...settings, frequency: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionnez une fréquence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Élevée - Toutes les notifications</SelectItem>
                  <SelectItem value="normal">Normale - Notifications importantes</SelectItem>
                  <SelectItem value="low">Faible - Notifications critiques uniquement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Heures de Silence</CardTitle>
            <CardDescription>Désactivez les notifications pendant certaines heures</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label>Activer les heures de silence</Label>
                <p className="text-sm text-gray-500">Aucune notification ne sera envoyée pendant cette période</p>
              </div>
              <Switch
                checked={settings.quietHoursEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, quietHoursEnabled: checked })}
              />
            </div>

            {settings.quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <Label>Début</Label>
                  <input
                    type="time"
                    value={settings.quietHoursStart}
                    onChange={(e) => setSettings({ ...settings, quietHoursStart: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <Label>Fin</Label>
                  <input
                    type="time"
                    value={settings.quietHoursEnd}
                    onChange={(e) => setSettings({ ...settings, quietHoursEnd: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;
