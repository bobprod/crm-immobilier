# 📖 Guide de démarrage - Intégration Pica

## 🎯 Bienvenue !

Ce guide vous aidera à configurer et utiliser l'intégration **Pica API** dans votre CRM immobilier.

---

## 📚 Documentation disponible

Nous avons créé plusieurs guides pour vous aider :

### 1. 🚀 [PICA_CHANGES.md](./PICA_CHANGES.md) - **COMMENCEZ ICI !**
**Résumé des modifications et guide de configuration rapide**
- Changements effectués (suppression de API Secret)
- Configuration simplifiée en 5 étapes
- Interface mise à jour
- Migration si nécessaire

### 2. 📋 [PICA_INTEGRATION_SUMMARY.md](./PICA_INTEGRATION_SUMMARY.md)
**Résumé complet de l'intégration**
- Vue d'ensemble technique
- Endpoints API disponibles
- Architecture du système
- Cas d'usage pour l'immobilier

### 3. 🎨 [PICA_VISUAL_GUIDE.md](./PICA_VISUAL_GUIDE.md)
**Guide visuel avec captures d'écran**
- Interface pas à pas
- Schémas de configuration
- Messages de succès/erreur
- Conseils d'utilisation

### 4. ❓ [PICA_FAQ.md](./PICA_FAQ.md)
**40 questions fréquentes**
- Configuration et clés API
- Utilisation pratique
- Dépannage
- Sécurité et performance

### 5. 🔧 [PICA_INTEGRATION.md](./PICA_INTEGRATION.md)
**Guide technique détaillé**
- Installation complète
- Configuration avancée
- Architecture technique
- Exemples de code

### 6. 🧪 [PICA_API_TESTS.md](./PICA_API_TESTS.md)
**Tests et exemples d'utilisation**
- Tests avec cURL
- Exemples de requêtes
- Réponses attendues
- Cas d'usage réels

### 7. 🔔 [PICA_NOTIFICATIONS.md](./PICA_NOTIFICATIONS.md) - **NOUVEAU !**
**Notifications visuelles et indicateurs**
- Notifications de succès/erreur
- Messages détaillés pour chaque action
- Indicateurs de chargement
- Débogage des notifications

---

## ⚡ Démarrage rapide (5 minutes)

### Étape 1 : Créer un compte Pica
👉 [picaos.com](https://www.picaos.com)

### Étape 2 : Obtenir votre API Key
1. Tableau de bord Pica → Paramètres
2. Copiez votre API Key

### Étape 3 : Connecter SerpApi et Firecrawl
1. Tableau de bord Pica → Connections
2. Connect SerpApi → Copiez la Connection Key
3. Connect Firecrawl → Copiez la Connection Key

### Étape 4 : Configurer dans le CRM
1. CRM → Paramètres → Pica
2. Entrez API Key, Connection Keys
3. Testez et sauvegardez

### Étape 5 : Utiliser !
```javascript
// Recherche combinée
const response = await fetch(
  `http://localhost:3000/pica/search/combined?query=immobilier+Tunis&limit=5`,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

---

## 🗺️ Parcours recommandé

### Pour les débutants
1. Lisez [PICA_CHANGES.md](./PICA_CHANGES.md) pour comprendre les bases
2. Suivez le [PICA_VISUAL_GUIDE.md](./PICA_VISUAL_GUIDE.md) pour la configuration
3. Consultez la [PICA_FAQ.md](./PICA_FAQ.md) si vous avez des questions

### Pour les développeurs
1. Lisez [PICA_INTEGRATION_SUMMARY.md](./PICA_INTEGRATION_SUMMARY.md) pour l'architecture
2. Consultez [PICA_INTEGRATION.md](./PICA_INTEGRATION.md) pour les détails techniques
3. Testez avec [PICA_API_TESTS.md](./PICA_API_TESTS.md)

### Pour les utilisateurs avancés
1. Lisez toute la documentation
2. Explorez les cas d'usage dans [PICA_INTEGRATION_SUMMARY.md](./PICA_INTEGRATION_SUMMARY.md)
3. Optimisez avec les conseils de la [PICA_FAQ.md](./PICA_FAQ.md)

---

## 🎯 Ce que vous pouvez faire avec Pica

### 1. Veille concurrentielle
Analysez les sites immobiliers concurrents en temps réel

### 2. Analyse de prix
Recherchez et comparez les prix du marché

### 3. Génération de leads
Trouvez des prospects potentiels automatiquement

### 4. Scraping d'annonces
Extrayez les annonces des sites concurrents

### 5. Analyse de tendances
Identifiez les tendances du marché immobilier

### 6. Monitoring automatique
Surveillez les nouveaux biens et les changements de prix

---

## 🔑 Informations importantes

### Ce dont vous avez besoin :
- ✅ **API Key Pica** (1 seule clé, pas de secret)
- ✅ **Connection Key SerpApi** (format: `test::serp-api::default::...`)
- ✅ **Connection Key Firecrawl** (format: `test::firecrawl::default::...`)

### Ce que vous n'avez PAS besoin :
- ❌ **API Secret** (n'existe pas dans Pica)
- ❌ **Connection ID** (c'est "Connection Key" maintenant)

---

## 🚀 Fonctionnalités

### Backend (NestJS)
- ✅ Module Pica complet
- ✅ Endpoints API protégés par JWT
- ✅ Intégration SerpApi (recherche Google)
- ✅ Intégration Firecrawl (web scraping)
- ✅ Recherche combinée (SerpApi + Firecrawl)
- ✅ Gestion de configuration CRUD

### Frontend (React + TypeScript)
- ✅ Interface de configuration intuitive
- ✅ Tests de connexion intégrés
- ✅ Test de recherche combinée
- ✅ Aide contextuelle
- ✅ Messages d'erreur explicites
- ✅ Utilise fetch natif (pas de dépendance axios)

---

## 📊 Architecture

```
Frontend (React)
    ↓ fetch + JWT
Backend (NestJS)
    ↓ axios + x-pica-key
Pica API
    ↓ Connection Keys
SerpApi + Firecrawl
```

---

## 🔒 Sécurité

- ✅ Toutes les routes protégées par JWT
- ✅ Clés API stockées en base de données
- ✅ Appels API via le backend uniquement
- ✅ Validation des données avec class-validator
- ✅ Gestion des erreurs complète

---

## 💡 Conseils

### 1. Testez toujours vos connexions
Utilisez les boutons "Tester" après la configuration

### 2. Surveillez vos crédits
SerpApi et Firecrawl sont des services payants

### 3. Utilisez la recherche combinée
C'est la fonctionnalité la plus puissante !

### 4. Optimisez vos requêtes
Soyez spécifique pour de meilleurs résultats

### 5. Consultez la FAQ
40 questions/réponses pour vous aider

---

## 🆘 Besoin d'aide ?

### Documentation
- [PICA_CHANGES.md](./PICA_CHANGES.md) - Changements et configuration
- [PICA_FAQ.md](./PICA_FAQ.md) - 40 questions fréquentes
- [PICA_VISUAL_GUIDE.md](./PICA_VISUAL_GUIDE.md) - Guide visuel

### Support
- **Pica** : [support@picaos.com](mailto:support@picaos.com)
- **SerpApi** : [support@serpapi.com](mailto:support@serpapi.com)
- **Firecrawl** : [support@firecrawl.dev](mailto:support@firecrawl.dev)

### Liens utiles
- [Documentation Pica](https://docs.picaos.com)
- [Tableau de bord Pica](https://www.picaos.com/dashboard)
- [SerpApi](https://serpapi.com)
- [Firecrawl](https://www.firecrawl.dev)

---

## ✅ Checklist de démarrage

- [ ] Compte Pica créé
- [ ] API Key obtenue
- [ ] SerpApi connecté dans Pica
- [ ] Firecrawl connecté dans Pica
- [ ] Connection Keys copiées
- [ ] Configuration dans le CRM
- [ ] Tests de connexion réussis
- [ ] Test de recherche combinée réussi
- [ ] Configuration sauvegardée
- [ ] Premier appel API effectué

---

## 🎊 Prêt à commencer ?

1. **Lisez** [PICA_CHANGES.md](./PICA_CHANGES.md)
2. **Configurez** en suivant le guide
3. **Testez** vos connexions
4. **Utilisez** l'API dans votre CRM
5. **Consultez** la FAQ si besoin

---

**Bonne utilisation de Pica ! 🚀**

*Dernière mise à jour : Aujourd'hui*
