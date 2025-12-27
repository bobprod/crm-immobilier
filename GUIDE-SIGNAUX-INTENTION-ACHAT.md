# 🎯 Signaux Comportementaux d'Intention d'Achat Immobilier

**Date**: 2025-12-07
**Objectif**: Détecter automatiquement les prospects avec forte intention d'achat immobilier
**Sources**: Facebook Marketplace, groupes Facebook, autres plateformes

---

## 📊 SIGNAUX D'INTENTION D'ACHAT

### 🔥 Signaux TRÈS FORTS (Score +40-50)

1. **Recherche Active Récente**
   - Consultation répétée de biens similaires
   - Recherches multiples dans même zone
   - Visites profil agent immobilier
   - Sauvegarde de plusieurs annonces

2. **Engagement sur Annonces**
   - Messages directs aux vendeurs
   - Questions détaillées (prix, disponibilité, visite)
   - Partage d'annonces avec commentaire
   - Tag de proches dans annonces

3. **Indicateurs Financiers**
   - Mention budget précis
   - Questions sur financement/prêt
   - Recherche informations notaire
   - Intérêt pour simulation crédit

4. **Urgence Temporelle**
   - Mots-clés: "urgent", "rapide", "immédiat"
   - Contraintes de temps mentionnées
   - Recherche "disponible maintenant"
   - Besoin de déménagement rapide

### ⚡ Signaux FORTS (Score +20-30)

5. **Critères Précis**
   - Nombre de chambres spécifique
   - Surface exacte recherchée
   - Étage préféré mentionné
   - Équipements requis listés

6. **Contexte de Vie**
   - Changement situation familiale (mariage, enfant)
   - Nouvelle ville/emploi mentionné
   - Recherche près école/travail
   - Évolution professionnelle

7. **Consultation Documentation**
   - Téléchargement plans
   - Demande diagnostics
   - Questions copropriété
   - Intérêt pour charges

8. **Comparaison Active**
   - Comparaison plusieurs biens
   - Questions sur avantages/inconvénients
   - Demande avis communauté
   - Recherche retours d'expérience

### 📈 Signaux MOYENS (Score +10-15)

9. **Activité Régulière**
   - Connexion quotidienne marketplace
   - Recherches sauvegardées activées
   - Notifications activées
   - Veille active secteur

10. **Questions Générales**
    - Questions sur quartier
    - Demande d'informations générales
    - Intérêt pour transport
    - Questions sur commodités

11. **Interaction Communauté**
    - Participation groupes immobiliers
    - Commentaires sur posts immobiliers
    - Partage d'expériences
    - Demandes de recommandations

12. **Préparation Recherche**
    - Questions sur processus achat
    - Recherche conseils acheteur
    - Intérêt pour guides
    - Formation sur l'immobilier

### 💡 Signaux FAIBLES (Score +5-10)

13. **Curiosité**
    - Like sur annonces
    - Consultation ponctuelle
    - Recherches larges
    - Intérêt vague

14. **Veille Passive**
    - Suivi pages immobilières
    - Abonnement groupes
    - Recherches occasionnelles
    - Comparaison marché

---

## 🚩 SIGNAUX NÉGATIFS (Score -10 à -30)

### ❌ Indicateurs de Faible Intention

1. **Spam/Bot** (-30)
   - Messages identiques répétés
   - Liens suspects
   - Profil incomplet/récent
   - Activité anormale

2. **Curiosité Pure** (-10)
   - Questions très générales
   - Pas de budget mentionné
   - "Just looking"
   - Recherche "pour voir"

3. **Impossibilité Financière** (-20)
   - Budget irréaliste
   - Aucun moyen de financement
   - Situation financière précaire
   - Demandes excessives

4. **Chercheur d'Info** (-15)
   - Questions pour amis/famille
   - Collecte d'informations
   - Pas de projet personnel
   - Recherche académique

---

## 📱 SOURCES DE DONNÉES FACEBOOK

### 1. **Facebook Marketplace**

**Données extraites**:
```typescript
{
  // Profil utilisateur
  userId: string
  userName: string
  profileUrl: string
  profileCreationDate: Date
  friendsCount: number

  // Comportement marketplace
  searchQueries: string[]
  viewedListings: {
    listingId: string
    viewCount: number
    lastViewed: Date
    timeSpent: number
  }[]
  savedListings: string[]
  messagesS ent: {
    to: string
    listingId: string
    messageContent: string
    timestamp: Date
  }[]

  // Engagement
  likes: string[]
  shares: string[]
  comments: {
    listingId: string
    content: string
    timestamp: Date
  }[]
}
```

**Signaux détectés**:
- ✅ Messages multiples → Recherche active
- ✅ Sauvegardes répétées → Intention sérieuse
- ✅ Questions précises → Qualification
- ✅ Mentions budget → Capacité financière
- ✅ Tags personnes → Décision familiale
- ✅ Fréquence visites → Urgence

### 2. **Groupes Facebook Immobiliers**

**Posts analysés**:
```typescript
{
  postId: string
  authorId: string
  content: string
  timestamp: Date

  // Classification
  type: 'recherche' | 'mandat' | 'question' | 'avis'

  // Extraction
  propertyType: string[]
  location: string[]
  budget: { min: number, max: number }
  criteria: {
    rooms: number
    surface: number
    floor: number
    features: string[]
  }

  // Signaux comportementaux
  urgency: 'high' | 'medium' | 'low'
  seriousness: number  // 0-100
  financialCapacity: 'confirmed' | 'potential' | 'unknown'
}
```

**Patterns d'intention forte**:
```
"Je cherche urgentment un appartement..."
"Budget confirmé de X à Y dinars"
"Visite possible ce weekend"
"Prêt bancaire déjà accordé"
"Déménagement prévu pour [date]"
"Cherche pour emménagement rapide"
```

### 3. **Profils Facebook Publics**

**Indicateurs vie**:
```typescript
{
  recentLifeEvents: {
    type: 'marriage' | 'newJob' | 'relocation' | 'baby'
    date: Date
  }[]

  locationHistory: {
    current: string
    previous: string[]
    moveDate: Date
  }

  employmentChange: {
    newEmployer: string
    location: string
    startDate: Date
  }

  familyStatus: {
    maritalStatus: string
    children: number
    recentChange: boolean
  }
}
```

**Corrélation événements → Intention**:
- Mariage récent → +30 score
- Nouvel emploi nouvelle ville → +40 score
- Naissance enfant → +25 score
- Déménagement annoncé → +50 score

---

## 🧠 ALGORITHME DE SCORING

### Formule Globale

```typescript
intentionScore =
  baseScore +
  behavioralSignals +
  contextualFactors +
  urgencyMultiplier +
  financialCapacityBonus -
  negativeIndicators

// Normalisé 0-100
finalScore = Math.min(100, Math.max(0, intentionScore))
```

### Calcul Détaillé

```typescript
class IntentionScorer {

  calculateScore(lead: ProspectData): number {
    let score = 0

    // 1. Base Score (0-20)
    score += this.getBaseScore(lead)

    // 2. Behavioral Signals (0-50)
    score += this.analyzeBehavior(lead)

    // 3. Contextual Factors (0-30)
    score += this.analyzeContext(lead)

    // 4. Urgency Multiplier (x1.0 - x1.5)
    const urgency = this.detectUrgency(lead)
    score *= urgency

    // 5. Financial Capacity (+0-20)
    score += this.assessFinancialCapacity(lead)

    // 6. Negative Indicators (-30 to 0)
    score += this.detectNegativeSignals(lead)

    return Math.min(100, Math.max(0, score))
  }

  private getBaseScore(lead): number {
    let base = 10
    if (lead.email && isValid(lead.email)) base += 5
    if (lead.phone && isValid(lead.phone)) base += 5
    return base
  }

  private analyzeBehavior(lead): number {
    let score = 0

    // Activité marketplace
    if (lead.messagesCount > 5) score += 20
    else if (lead.messagesCount > 2) score += 10

    // Sauvegardes
    if (lead.savedListings > 10) score += 15
    else if (lead.savedListings > 3) score += 8

    // Fréquence
    const daysActive = lead.activityDays?.length || 0
    if (daysActive > 7) score += 10
    else if (daysActive > 3) score += 5

    // Questions précises
    if (lead.hasDetailedQuestions) score += 10

    // Mentions budget
    if (lead.budgetMentioned) score += 10

    return score
  }

  private analyzeContext(lead): number {
    let score = 0

    // Événements de vie
    if (lead.recentMarriage) score += 15
    if (lead.newJob) score += 12
    if (lead.newBaby) score += 10
    if (lead.relocation) score += 20

    // Critères précis
    if (lead.specificCriteria?.length > 5) score += 10

    // Zone recherche cohérente
    if (lead.focusedArea) score += 8

    return score
  }

  private detectUrgency(lead): number {
    const urgentKeywords = [
      'urgent', 'rapide', 'immédiat', 'asap',
      'ce weekend', 'cette semaine', 'maintenant'
    ]

    const text = lead.messages?.join(' ').toLowerCase() || ''
    const urgentCount = urgentKeywords.filter(k => text.includes(k)).length

    if (urgentCount >= 3) return 1.5
    if (urgentCount >= 1) return 1.2
    return 1.0
  }

  private assessFinancialCapacity(lead): number {
    let score = 0

    if (lead.budgetConfirmed) score += 15
    if (lead.loanPreApproved) score += 20
    if (lead.budgetRealistic) score += 10
    if (lead.cashBuyer) score += 15

    return score
  }

  private detectNegativeSignals(lead): number {
    let penalty = 0

    // Spam patterns
    if (lead.identicalMessages > 5) penalty -= 30
    if (lead.suspiciousLinks) penalty -= 20

    // Profil incomplet
    if (!lead.profilePicture) penalty -= 5
    if (lead.friendsCount < 10) penalty -= 10

    // Budget irréaliste
    if (lead.budgetTooLow) penalty -= 20

    // Curiosité pure
    if (lead.vagueQuestions && !lead.specificCriteria) penalty -= 15

    return penalty
  }
}
```

---

## 🎯 CLASSIFICATION DES LEADS

### Catégories de Qualité

```typescript
enum LeadQuality {
  HOT = 'hot',           // 80-100: Prêt à acheter
  WARM = 'warm',         // 60-79: Intention forte
  QUALIFIED = 'qualified', // 40-59: Potentiel
  COLD = 'cold',         // 20-39: Faible intention
  SPAM = 'spam'          // 0-19: À rejeter
}

function classifyLead(score: number): LeadQuality {
  if (score >= 80) return LeadQuality.HOT
  if (score >= 60) return LeadQuality.WARM
  if (score >= 40) return LeadQuality.QUALIFIED
  if (score >= 20) return LeadQuality.COLD
  return LeadQuality.SPAM
}
```

### Actions Recommandées par Catégorie

| Qualité | Score | Action | Priorité | Délai |
|---------|-------|--------|----------|-------|
| 🔥 HOT | 80-100 | Appel immédiat + Email personnalisé | Très haute | 1-4h |
| ⚡ WARM | 60-79 | Email + WhatsApp + Suivi 24h | Haute | 24h |
| ✅ QUALIFIED | 40-59 | Email automatique + Nurturing | Moyenne | 48h |
| ❄️ COLD | 20-39 | Newsletter + Retargeting | Basse | 1 sem |
| 🚫 SPAM | 0-19 | Ignorer ou supprimer | Aucune | - |

---

## 📈 EXEMPLES CONCRETS

### Exemple 1: Lead HOT (Score 92)

```json
{
  "profile": {
    "name": "Ahmed Ben Ali",
    "age": 35,
    "location": "Tunis",
    "employed": true,
    "recentMarriage": true
  },
  "behavior": {
    "messagesCount": 12,
    "savedListings": 8,
    "viewedListings": 45,
    "activeDays": 14,
    "lastActivity": "2h ago"
  },
  "signals": {
    "budgetMentioned": "250,000 - 300,000 TND",
    "loanPreApproved": true,
    "urgentKeywords": ["urgent", "ce weekend"],
    "specificCriteria": ["3 chambres", "Lac 2", "étage élevé", "parking"],
    "detailedQuestions": [
      "Disponible pour visite samedi?",
      "Charges mensuelles exactes?",
      "Notaire recommandé?"
    ]
  },
  "context": {
    "newJob": "Entreprise Lac 2",
    "relocating": true,
    "deadline": "Fin du mois"
  },
  "score": 92,
  "quality": "HOT",
  "action": "Appel immédiat + Proposition 3 biens"
}
```

### Exemple 2: Lead WARM (Score 68)

```json
{
  "profile": {
    "name": "Fatma Gharbi",
    "age": 28,
    "location": "Sousse"
  },
  "behavior": {
    "messagesCount": 5,
    "savedListings": 12,
    "viewedListings": 30,
    "activeDays": 8
  },
  "signals": {
    "budgetMentioned": "180,000 TND max",
    "specificCriteria": ["2 chambres", "près mer", "meublé"],
    "questions": ["Possibilité crédit?", "Bon quartier?"]
  },
  "context": {
    "savingForDownPayment": true
  },
  "score": 68,
  "quality": "WARM",
  "action": "Email personnalisé + Simulation crédit"
}
```

### Exemple 3: Lead SPAM (Score 12)

```json
{
  "profile": {
    "name": "Unknown User",
    "accountCreated": "3 days ago",
    "friendsCount": 2,
    "noProfilePicture": true
  },
  "behavior": {
    "identicalMessages": 20,
    "suspiciousLinks": true
  },
  "signals": {
    "vagueQuestions": true,
    "noBudget": true
  },
  "score": 12,
  "quality": "SPAM",
  "action": "Rejeter automatiquement"
}
```

---

## 🛠️ IMPLÉMENTATION TECHNIQUE

### Stack Technique

```typescript
// Scraping
- Puppeteer: Navigation Facebook
- Browserless: Chrome headless cloud
- Bull Queue: Rate limiting et retry

// Analyse
- NLP: Extraction intentions
- LLM: Classification comportements
- Prisma: Stockage signaux

// Scoring
- Real-time scoring engine
- ML predictions (optionnel)
- A/B testing scores
```

### Architecture Proposée

```
Facebook → Puppeteer → Raw Data → Bull Queue →
  LLM Analysis → Signal Extraction → Scoring →
    Lead Classification → CRM Integration →
      Automated Actions
```

---

## 📊 MÉTRIQUES DE SUCCÈS

### KPIs à Suivre

1. **Qualité Leads**
   - % Leads HOT convertis
   - Temps moyen conversion
   - ROI par catégorie

2. **Précision Scoring**
   - Accuracy du scoring (vs réalité)
   - False positives rate
   - False negatives rate

3. **Performance Système**
   - Leads scrapés / jour
   - Temps traitement / lead
   - Coût par lead qualifié

4. **Engagement**
   - Taux réponse par catégorie
   - Taux conversion RDV
   - Satisfaction agents

---

**Document créé par**: Claude (Sonnet 4.5)
**Date**: 2025-12-07
**Version**: 1.0
**Statut**: 📘 GUIDE D'IMPLÉMENTATION
