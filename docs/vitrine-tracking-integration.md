# Intégration des Pixels de Tracking avec les Pages Vitrines

## 📋 Vue d'ensemble

Ce guide explique comment les pixels de tracking (Meta Pixel, Google Analytics, TikTok, LinkedIn, etc.) sont automatiquement synchronisés avec les pages vitrines publiques de chaque agence.

## 🎯 Fonctionnalité

Chaque agence qui configure ses pixels de tracking dans `/settings/integrations` verra **automatiquement** ces pixels injectés dans toutes ses pages vitrines publiques, sans aucune manipulation manuelle.

### Pixels supportés

- ✅ Meta Pixel (Facebook/Instagram)
- ✅ Google Tag Manager (GTM)
- ✅ Google Analytics 4 (GA4)
- ✅ Google Ads Conversion
- ✅ TikTok Pixel
- ✅ LinkedIn Insight Tag
- ✅ Snapchat Pixel

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CRM Admin Panel                          │
│  /settings/integrations - Configuration des pixels          │
│  (Meta Pixel, GTM, GA4, TikTok, LinkedIn, etc.)            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Configuration sauvegardée en DB
                       │ (table: TrackingConfig)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          VitrineTrackingService (Backend)                    │
│  - Génère script JS d'injection dynamique                   │
│  - Initialise tous les pixels configurés                    │
│  - Expose API publique pour tracking                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ GET /api/vitrine/tracking-script/:userId
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│            Pages Vitrines Publiques                          │
│  /vitrine/public/[agencyId]                                 │
│  - TrackingPixelsLoader charge le script                    │
│  - Tracking automatique PageView, PropertyView, Lead, etc.  │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Composants Backend

### 1. VitrineTrackingService

**Fichier**: `/backend/src/modules/public/vitrine/services/vitrine-tracking.service.ts`

**Responsabilités**:
- Générer le script JavaScript d'injection des pixels pour chaque agence
- Récupérer les configurations actives depuis `TrackingConfig`
- Créer le code d'initialisation pour chaque plateforme
- Tracker les événements vitrines dans la DB

**Méthodes principales**:

```typescript
// Générer le script complet avec tous les pixels
async generateTrackingScript(userId: string): Promise<string>

// Tracker un événement vitrine
async trackVitrineEvent(userId: string, eventName: string, eventData: any)

// Obtenir les stats de tracking vitrine
async getVitrineTrackingStats(userId: string, period: 'day' | 'week' | 'month')
```

### 2. Endpoints API

**Route publique** (pas d'authentification):
```
GET /api/vitrine/tracking-script/:userId
```
Retourne le script JavaScript prêt à être injecté.

**Exemple de réponse**:
```javascript
// === CRM Immobilier - Tracking Pixels Auto-Injection ===
(function() {
  'use strict';

  // Meta Pixel
  !function(f,b,e,v,n,t,s){...}
  fbq('init', '123456789012345');

  // Google Tag Manager
  (function(w,d,s,l,i){...})

  // GA4
  gtag('config', 'G-XXXXXXXXXX');

  // Fonctions utilitaires
  window.CRMTracking.trackEvent = function(eventName, eventData) {...}
  window.CRMTracking.trackPropertyView = function(propertyId, propertyData) {...}
  window.CRMTracking.trackLead = function(formData) {...}
})();
```

**Route publique pour tracker les événements**:
```
POST /api/vitrine/track-event
Body: {
  userId: string,
  eventName: string,
  eventData: object,
  sessionId?: string
}
```

**Route privée** (authentifiée):
```
GET /api/vitrine/tracking-stats?period=week
```
Retourne les statistiques de tracking pour l'agence connectée.

## 🎨 Composants Frontend

### 1. TrackingPixelsLoader

**Fichier**: `/frontend/src/shared/components/vitrine/TrackingPixelsLoader.tsx`

Composant React qui charge automatiquement le script de tracking.

**Usage basique**:
```tsx
import { TrackingPixelsLoader } from '@/shared/components/vitrine/TrackingPixelsLoader';

export default function PublicVitrinePage({ agencyId }) {
  return (
    <>
      <TrackingPixelsLoader agencyId={agencyId} />

      {/* Contenu de la page */}
    </>
  );
}
```

**Props**:
- `agencyId` (string, required): ID de l'agence (userId)
- `loadInDev` (boolean, optional): Charger les pixels en mode dev (défaut: false)

### 2. Hook useVitrineTracking

Hook React pour tracker des événements personnalisés.

**Usage**:
```tsx
import { useVitrineTracking } from '@/shared/components/vitrine/TrackingPixelsLoader';

export default function PropertyDetailPage({ property }) {
  const { trackPropertyView, trackLead } = useVitrineTracking();

  useEffect(() => {
    // Tracker automatiquement la vue de la propriété
    trackPropertyView(property.id, {
      title: property.title,
      price: property.price,
      currency: property.currency,
      type: property.type,
      city: property.city
    });
  }, [property]);

  const handleContactForm = (formData) => {
    // Tracker la soumission du formulaire de contact
    trackLead({
      propertyId: property.id,
      email: formData.email,
      phone: formData.phone,
      message: formData.message
    });
  };

  return (
    <div>
      {/* Contenu */}
    </div>
  );
}
```

**Fonctions disponibles**:

```typescript
// Tracker un événement personnalisé
trackEvent(eventName: string, eventData?: object)

// Tracker une vue de propriété
trackPropertyView(propertyId: string, propertyData: {
  title: string,
  price: number,
  currency: string,
  type?: string,
  city?: string
})

// Tracker un lead (formulaire de contact)
trackLead(formData: {
  email?: string,
  phone?: string,
  message?: string,
  propertyId?: string
})

// Tracker une recherche
trackSearch(searchParams: {
  type?: string,
  city?: string,
  priceMin?: number,
  priceMax?: number
})
```

## 📊 Événements Trackés Automatiquement

### 1. PageView
Tracké automatiquement au chargement de chaque page vitrine.

**Données**:
```javascript
{
  page_url: window.location.href,
  page_title: document.title,
  referrer: document.referrer
}
```

### 2. ViewContent (Vue de propriété)
Tracké quand un utilisateur consulte une propriété.

**Données**:
```javascript
{
  content_type: 'property',
  content_ids: ['property-id-123'],
  content_name: 'Villa avec piscine',
  value: 500000,
  currency: 'TND'
}
```

### 3. Lead (Formulaire de contact)
Tracké lors de la soumission d'un formulaire de contact.

**Données**:
```javascript
{
  content_name: 'Contact Form',
  email: 'client@example.com',
  phone: '+216XXXXXXXX',
  propertyId: 'property-id-123'
}
```

### 4. Search (Recherche de biens)
Tracké quand un utilisateur recherche des biens.

**Données**:
```javascript
{
  search_string: '{"type":"villa","city":"Tunis","priceMax":1000000}'
}
```

## 🚀 Guide d'Intégration

### Étape 1: Configurer les pixels dans le CRM

1. Aller dans `/settings/integrations`
2. Cliquer sur l'onglet **"Marketing & Tracking"**
3. Activer et configurer les pixels souhaités (Meta, GTM, GA4, etc.)
4. Sauvegarder

### Étape 2: Les pixels sont automatiquement injectés

Aucune action supplémentaire nécessaire ! Les pixels configurés seront automatiquement chargés sur toutes les pages vitrines de l'agence.

### Étape 3: Vérifier le tracking

1. Ouvrir la page vitrine publique: `/vitrine/public/[userId]`
2. Ouvrir la console développeur (F12)
3. Vérifier les logs:
   ```
   [CRM Tracking] Meta Pixel initialized: 123456789012345
   [CRM Tracking] GTM initialized: GTM-XXXXXXX
   [CRM Tracking] GA4 initialized: G-XXXXXXXXXX
   [CRM Tracking] Event: PageView {...}
   ```

### Étape 4: Consulter les statistiques

1. Aller dans `/vitrine/tracking-stats` (ou via l'API)
2. Voir les métriques:
   - Total des événements
   - Page views
   - Vues de propriétés
   - Leads générés
   - Taux de conversion

## 📱 Exemple Complet : Page Détail Propriété

```tsx
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { TrackingPixelsLoader, useVitrineTracking } from '@/shared/components/vitrine/TrackingPixelsLoader';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';

export default function PropertyDetailPage() {
  const router = useRouter();
  const { agencyId, propertyId } = router.query;
  const { trackPropertyView, trackLead } = useVitrineTracking();

  const [property, setProperty] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);

  useEffect(() => {
    // Charger la propriété
    loadProperty(propertyId);
  }, [propertyId]);

  useEffect(() => {
    if (property) {
      // Tracker automatiquement la vue
      trackPropertyView(property.id, {
        title: property.title,
        price: property.price,
        currency: 'TND',
        type: property.type,
        city: property.city
      });
    }
  }, [property]);

  const handleContactSubmit = async (formData) => {
    // Envoyer le formulaire
    await api.post('/contact', formData);

    // Tracker le lead
    trackLead({
      propertyId: property.id,
      email: formData.email,
      phone: formData.phone,
      message: formData.message
    });

    alert('Message envoyé !');
  };

  return (
    <>
      {/* Charger les pixels de tracking */}
      <TrackingPixelsLoader agencyId={agencyId as string} />

      <div className="container mx-auto py-8">
        <h1>{property?.title}</h1>
        <p className="text-3xl font-bold">{property?.price} TND</p>

        <Button onClick={() => setShowContactForm(true)}>
          Contacter l'agence
        </Button>

        {showContactForm && (
          <Card>
            <form onSubmit={handleContactSubmit}>
              <input name="email" placeholder="Email" required />
              <input name="phone" placeholder="Téléphone" />
              <textarea name="message" placeholder="Message" />
              <button type="submit">Envoyer</button>
            </form>
          </Card>
        )}
      </div>
    </>
  );
}
```

## 🔍 Debugging

### Vérifier si les pixels sont chargés

```javascript
// Console développeur
console.log(window.CRMTracking);

// Devrait afficher:
{
  userId: "user-id-123",
  configs: [...],
  ready: true,
  events: [...],
  trackEvent: function() {...},
  trackPropertyView: function() {...},
  trackLead: function() {...},
  trackSearch: function() {...}
}
```

### Vérifier les événements trackés

```javascript
// Console développeur
window.CRMTracking.events

// Devrait afficher un tableau d'événements:
[
  { name: 'PageView', data: {...}, timestamp: '2025-01-04T...' },
  { name: 'ViewContent', data: {...}, timestamp: '2025-01-04T...' },
  { name: 'Lead', data: {...}, timestamp: '2025-01-04T...' }
]
```

### Logs détaillés

Tous les événements sont loggés dans la console avec le préfixe `[CRM Tracking]`:

```
[CRM Tracking] Meta Pixel initialized: 123456789012345
[CRM Tracking] GTM initialized: GTM-XXXXXXX
[CRM Tracking] Event: PageView {page_url: "...", ...}
[CRM Tracking] Event: ViewContent {content_ids: ["property-123"], ...}
```

## 🎯 Bonnes Pratiques

### 1. Désactiver en développement

Par défaut, les pixels ne se chargent pas en mode développement. Pour les activer:

```tsx
<TrackingPixelsLoader agencyId={userId} loadInDev={true} />
```

### 2. Tester avec les outils officiels

- **Meta Pixel Helper**: Extension Chrome pour vérifier Meta Pixel
- **Google Tag Assistant**: Extension Chrome pour GTM et GA4
- **TikTok Pixel Helper**: Extension Chrome pour TikTok

### 3. Utiliser les Test Event Codes

En phase de test, utiliser les codes de test dans la configuration:

- Meta: `TEST12345` (dans Facebook Events Manager)
- TikTok: Test Mode activé dans TikTok Events Manager

### 4. Vérifier les conversions

Après configuration, vérifier dans chaque plateforme:

- Facebook Events Manager → Test Events
- Google Analytics → Realtime → Events
- TikTok Events Manager → Test Mode
- LinkedIn Campaign Manager → Insight Tag Dashboard

## 🔒 Sécurité & RGPD

### Conformité RGPD

**Important**: Cette implémentation injecte automatiquement les pixels. Pour être conforme RGPD, il est recommandé d'ajouter:

1. **Banner de consentement cookies** (à venir)
2. **Blocage conditionnel** des pixels selon le consentement
3. **Politique de confidentialité** claire

### Données collectées

Les événements trackés peuvent contenir:
- URL de la page
- Titre de la page
- Propriété consultée (ID, prix, ville)
- Email/téléphone (uniquement si soumis dans formulaire)
- User Agent, IP (côté backend)

Ces données sont **hashées** (SHA256) avant envoi aux Conversion APIs pour respecter la vie privée.

## 📈 Statistiques disponibles

Via l'endpoint `/api/vitrine/tracking-stats?period=week`:

```json
{
  "period": "week",
  "totalEvents": 1247,
  "pageViews": 856,
  "propertyViews": 312,
  "leads": 24,
  "searches": 55,
  "conversionRate": "2.80",
  "events": [...]
}
```

## 🚀 Prochaines améliorations

- [ ] Cookie consent banner RGPD
- [ ] WebSocket pour tracking temps réel
- [ ] A/B testing des pixels
- [ ] Heatmaps des pages vitrines
- [ ] Enregistrement des sessions utilisateurs
- [ ] Attribution multi-touch vitrines

## 📞 Support

Pour toute question ou problème:
1. Vérifier les logs console avec `[CRM Tracking]`
2. Tester avec les outils officiels des plateformes
3. Consulter les endpoints API pour les statistiques
4. Ouvrir une issue sur GitHub

---

**Dernière mise à jour**: 2025-01-04
**Version**: 1.0.0
