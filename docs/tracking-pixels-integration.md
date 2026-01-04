# 📊 Intégration Pixels de Tracking - CRM Immobilier

## 🎯 Vue d'Ensemble

Ce module permet d'intégrer et de gérer facilement tous les pixels de tracking marketing (Meta, Google, TikTok, LinkedIn, etc.) avec une interface simplifiée et un assistant IA pour la configuration automatique.

### Architecture Choisie : **Hybride GTM + Server-Side + AI Assistant**

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                        │
│  GTM Client Container → DataLayer Events                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│              GTM SERVER-SIDE CONTAINER                       │
│   [Option 1: Stape.io]  OU  [Option 2: Custom Backend]      │
│   • Proxy tracking                                           │
│   • Transformation événements                                │
│   • Bypass ad-blockers                                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│          CONVERSION APIs (Backend NestJS)                    │
│   • Meta Conversion API                                      │
│   • Google Ads Enhanced Conversions                          │
│   • TikTok Events API                                        │
│   • LinkedIn Conversion API                                  │
│   • GA4 Measurement Protocol                                 │
└─────────────────────────────────────────────────────────────┘
                      ↑
                      │
┌─────────────────────┴───────────────────────────────────────┐
│              🤖 AI CONFIGURATION ASSISTANT                   │
│   • Auto-mapping événements                                  │
│   • Génération configs GTM automatique                       │
│   • Validation pixels en temps réel                          │
│   • Suggestions optimisations                                │
│   • Debugging assisté                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📍 Localisation dans l'Application

### Page : `/settings/integrations`

**Organisation avec Tabs** :
- **Tab 1** : 📧 Communications (WordPress, SMTP, Twilio, Google Calendar)
- **Tab 2** : 📊 Marketing & Tracking (Meta, Google, TikTok, LinkedIn) ⭐ **NOUVEAU**
- **Tab 3** : 🏢 Business (Portails, Signature, Paiements) - *À venir*

---

## 🎨 Plateformes Supportées

### 1. **Meta (Facebook & Instagram)**
- **Pixel côté client** : `fbq()` via GTM
- **Conversion API server-side** : Meta CAPI
- **Événements** : PageView, ViewContent, Lead, Contact, CompleteRegistration
- **Configuration requise** :
  - Pixel ID : `123456789012345`
  - Conversion API Access Token : `EAAxxxxxx...`
  - Test Event Code (optionnel) : `TEST12345`

### 2. **Google Tag Manager**
- **Container client-side** : GTM Web Container
- **Container server-side** (optionnel) : GTM Server via Stape ou Google Cloud
- **Configuration requise** :
  - Container ID : `GTM-XXXXXXX`
  - Server Container URL (si server-side) : `https://gtm-server.votredomaine.com`

### 3. **Google Analytics 4**
- **Pixel côté client** : `gtag()` via GTM
- **Measurement Protocol** : Server-side tracking
- **Configuration requise** :
  - Measurement ID : `G-XXXXXXXXXX`
  - API Secret : Pour Measurement Protocol

### 4. **Google Ads**
- **Conversion Tracking** : `gtag('conversion')` via GTM
- **Enhanced Conversions** : Server-side avec hashed email
- **Configuration requise** :
  - Conversion ID : `AW-XXXXXXXXXX`
  - Conversion Labels : Par type d'événement (Lead, Purchase, etc.)

### 5. **TikTok Pixel**
- **Pixel côté client** : `ttq()` via GTM
- **Events API** : Server-side tracking
- **Configuration requise** :
  - Pixel ID : `XXXXXXXXXXXXX`
  - Access Token : Pour Events API

### 6. **LinkedIn Insight Tag**
- **Pixel côté client** : `_linkedin_data_partner_id`
- **Conversions API** : Server-side tracking
- **Configuration requise** :
  - Partner ID : `123456`
  - Conversion IDs : Par type de conversion

### 7. **Snapchat Pixel** (Bonus)
- **Pixel côté client** : `snaptr()`
- **Conversions API** : Server-side tracking
- **Configuration requise** :
  - Pixel ID
  - Access Token

---

## 🤖 Assistant IA de Configuration

### Fonctionnalités

#### 1. **Configuration en 3 Étapes**

**Étape 1 : Sélection des plateformes**
```
🧙‍♂️ Quelles plateformes voulez-vous configurer ?
☑️ Meta (Facebook/Instagram) - Recommandé pour leads
☑️ Google (Analytics + Ads) - Essentiel pour SEO
☐ TikTok - Pour audience jeune
☐ LinkedIn - Pour B2B/luxe
```

**Étape 2 : Saisie des identifiants**
```
Collez vos identifiants :
Meta Pixel ID : [_____________]
Meta CAPI Token : [_____________]
Google GTM ID : [GTM-_______]
GA4 ID : [G-__________]

🤖 Test automatique...
✅ Meta Pixel valide
✅ GTM Container trouvé
✅ GA4 connecté
```

**Étape 3 : Configuration automatique**
```
🤖 Configuration en cours :
✅ Injection des scripts
✅ Mapping de 12 événements
✅ API Server-Side configurées
✅ Tests validés
✅ Config GTM générée

[⬇️ Télécharger config GTM.json]
```

#### 2. **Auto-Discovery des Événements**

L'IA analyse automatiquement votre code et détecte :
- Formulaires de contact
- Boutons d'appel
- Pages de propriétés
- Actions de leads
- Téléchargements de brochures

Et propose de configurer le tracking pour tous ces événements.

#### 3. **Génération Automatique Config GTM**

L'IA génère un fichier JSON complet pour GTM contenant :
- **Tags** : Un tag par plateforme (Meta, GA4, TikTok, etc.)
- **Triggers** : Déclencheurs pour chaque événement
- **Variables** : dataLayer variables
- **Folders** : Organisation par catégorie

#### 4. **Debugging Assisté**

```typescript
// Utilisateur : "Mon pixel Meta ne fonctionne pas"
// L'IA vérifie :
1. ✅ Script GTM injecté
2. ✅ DataLayer events envoyés
3. ❌ ERREUR : Pixel ID invalide
4. 🔧 SOLUTION : Corriger FACEBOOK_PIXEL_ID dans config
```

---

## 📊 Événements de Tracking

### Événements Standard Immobilier

| Événement | Description | Plateformes | Données |
|-----------|-------------|-------------|---------|
| `PageView` | Vue de page | Tous | url, title, referrer |
| `ViewContent` | Vue propriété | Meta, TikTok, GA4 | propertyId, price, type |
| `Search` | Recherche propriété | GA4, Meta | query, filters, results |
| `Lead` | Formulaire contact | Tous | propertyId, leadType |
| `Contact` | Demande contact direct | Meta, LinkedIn | phone, email (hashed) |
| `Schedule` | Prise de RDV | Meta, Google Ads | appointmentType, date |
| `CompleteRegistration` | Inscription utilisateur | Tous | method (email/google/facebook) |
| `InitiateCheckout` | Début demande financement | Meta, GA4 | propertyValue |
| `Purchase` | Signature/Vente conclue | Tous | value, propertyId, commission |
| `ViewVirtualTour` | Visite virtuelle | GA4, Meta | propertyId, duration |
| `DownloadBrochure` | Téléchargement doc | LinkedIn, Meta | propertyId, documentType |
| `ShareProperty` | Partage propriété | GA4 | propertyId, method (email/social) |

### Format dataLayer

```javascript
// Exemple : Lead via formulaire contact
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: 'Lead',
  eventCategory: 'engagement',
  eventAction: 'contact_form',
  eventLabel: 'property_inquiry',
  propertyId: '123',
  propertyType: 'villa',
  propertyPrice: 450000,
  propertyCity: 'Antibes',
  userId: 'user_abc123',
  leadScore: 85,
  source: 'organic',
  medium: 'website'
});
```

---

## 🔧 Configuration Backend

### Variables d'Environnement

Ajouter dans `/backend/.env` :

```bash
# === Meta/Facebook ===
FACEBOOK_PIXEL_ID=123456789012345
FACEBOOK_CONVERSION_API_TOKEN=EAAxxxxxxxxxxxxxx
FACEBOOK_TEST_EVENT_CODE=TEST12345

# === Google Tag Manager ===
GOOGLE_TAG_MANAGER_ID=GTM-XXXXXXX
GTM_SERVER_CONTAINER_URL=https://gtm-server.votredomaine.com

# === Google Analytics 4 ===
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=xxxxxxxxxxxxxxxxxxxx

# === Google Ads ===
GOOGLE_ADS_CONVERSION_ID=AW-XXXXXXXXXX
GOOGLE_ADS_CONVERSION_LABEL_LEAD=xxxxxxxxxxxx
GOOGLE_ADS_CONVERSION_LABEL_PURCHASE=xxxxxxxxxxxx

# === TikTok ===
TIKTOK_PIXEL_ID=XXXXXXXXXXXXX
TIKTOK_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxx

# === LinkedIn ===
LINKEDIN_PARTNER_ID=123456
LINKEDIN_CONVERSION_ID_LEAD=123456
LINKEDIN_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxx

# === Snapchat (optionnel) ===
SNAPCHAT_PIXEL_ID=xxxxxxxxxxxxxxxxxxxx
SNAPCHAT_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxx

# === Server-Side Tracking ===
USE_EXTERNAL_GTM_SERVER=true  # true = Stape/GCP, false = custom
STAPE_CONTAINER_URL=https://tag.votredomaine.com
STAPE_API_KEY=xxxxxxxxxxxxxxxxxxxx
```

### API Endpoints

#### Configuration Tracking

```
POST   /marketing-tracking/config              # Créer/update config pixel
GET    /marketing-tracking/config              # Liste toutes les configs
GET    /marketing-tracking/config/:platform    # Config d'une plateforme
DELETE /marketing-tracking/config/:platform    # Supprimer config
POST   /marketing-tracking/config/:platform/test  # Tester connexion pixel
```

**Exemple : Créer config Meta**
```json
POST /marketing-tracking/config
{
  "platform": "facebook",
  "config": {
    "pixelId": "123456789012345",
    "accessToken": "EAAxxxxxx...",
    "testEventCode": "TEST12345"
  },
  "isActive": true,
  "useServerSide": true
}
```

#### Événements Tracking

```
POST   /marketing-tracking/events             # Enregistrer événement
GET    /marketing-tracking/events             # Liste événements
GET    /marketing-tracking/events/stats       # Statistiques
POST   /public-tracking/event                 # Endpoint public (no auth)
```

**Exemple : Envoyer événement Lead**
```json
POST /marketing-tracking/events
{
  "eventName": "Lead",
  "eventType": "standard",
  "platform": "facebook",
  "data": {
    "propertyId": "123",
    "leadType": "contact_form",
    "value": 0,
    "currency": "EUR"
  },
  "url": "https://votrecrm.com/property/123",
  "referrer": "https://google.com"
}
```

#### Assistant IA

```
POST   /marketing-tracking/ai/analyze-events    # Analyser événements du site
POST   /marketing-tracking/ai/generate-config   # Générer config GTM
POST   /marketing-tracking/ai/suggest-events    # Suggérer événements à tracker
POST   /marketing-tracking/ai/debug             # Debugging assisté
```

---

## 🎨 Frontend : Interface Utilisateur

### Structure des Composants

```
frontend/
├── pages/
│   └── settings/
│       └── integrations.tsx              # Page principale avec Tabs
│
├── components/tracking/
│   ├── AIConfigWizard.tsx                # 🧙‍♂️ Assistant IA
│   ├── TrackingPixelCard.tsx             # Card générique pixel
│   ├── MetaPixelCard.tsx                 # Config Meta spécifique
│   ├── GoogleGTMCard.tsx                 # Config GTM
│   ├── GoogleAnalyticsCard.tsx           # Config GA4
│   ├── GoogleAdsCard.tsx                 # Config Google Ads
│   ├── TikTokPixelCard.tsx               # Config TikTok
│   ├── LinkedInPixelCard.tsx             # Config LinkedIn
│   ├── ServerSideConfig.tsx              # Config Stape/GTM Server
│   ├── EventMonitor.tsx                  # Monitoring temps réel
│   └── PixelTestButton.tsx               # Test de connexion
│
└── lib/tracking/
    ├── gtm-manager.ts                    # Gestionnaire GTM
    ├── tracking-manager.ts               # Gestionnaire central
    ├── event-tracker.ts                  # Tracker d'événements
    ├── types.ts                          # Types TypeScript
    └── hooks/
        └── useTracking.ts                # Hook React
```

### Composant Principal : IntegrationsPage avec Tabs

```tsx
// pages/settings/integrations.tsx

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Badge } from '@/shared/components/ui/badge';

export default function IntegrationsPage() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">⚡ Intégrations</h1>
          <p className="text-gray-600 mt-2">
            Connectez vos services externes pour automatiser votre workflow
          </p>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="communications" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="communications">
              📧 Communications
            </TabsTrigger>
            <TabsTrigger value="tracking">
              📊 Marketing & Tracking
              <Badge className="ml-2 bg-green-500">Nouveau</Badge>
            </TabsTrigger>
            <TabsTrigger value="business" disabled>
              🏢 Business
              <Badge variant="outline" className="ml-2">Bientôt</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Communications */}
          <TabsContent value="communications">
            <CommunicationsTab />
          </TabsContent>

          {/* Tab 2: Marketing & Tracking */}
          <TabsContent value="tracking">
            <TrackingTab />
          </TabsContent>

          {/* Tab 3: Business */}
          <TabsContent value="business">
            <EmptyState />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
```

### Hook useTracking

```tsx
// lib/tracking/hooks/useTracking.ts

export function useTracking() {
  const trackEvent = (eventName: string, data?: any) => {
    // Push to dataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ...data,
      timestamp: new Date().toISOString()
    });

    // Send to backend for server-side tracking
    apiClient.post('/public-tracking/event', {
      eventName,
      data,
      url: window.location.href,
      referrer: document.referrer
    });
  };

  return { trackEvent };
}

// Utilisation :
const { trackEvent } = useTracking();

trackEvent('Lead', {
  propertyId: '123',
  leadType: 'contact_form'
});
```

---

## 🌐 Server-Side Tracking

### Option 1 : Stape.io (Recommandé)

**Avantages** :
- ✅ Configuration en 5 minutes
- ✅ No-code
- ✅ Bypass ad-blockers (99%)
- ✅ RGPD compliant
- ✅ Support tous les pixels

**Configuration** :
1. Créer compte sur [stape.io](https://stape.io)
2. Créer un Server Container
3. Copier l'URL du container : `https://tag.votredomaine.com`
4. Configurer dans CRM :
   - Container URL
   - API Key (optionnel)
5. Pointer GTM client vers Stape

**Architecture** :
```
Frontend → GTM Client → Stape Server → Pixels (Meta, Google, TikTok)
                             ↓
                      Backend CRM (sync)
```

### Option 2 : GTM Server-Side Custom (Google Cloud)

**Avantages** :
- ✅ Contrôle total
- ✅ Moins cher à grande échelle
- ✅ Personnalisable

**Configuration** :
1. Créer instance App Engine / Cloud Run
2. Déployer GTM Server Container
3. Configurer domaine custom
4. Lier au GTM client

### Option 3 : Backend CRM uniquement

**Architecture** :
```
Frontend → Backend NestJS → Conversion APIs
```

Tout le tracking passe par le backend, pas de GTM server.

---

## 🧪 Tests et Validation

### Test Pixel Meta

```bash
# Via backend
POST /marketing-tracking/config/facebook/test
{
  "pixelId": "123456789012345",
  "accessToken": "EAAxxxxxx...",
  "testEventCode": "TEST12345"
}

# Réponse
{
  "success": true,
  "message": "Pixel Meta validé. Test event envoyé.",
  "testEventUrl": "https://business.facebook.com/events_manager/..."
}
```

### Monitoring Temps Réel

```tsx
// components/tracking/EventMonitor.tsx

// Affiche les derniers événements trackés
useEffect(() => {
  const socket = io('/tracking');
  socket.on('event', (event) => {
    setEvents(prev => [event, ...prev]);
  });
}, []);
```

---

## 📦 Installation & Déploiement

### 1. Backend

```bash
cd backend
npm install

# Ajouter variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés API

# Migrer la DB (si nouvelles tables)
npx prisma migrate dev

# Démarrer
npm run start:dev
```

### 2. Frontend

```bash
cd frontend
npm install

# Démarrer
npm run dev
```

### 3. Configuration Initiale

1. Aller sur `/settings/integrations`
2. Cliquer sur tab "Marketing & Tracking"
3. Cliquer sur "🤖 Assistant IA"
4. Suivre les 3 étapes de configuration
5. Télécharger le fichier GTM config
6. Importer dans Google Tag Manager
7. Publier le container GTM

---

## 🎯 Cas d'Usage : Lead Immobilier

### Scénario : Un prospect remplit le formulaire de contact

**1. Frontend déclenche l'événement**
```tsx
// pages/property/[id].tsx

const handleSubmit = async (formData) => {
  // ... envoi du formulaire

  // Tracking
  trackEvent('Lead', {
    propertyId: property.id,
    propertyType: property.type,
    propertyPrice: property.price,
    propertyCity: property.city,
    leadType: 'contact_form',
    value: 0,
    currency: 'EUR'
  });
};
```

**2. Event → dataLayer → GTM**
```javascript
window.dataLayer.push({
  event: 'Lead',
  propertyId: '123',
  propertyType: 'villa',
  propertyPrice: 450000,
  leadType: 'contact_form'
});
```

**3. GTM dispatche vers tous les pixels**
- Meta : `fbq('track', 'Lead', {...})`
- GA4 : `gtag('event', 'generate_lead', {...})`
- TikTok : `ttq.track('SubmitForm', {...})`
- LinkedIn : Conversion tracking

**4. Backend envoie server-side**
```typescript
// Conversion API Meta
await metaConversionAPI.sendEvent({
  event_name: 'Lead',
  event_time: Math.floor(Date.now() / 1000),
  user_data: {
    em: hash(email), // Email hashé
    ph: hash(phone), // Phone hashé
    client_ip_address: req.ip,
    client_user_agent: req.headers['user-agent']
  },
  custom_data: {
    property_id: '123',
    property_type: 'villa',
    value: 0,
    currency: 'EUR'
  }
});
```

**5. Résultat**
- ✅ Lead tracké sur tous les pixels
- ✅ Données enrichies en backend (ML score)
- ✅ Attribution multi-touch calculée
- ✅ AI suggère relance automatique

---

## 🔒 RGPD & Consentement

### Gestion des Cookies

**À implémenter** (future) :
```tsx
// components/CookieConsent.tsx

const CookieConsent = () => {
  const [consent, setConsent] = useState({
    necessary: true,   // Toujours actif
    analytics: false,  // GA4
    marketing: false   // Meta, TikTok, LinkedIn
  });

  useEffect(() => {
    if (consent.marketing) {
      // Activer pixels marketing
      enableMetaPixel();
      enableTikTokPixel();
    }
    if (consent.analytics) {
      // Activer GA4
      enableGA4();
    }
  }, [consent]);
};
```

### Anonymisation Server-Side

Toutes les données envoyées server-side sont :
- **Email** : Hashé (SHA256)
- **Téléphone** : Hashé (SHA256)
- **IP** : Anonymisée (dernier octet retiré)

---

## 📈 Métriques & KPIs

### Dashboard Analytics (future)

**Métriques Immobilier** :
- Taux de conversion visiteur → lead
- Coût par lead (CPL) par plateforme
- ROI par source de trafic
- Propriétés les plus vues
- Temps moyen avant conversion
- Score de lead (ML)
- Attribution multi-touch

**Exemple** :
```
Meta Ads → 145 leads → 12 ventes → ROI 340%
Google Ads → 89 leads → 8 ventes → ROI 280%
Organic → 234 leads → 18 ventes → ROI ∞
```

---

## 🚀 Roadmap

### Phase 1 : Core (Actuel)
- ✅ Configuration pixels via UI
- ✅ Assistant IA
- ✅ GTM + Server-side
- ✅ API conversions

### Phase 2 : Avancé
- [ ] Cookie consent RGPD
- [ ] Dashboard analytics temps réel
- [ ] A/B testing intégré
- [ ] Audiences personnalisées auto

### Phase 3 : Intelligence
- [ ] AI optimise budgets automatiquement
- [ ] Prédiction conversion par source
- [ ] Attribution ML avancée
- [ ] Auto-bidding intelligent

---

## 📚 Ressources

### Documentation Officielle
- [Meta Conversion API](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [Google Tag Manager](https://developers.google.com/tag-platform/tag-manager)
- [GA4 Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [TikTok Events API](https://ads.tiktok.com/marketing_api/docs?id=1701890979375106)
- [LinkedIn Conversion Tracking](https://learn.microsoft.com/en-us/linkedin/marketing/integrations/ads/advertising-tracking/conversion-tracking)
- [Stape.io Documentation](https://stape.io/docs)

### Outils de Test
- [Meta Pixel Helper](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
- [Google Tag Assistant](https://tagassistant.google.com/)
- [GTM Preview Mode](https://tagmanager.google.com/)

---

## 💡 Support

Pour toute question ou problème :
1. Utiliser l'Assistant IA intégré (debugging automatique)
2. Consulter les logs : `/marketing-tracking/events?filter=error`
3. Tester la connexion : Bouton "Tester" sur chaque pixel

---

**Document créé le** : 2026-01-04
**Version** : 1.0.0
**Auteur** : CRM Immobilier Team
