# 🎨 Guide Visuel - Intégration Pica

## 📍 Accès à la configuration Pica

### Étape 1 : Ouvrir les Paramètres
1. Connectez-vous au CRM avec vos identifiants
2. Cliquez sur l'icône **Paramètres** dans le menu de navigation

### Étape 2 : Accéder à l'onglet Pica
1. Dans la page Paramètres, vous verrez 7 onglets :
   - Général
   - Intégrations API
   - **Pica** ← Cliquez ici
   - Zones & Villes
   - Cartes
   - Intelligence Artificielle
   - WhatsApp Business

---

## 🔧 Configuration de Pica

### Section 1 : Clé API Pica

```
┌─────────────────────────────────────────────────────────┐
│  Configuration Pica                                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Nom de la configuration                                │
│  ┌────────────────────────────────────────────────┐    │
│  │ default                                         │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  API Key                                                │
│  ┌────────────────────────────────────────────────┐    │
│  │ ••••••••••••••••••••••••••••••••••••••••••OxOl │    │
│  └────────────────────────────────────────────────┘    │
│  Trouvez votre clé API dans votre tableau de bord Pica │
│                                                          │
│  Base URL                                               │
│  ┌────────────────────────────────────────────────┐    │
│  │ https://api.picaos.com                          │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Comment obtenir la clé API ?**
1. Créez un compte sur [picaos.com](https://www.picaos.com)
2. Accédez à votre tableau de bord
3. Allez dans les paramètres de votre compte
4. Copiez votre API Key (elle est masquée, cliquez pour la révéler)

---

### Section 2 : Configuration SerpApi

```
┌─────────────────────────────────────────────────────────┐
│  SerpApi (Recherche Google)                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Activer SerpApi                                        │
│  ┌──────┐                                               │
│  │  ✓   │ ON                                            │
│  └──────┘                                               │
│                                                          │
│  Connection ID                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ conn_serp_...                                   │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────┐                                   │
│  │  Tester SerpApi  │                                   │
│  └──────────────────┘                                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Comment obtenir le Connection ID ?**
1. Dans votre tableau de bord Pica, allez dans **Connections**
2. Cliquez sur **Connect** pour SerpApi
3. Suivez les instructions pour connecter votre compte SerpApi
4. Copiez le Connection ID généré (commence par `conn_serp_`)

---

### Section 3 : Configuration Firecrawl

```
┌─────────────────────────────────────────────────────────┐
│  Firecrawl (Web Scraping)                               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Activer Firecrawl                                      │
│  ┌──────┐                                               │
│  │  ✓   │ ON                                            │
│  └──────┘                                               │
│                                                          │
│  Connection ID                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ conn_firecrawl_...                              │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────┐                                 │
│  │  Tester Firecrawl  │                                 │
│  └────────────────────┘                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Comment obtenir le Connection ID ?**
1. Dans votre tableau de bord Pica, allez dans **Connections**
2. Cliquez sur **Connect** pour Firecrawl
3. Suivez les instructions pour connecter votre compte Firecrawl
4. Copiez le Connection ID généré (commence par `conn_firecrawl_`)

---

### Section 4 : Test de recherche combinée

```
┌─────────────────────────────────────────────────────────┐
│  Test de recherche combinée                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Cette fonction combine SerpApi (recherche Google)      │
│  et Firecrawl (scraping) pour obtenir des résultats     │
│  complets avec le contenu des pages.                    │
│                                                          │
┌─────────────────────────────────────────────────────────┐
│  SerpApi (Recherche Google)                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Activer SerpApi                                        │
│  ┌──────┐                                               │
│  │  ✓   │ ON                                            │
│  └──────┘                                               │
│                                                          │
│  Clé de connexion SerpApi                               │
│  ┌────────────────────────────────────────────────┐    │
│  │ test::serp-api::default::b66e4d3f2a0c45ce...   │    │
│  └────────────────────────────────────────────────┘    │
│  Connectez SerpApi dans Pica et copiez la clé          │
│                                                          │
│  ┌──────────────────┐                                   │
│  │  Tester SerpApi  │                                   │
│  └──────────────────┘                                   │
│                                                          │
└─────────────────────────────────────────────────────────┘

**Comment obtenir la Connection Key ?**
1. Dans votre tableau de bord Pica, allez dans **Connections**
2. Cliquez sur **Connect** pour SerpApi
3. Suivez les instructions pour connecter votre compte SerpApi
4. Une fois connecté, copiez la **Connection Key** affichée
5. Format : `test::serp-api::default::b66e4d3f2a0c45ce8aed8303f78c0e3e`

### Section 3 : Configuration Firecrawl

```
┌─────────────────────────────────────────────────────────┐
│  Firecrawl (Web Scraping)                               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Activer Firecrawl                                      │
│  ┌──────┐                                               │
│  │  ✓   │ ON                                            │
│  └──────┘                                               │
│                                                          │
│  Clé de connexion Firecrawl                             │
│  ┌────────────────────────────────────────────────┐    │
│  │ test::firecrawl::default::a1b2c3d4e5f6...      │    │
│  └────────────────────────────────────────────────┘    │
│  Connectez Firecrawl dans Pica et copiez la clé        │
│                                                          │
│  ┌────────────────────┐                                 │
│  │  Tester Firecrawl  │                                 │
│  └────────────────────┘                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Comment obtenir la Connection Key ?**
1. Dans votre tableau de bord Pica, allez dans **Connections**
2. Cliquez sur **Connect** pour Firecrawl
3. Suivez les instructions pour connecter votre compte Firecrawl
4. Une fois connecté, copiez la **Connection Key** affichée
5. Format : `test::firecrawl::default::a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
```

---

### Section 5 : Sauvegarder

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  ┌──────────────────────────────────────┐              │
│  │  💾 Sauvegarder la configuration     │              │
│  └──────────────────────────────────────┘              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Important :** N'oubliez pas de cliquer sur "Sauvegarder" après avoir configuré vos clés !

---

## 🎯 Utilisation pratique

### Cas d'usage 1 : Veille concurrentielle

**Objectif :** Analyser les sites immobiliers concurrents

**Étapes :**
1. Configurez Pica avec vos clés API
2. Activez SerpApi et Firecrawl
3. Utilisez l'endpoint de recherche combinée :
   ```
   GET /pica/search/combined?query=agence+immobilière+Tunis&limit=10
   ```
4. Analysez les résultats retournés

**Résultat :** Vous obtenez les 10 meilleurs sites d'agences immobilières à Tunis avec leur contenu complet.

---

### Cas d'usage 2 : Analyse de prix

**Objectif :** Rechercher les prix du marché immobilier

**Étapes :**
1. Utilisez la recherche combinée avec une requête de prix :
   ```
   GET /pica/search/combined?query=prix+appartement+3+pièces+Tunis&limit=15
   ```
2. Analysez les prix trouvés dans les résultats

**Résultat :** Vous obtenez une vue d'ensemble des prix du marché pour les appartements 3 pièces à Tunis.

---

### Cas d'usage 3 : Génération de leads

**Objectif :** Trouver des prospects potentiels

**Étapes :**
1. Utilisez SerpApi pour rechercher des personnes cherchant un bien :
   ```
   POST /pica/serp/search
   {
     "query": "cherche appartement Tunis",
     "numResults": 50
   }
   ```
2. Analysez les résultats pour identifier des prospects

**Résultat :** Vous obtenez une liste de 50 résultats de personnes cherchant un appartement à Tunis.

---

## 🔔 Notifications et messages

### Messages de succès

**Configuration sauvegardée :**
```
✅ Succès
Configuration Pica sauvegardée
```

**Test réussi (SerpApi) :**
```
✅ Test réussi
SerpApi fonctionne correctement
```

**Test réussi (Firecrawl) :**
```
✅ Test réussi
Firecrawl fonctionne correctement
```

**Test réussi (Recherche combinée) :**
```
✅ Test réussi
Recherche combinée (SerpApi + Firecrawl) fonctionne correctement
```

---

### Messages d'erreur

**Configuration non trouvée :**
```
❌ Erreur
Aucune configuration Pica active trouvée
```

**SerpApi désactivé :**
```
❌ Erreur
SerpApi n'est pas activé
```

**Firecrawl désactivé :**
```
❌ Erreur
Firecrawl n'est pas activé
```

**Clés API invalides :**
```
❌ Erreur
Clés API Pica invalides
```

**Test échoué :**
```
❌ Test échoué
Erreur lors du test de connexion
```

---

## 📚 Liens utiles dans l'interface

L'interface Pica contient des liens directs vers :

1. **Documentation Pica** → [docs.picaos.com](https://docs.picaos.com)
2. **Tableau de bord Pica** → [picaos.com/dashboard](https://www.picaos.com/dashboard)
3. **SerpApi** → [serpapi.com](https://serpapi.com)
4. **Firecrawl** → [firecrawl.dev](https://www.firecrawl.dev)

---

## 🎨 Thème et design

L'interface Pica s'adapte automatiquement au thème de votre CRM :
- **Mode clair** : Fond blanc, texte noir
- **Mode sombre** : Fond sombre, texte clair

Les couleurs utilisées :
- **Vert** : Succès, tests réussis
- **Rouge** : Erreurs, tests échoués
- **Bleu** : Liens, boutons d'action
- **Jaune** : Avertissements

---

## 💡 Conseils d'utilisation

### 1. Testez toujours vos connexions
Après avoir configuré vos clés, utilisez les boutons "Tester" pour vérifier que tout fonctionne.

### 2. Commencez par la recherche combinée
C'est la fonctionnalité la plus puissante. Elle combine SerpApi et Firecrawl pour des résultats complets.

### 3. Surveillez vos crédits
SerpApi et Firecrawl sont des services payants. Vérifiez régulièrement vos crédits dans vos tableaux de bord respectifs.

### 4. Utilisez des requêtes spécifiques
Plus votre requête est précise, meilleurs seront les résultats.

### 5. Sauvegardez régulièrement
N'oubliez pas de sauvegarder après chaque modification de configuration.

---

## 🆘 Dépannage visuel

### Problème : Le bouton "Sauvegarder" ne fonctionne pas

**Solution :**
1. Vérifiez que tous les champs obligatoires sont remplis
2. Vérifiez votre connexion internet
3. Vérifiez que vous êtes toujours connecté (token JWT valide)
4. Consultez la console du navigateur pour plus de détails

---

### Problème : Les tests échouent

**Solution :**
1. Vérifiez que vos clés API sont correctes
2. Vérifiez que les Connection IDs sont corrects
3. Vérifiez que SerpApi/Firecrawl sont activés
4. Vérifiez votre connexion internet
5. Consultez les logs du backend

---

### Problème : L'onglet Pica n'apparaît pas

**Solution :**
1. Actualisez la page (F5)
2. Videz le cache du navigateur
3. Vérifiez que le frontend est à jour
4. Vérifiez la console du navigateur pour les erreurs

---

**Profitez de votre intégration Pica ! 🚀**
