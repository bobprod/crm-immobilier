# Email AI Auto-Response - Frontend Documentation

## 📋 Vue d'ensemble

Interface utilisateur complète pour le module Email AI Auto-Response, permettant la gestion intelligente des réponses automatiques aux emails avec validation humaine.

## 📁 Structure des fichiers

```
frontend/src/
├── modules/communications/email-ai-response/
│   ├── EmailAIResponseDashboard.tsx    # Dashboard principal
│   ├── EmailDraftReview.tsx            # Révision des brouillons
│   ├── EmailAnalyzer.tsx               # Analyseur d'emails
│   └── index.ts                        # Exports
├── pages/
│   └── email-ai-response.tsx           # Page dédiée
└── shared/utils/
    └── quick-wins-api.ts               # API client (mis à jour)
```

## 🎨 Composants

### 1. EmailAIResponseDashboard

**Composant principal** affichant les statistiques et la liste des brouillons.

**Props:**
```typescript
interface EmailAIResponseDashboardProps {
  onDraftSelect?: (draft: EmailDraft) => void;
}
```

**Fonctionnalités:**
- 📊 4 cartes de statistiques (analysés, générés, envoyés, temps réponse)
- 📈 Distribution des intentions (5 types)
- 🔖 Filtres par statut (pending, sent, all)
- 📝 Liste des brouillons avec statut et métadonnées
- 🔄 Actualisation automatique

**Utilisation:**
```tsx
import { EmailAIResponseDashboard } from '../modules/communications/email-ai-response';

<EmailAIResponseDashboard 
  onDraftSelect={(draft) => console.log(draft)}
/>
```

### 2. EmailDraftReview

**Modal de révision** pour éditer et envoyer les brouillons.

**Props:**
```typescript
interface EmailDraftReviewProps {
  draft: EmailDraft;
  onClose: () => void;
  onSent: () => void;
}
```

**Fonctionnalités:**
- ✏️ Édition du sujet et du corps
- 📎 Suggestions de pièces jointes
- ✅ Validation avant envoi
- 🔄 États de chargement et succès
- ❌ Gestion des erreurs

**Utilisation:**
```tsx
import { EmailDraftReview } from '../modules/communications/email-ai-response';

{selectedDraft && (
  <EmailDraftReview
    draft={selectedDraft}
    onClose={() => setSelectedDraft(null)}
    onSent={() => window.location.reload()}
  />
)}
```

### 3. EmailAnalyzer

**Formulaire d'analyse** pour tester l'analyse d'emails et générer des réponses.

**Props:**
```typescript
interface EmailAnalyzerProps {
  onDraftGenerated?: (draft: EmailDraft) => void;
}
```

**Fonctionnalités:**
- 📧 Formulaire d'entrée (from, subject, body)
- 🤖 Analyse d'intention avec confiance
- 🔑 Extraction de mots-clés
- 💡 Actions suggérées
- ✍️ Génération de brouillon

**Utilisation:**
```tsx
import { EmailAnalyzer } from '../modules/communications/email-ai-response';

<EmailAnalyzer 
  onDraftGenerated={(draft) => setSelectedDraft(draft)}
/>
```

## 📊 Types TypeScript

### EmailAnalysisResult
```typescript
interface EmailAnalysisResult {
  analysisId: string;
  intent: 'information' | 'appointment' | 'negotiation' | 'complaint' | 'other';
  confidence: number;
  keywords: string[];
  suggestedActions: string[];
  context?: {
    prospectName?: string;
    prospectEmail?: string;
    prospectBudget?: number;
    propertyTitle?: string;
    propertyPrice?: number;
  };
  property?: {
    id: string;
    title: string;
    price: number;
  };
}
```

### EmailDraft
```typescript
interface EmailDraft {
  draftId: string;
  analysisId: string;
  to: string;
  subject: string;
  body: string;
  attachmentSuggestions: string[];
  status: 'pending' | 'approved' | 'rejected' | 'sent';
  createdAt: string;
}
```

### EmailAIStats
```typescript
interface EmailAIStats {
  totalAnalyzed: number;
  totalDraftsGenerated: number;
  totalSent: number;
  avgResponseTime: number;
  intentDistribution: {
    information: number;
    appointment: number;
    negotiation: number;
    complaint: number;
    other: number;
  };
}
```

## 🌐 API Client

Nouvelles méthodes ajoutées à `quick-wins-api.ts`:

```typescript
import { emailAIResponseApi } from '../shared/utils/quick-wins-api';

// Analyser un email
const analysis = await emailAIResponseApi.analyzeEmail({
  from: 'client@example.com',
  subject: 'Intéressé par l\'appartement',
  body: 'Bonjour, je voudrais plus d\'infos...',
});

// Générer un brouillon
const draft = await emailAIResponseApi.generateDraft({
  analysisId: analysis.analysisId,
  additionalInstructions: 'Mentionner la disponibilité',
  tone: 'professional',
});

// Approuver et envoyer
const result = await emailAIResponseApi.approveAndSend({
  draftId: draft.draftId,
  subject: 'RE: Appartement',
  body: '<p>Bonjour...</p>',
});

// Récupérer les brouillons
const drafts = await emailAIResponseApi.getDrafts('pending');

// Historique
const history = await emailAIResponseApi.getHistory(10);

// Statistiques
const stats = await emailAIResponseApi.getStats();
```

## 🎯 Workflow utilisateur

### 1. Réception d'un email
```
Email entrant → Analyse automatique → Génération brouillon → Notification utilisateur
```

### 2. Révision et envoi
```
Dashboard → Sélection brouillon → Révision/Édition → Validation → Envoi → Historique
```

### 3. Analyse manuelle
```
Bouton "Analyser" → Formulaire → Analyse IA → Résultats → Génération brouillon → Envoi
```

## 🎨 Design & UI/UX

### Couleurs des intentions
- **Information** 🔵 : `bg-blue-100 text-blue-800`
- **Rendez-vous** 🟢 : `bg-green-100 text-green-800`
- **Négociation** 🟡 : `bg-yellow-100 text-yellow-800`
- **Réclamation** 🔴 : `bg-red-100 text-red-800`
- **Autre** ⚪ : `bg-gray-100 text-gray-800`

### États des brouillons
- **Pending** 🟡 : Badge jaune avec horloge
- **Approved** 🔵 : Badge bleu avec checkmark
- **Sent** 🟢 : Badge vert avec checkmark

### Icônes (lucide-react)
- Mail, Send, Clock, CheckCircle, AlertCircle
- Info, Calendar, DollarSign, MessageSquare
- FileText, Edit2, Sparkles, Zap

## 📱 Responsive Design

- **Desktop** (lg+) : 4 colonnes stats, grille complète
- **Tablet** (md) : 2 colonnes stats, layout adapté
- **Mobile** (sm) : 1 colonne, navigation simplifiée

## 🔄 États de chargement

### Loading states
```tsx
{loading && (
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
)}
```

### Success states
```tsx
{success && (
  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
    <CheckCircle className="w-5 h-5 text-green-600" />
    <p>Email envoyé avec succès !</p>
  </div>
)}
```

### Error states
```tsx
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <AlertCircle className="w-5 h-5 text-red-600" />
    <p>{error}</p>
  </div>
)}
```

## 🧪 Tests

### Tests unitaires recommandés
```typescript
// EmailAIResponseDashboard.test.tsx
describe('EmailAIResponseDashboard', () => {
  it('renders stats correctly', () => {});
  it('filters drafts by status', () => {});
  it('calls onDraftSelect when draft clicked', () => {});
});

// EmailDraftReview.test.tsx
describe('EmailDraftReview', () => {
  it('allows editing subject and body', () => {});
  it('validates required fields', () => {});
  it('sends email on approve', () => {});
});

// EmailAnalyzer.test.tsx
describe('EmailAnalyzer', () => {
  it('analyzes email and shows results', () => {});
  it('generates draft from analysis', () => {});
  it('displays intent with correct color', () => {});
});
```

### Tests E2E Playwright
```typescript
// email-ai-response.spec.ts
test('should display dashboard with stats', async ({ page }) => {
  await page.goto('/email-ai-response');
  await expect(page.getByText('Email AI Auto-Response')).toBeVisible();
  await expect(page.getByText('Emails analysés')).toBeVisible();
});

test('should open and close draft review modal', async ({ page }) => {
  await page.goto('/email-ai-response');
  await page.click('button:has-text("Réviser")');
  await expect(page.getByText('Réviser le brouillon')).toBeVisible();
  await page.click('button:has-text("Annuler")');
});

test('should analyze email and generate draft', async ({ page }) => {
  await page.goto('/email-ai-response');
  await page.click('button:has-text("Analyser un email")');
  await page.fill('input[placeholder*="client@example.com"]', 'test@example.com');
  await page.fill('input[placeholder*="Demande"]', 'Test subject');
  await page.fill('textarea', 'Test body');
  await page.click('button:has-text("Analyser l\'email")');
  await expect(page.getByText('Résultat de l\'analyse')).toBeVisible();
});
```

## 🚀 Déploiement

### Build
```bash
cd frontend
npm run build
```

### Variables d'environnement
```env
NEXT_PUBLIC_API_URL=https://api.votre-domaine.com
```

### Navigation
Ajouter au menu principal:
```tsx
<Link href="/email-ai-response">
  <Mail className="w-5 h-5" />
  Email AI
</Link>
```

## 📊 Métriques & Monitoring

### Analytics à tracker
- Nombre de brouillons générés
- Taux d'approbation (approved/generated)
- Taux d'envoi (sent/approved)
- Temps moyen de révision
- Distribution des intentions
- Taux de satisfaction utilisateur

### KPIs
- **Adoption** : % utilisateurs actifs
- **Efficacité** : Temps gagné par email
- **Qualité** : Taux de modification des brouillons
- **Performance** : Temps de réponse < 30s

## 🔒 Sécurité

### Validation
- Validation email (format)
- Sanitisation HTML (corps d'email)
- Limite de caractères (subject: 200, body: 5000)
- Rate limiting (10 analyses/minute)

### Authentification
- JWT token requis pour toutes les requêtes
- Vérification des permissions (user peut uniquement voir ses propres drafts)

## 💡 Bonnes pratiques

### Performance
- Debouncing pour recherche/filtres (300ms)
- Pagination pour listes longues
- Lazy loading des images/attachments
- Cache des stats (5 minutes)

### Accessibilité
- Labels ARIA sur tous les boutons
- Support clavier (Tab, Enter, Escape)
- Contrastes de couleurs conformes WCAG 2.1
- Focus visible sur les éléments interactifs

### UX
- Messages d'erreur clairs et actionnables
- Feedback immédiat sur les actions
- Confirmations avant actions destructives
- Indicateurs de progression

## 📚 Ressources

- [Lucide React Icons](https://lucide.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🎯 Prochaines améliorations

- [ ] Rich text editor (Quill/TinyMCE) pour le corps
- [ ] Upload de pièces jointes
- [ ] Templates de réponses personnalisables
- [ ] Historique des modifications
- [ ] Support multi-langues (i18n)
- [ ] Mode sombre
- [ ] Notifications push pour nouveaux drafts
- [ ] Export des statistiques (CSV/PDF)

---

**Version:** 1.0.0  
**Dernière mise à jour:** 2025-12-23  
**Auteur:** CRM Immobilier Team
