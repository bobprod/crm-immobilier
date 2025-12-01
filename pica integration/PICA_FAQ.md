# ❓ FAQ - Intégration Pica API

## Questions fréquentes sur l'intégration Pica dans le CRM immobilier

---

## 🔑 Configuration et Clés API

### Q1 : Où trouver ma clé API Pica ?

**R :** 
1. Connectez-vous à [picaos.com](https://www.picaos.com)
2. Accédez à votre tableau de bord
3. Allez dans les paramètres de votre compte
4. Votre API Key est affichée (elle est masquée par défaut, cliquez pour la révéler)

---

### Q2 : Qu'est-ce qu'une Connection Key ?

**R :** Une Connection Key est une clé d'intégration générée par Pica lorsque vous connectez un service externe (SerpApi ou Firecrawl). Elle permet à Pica de faire le lien entre votre compte et le service connecté.

**Format :**
- SerpApi : `test::serp-api::default::b66e4d3f2a0c45ce8aed8303f78c0e3e`
- Firecrawl : `test::firecrawl::default::a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

---

### Q3 : Comment obtenir une Connection Key pour SerpApi ?

**R :**
1. Dans votre tableau de bord Pica, allez dans **Connections**
2. Trouvez **SerpApi** dans la liste des services disponibles
3. Cliquez sur **Connect**
4. Suivez les instructions pour connecter votre compte SerpApi
5. Une fois connecté, la Connection Key s'affiche
6. Copiez-la et collez-la dans le CRM

---

### Q4 : Comment obtenir une Connection Key pour Firecrawl ?

**R :**
1. Dans votre tableau de bord Pica, allez dans **Connections**
2. Trouvez **Firecrawl** dans la liste des services disponibles
3. Cliquez sur **Connect**
4. Suivez les instructions pour connecter votre compte Firecrawl
5. Une fois connecté, la Connection Key s'affiche
6. Copiez-la et collez-la dans le CRM

---

### Q5 : Ai-je besoin d'un compte SerpApi et Firecrawl séparés ?

**R :** Oui ! Pica agit comme un intermédiaire, mais vous devez avoir :
- Un compte **Pica** (gratuit ou payant)
- Un compte **SerpApi** avec des crédits
- Un compte **Firecrawl** avec des crédits

Pica facilite l'intégration et la gestion de ces services.

---

### Q6 : Y a-t-il un API Secret dans Pica ?

**R :** Non ! Contrairement à d'autres services, Pica n'utilise qu'une seule **API Key**. Il n'y a pas de "API Secret" séparé. Vous n'avez besoin que de :
- Votre API Key Pica
- Les Connection Keys pour SerpApi et Firecrawl

---

## 🔧 Configuration dans le CRM

### Q7 : Où configurer Pica dans le CRM ?

**R :**
1. Connectez-vous au CRM
2. Allez dans **Paramètres** (icône d'engrenage)
3. Cliquez sur l'onglet **Pica**
4. Remplissez les champs et sauvegardez

---

### Q8 : Puis-je utiliser uniquement SerpApi sans Firecrawl ?

**R :** Oui ! Vous pouvez activer/désactiver SerpApi et Firecrawl indépendamment :
- Activez uniquement SerpApi si vous voulez juste faire des recherches Google
- Activez uniquement Firecrawl si vous voulez juste scraper des pages
- Activez les deux pour utiliser la recherche combinée

---

### Q9 : Que fait le bouton "Tester" ?

**R :** Le bouton "Tester" effectue un appel API de test pour vérifier que :
- Votre clé API Pica est valide
- La Connection Key est correcte
- Le service (SerpApi ou Firecrawl) est bien connecté
- Tout fonctionne correctement

Si le test réussit, vous verrez un message de succès. Sinon, un message d'erreur vous indiquera le problème.

---

### Q10 : Que fait le test de recherche combinée ?

**R :** Le test de recherche combinée effectue :
1. Une recherche Google via SerpApi avec la requête "immobilier Tunisie"
2. Un scraping des 3 premiers résultats via Firecrawl
3. Retourne les résultats combinés

C'est la fonctionnalité la plus puissante de l'intégration !

---

## 💰 Coûts et Crédits

### Q11 : Combien coûte Pica ?

**R :** Pica propose plusieurs plans :
- **Gratuit** : Limité en nombre d'appels
- **Payant** : Plans à partir de $X/mois (consultez [picaos.com/pricing](https://www.picaos.com/pricing))

---

### Q12 : Combien coûte SerpApi ?

**R :** SerpApi est un service payant :
- **Gratuit** : 100 recherches/mois
- **Payant** : À partir de $50/mois pour 5000 recherches
- Consultez [serpapi.com/pricing](https://serpapi.com/pricing)

---

### Q13 : Combien coûte Firecrawl ?

**R :** Firecrawl propose :
- **Gratuit** : Limité en nombre de pages
- **Payant** : Plans à partir de $X/mois
- Consultez [firecrawl.dev/pricing](https://www.firecrawl.dev/pricing)

---

### Q14 : Comment surveiller ma consommation de crédits ?

**R :** 
- **Pica** : Tableau de bord Pica → Usage
- **SerpApi** : Tableau de bord SerpApi → Dashboard
- **Firecrawl** : Tableau de bord Firecrawl → Usage

Vérifiez régulièrement pour éviter les dépassements !

---

## 🚀 Utilisation

### Q15 : Comment faire une recherche Google ?

**R :**
```javascript
const token = localStorage.getItem("token");
const response = await fetch("http://localhost:3000/pica/serp/search", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    query: "immobilier Tunis",
    location: "Tunisia",
    numResults: 10
  })
});
const data = await response.json();
```

---

### Q16 : Comment scraper une page web ?

**R :**
```javascript
const token = localStorage.getItem("token");
const response = await fetch("http://localhost:3000/pica/firecrawl/scrape", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    url: "https://www.mubawab.tn/fr/ct/tunis/a-vendre",
    onlyMainContent: true
  })
});
const data = await response.json();
```

---

### Q17 : Comment utiliser la recherche combinée ?

**R :**
```javascript
const token = localStorage.getItem("token");
const params = new URLSearchParams({
  query: "immobilier Tunis",
  location: "Tunisia",
  limit: "5"
});
const response = await fetch(
  `http://localhost:3000/pica/search/combined?${params}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  }
);
const data = await response.json();
```

---

### Q18 : Quels sont les cas d'usage pour l'immobilier ?

**R :**
1. **Veille concurrentielle** : Analysez les sites concurrents
2. **Analyse de prix** : Recherchez les prix du marché
3. **Génération de leads** : Trouvez des prospects
4. **Scraping d'annonces** : Extrayez les annonces
5. **Analyse de tendances** : Identifiez les tendances du marché
6. **Monitoring** : Surveillez les nouveaux biens

---

## 🐛 Dépannage

### Q19 : Erreur "Aucune configuration Pica active trouvée"

**R :**
- Vérifiez que vous avez sauvegardé la configuration
- Vérifiez que le switch "Configuration active" est activé
- Actualisez la page et réessayez

---

### Q20 : Erreur "SerpApi n'est pas activé"

**R :**
- Vérifiez que le switch SerpApi est activé
- Vérifiez que vous avez entré une Connection Key valide
- Testez la connexion avec le bouton "Tester"

---

### Q21 : Erreur "Clés API Pica invalides"

**R :**
- Vérifiez que vous avez copié la bonne API Key
- Vérifiez qu'il n'y a pas d'espaces avant/après la clé
- Reconnectez-vous à Pica et copiez à nouveau la clé
- Vérifiez que votre compte Pica est actif

---

### Q22 : Le test de connexion échoue

**R :**
1. Vérifiez votre connexion internet
2. Vérifiez que le backend est démarré (`npm run start:dev`)
3. Vérifiez que PostgreSQL est démarré
4. Vérifiez les logs du backend pour plus de détails
5. Vérifiez que vous avez des crédits sur SerpApi/Firecrawl

---

### Q23 : L'onglet Pica n'apparaît pas

**R :**
1. Actualisez la page (F5)
2. Videz le cache du navigateur (Ctrl+Shift+Delete)
3. Vérifiez que le frontend est à jour
4. Vérifiez la console du navigateur pour les erreurs (F12)

---

### Q24 : Erreur 401 Unauthorized

**R :**
- Votre token JWT a expiré
- Déconnectez-vous et reconnectez-vous
- Vérifiez que vous êtes bien authentifié

---

### Q25 : Erreur 500 Internal Server Error

**R :**
1. Vérifiez les logs du backend
2. Vérifiez que PostgreSQL est démarré
3. Vérifiez que la table `pica_configs` existe
4. Vérifiez que les clés API sont correctes

---

## 🔒 Sécurité

### Q26 : Mes clés API sont-elles sécurisées ?

**R :** Oui ! 
- Les clés sont stockées en base de données (PostgreSQL)
- Elles ne sont jamais exposées au frontend
- Tous les appels API passent par le backend
- Les routes sont protégées par JWT

---

### Q27 : Puis-je partager ma configuration Pica ?

**R :** Non ! Ne partagez jamais :
- Votre API Key Pica
- Vos Connection Keys
- Vos clés SerpApi ou Firecrawl

Ce sont des informations sensibles liées à votre compte.

---

### Q28 : Que se passe-t-il si quelqu'un vole ma clé API ?

**R :**
1. Révoque immédiatement la clé dans votre tableau de bord Pica
2. Génère une nouvelle clé
3. Mets à jour la configuration dans le CRM
4. Surveille ton usage pour détecter toute activité suspecte

---

## 📊 Performance

### Q29 : Combien de temps prend une recherche combinée ?

**R :** Cela dépend :
- **SerpApi** : ~1-2 secondes
- **Firecrawl** : ~2-5 secondes par page
- **Total** : ~5-15 secondes pour 3 résultats

La recherche combinée est plus lente car elle effectue plusieurs opérations.

---

### Q30 : Puis-je faire des recherches en masse ?

**R :** Oui, mais attention :
- Respectez les limites de votre plan Pica
- Respectez les limites de SerpApi et Firecrawl
- Utilisez des jobs asynchrones pour les grandes quantités
- Surveillez votre consommation de crédits

---

## 🔄 Mises à jour

### Q31 : Comment mettre à jour l'intégration Pica ?

**R :**
1. Tirez les dernières modifications du dépôt Git
2. Installez les dépendances : `npm install`
3. Redémarrez le backend et le frontend
4. Vérifiez que tout fonctionne avec les tests

---

### Q32 : Y a-t-il des migrations de base de données ?

**R :** Si vous avez déjà une configuration Pica avec `apiSecret`, vous devrez :
1. Sauvegarder vos données
2. Supprimer l'ancienne configuration
3. Créer une nouvelle configuration sans `apiSecret`
4. Utiliser uniquement l'API Key

---

## 📚 Documentation

### Q33 : Où trouver plus de documentation ?

**R :**
- [PICA_INTEGRATION.md](./PICA_INTEGRATION.md) - Guide complet
- [PICA_API_TESTS.md](./PICA_API_TESTS.md) - Tests et exemples
- [PICA_VISUAL_GUIDE.md](./PICA_VISUAL_GUIDE.md) - Guide visuel
- [PICA_INTEGRATION_SUMMARY.md](./PICA_INTEGRATION_SUMMARY.md) - Résumé
- [Documentation Pica](https://docs.picaos.com)

---

### Q34 : Comment contacter le support ?

**R :**
- **Pica** : [support@picaos.com](mailto:support@picaos.com)
- **SerpApi** : [support@serpapi.com](mailto:support@serpapi.com)
- **Firecrawl** : [support@firecrawl.dev](mailto:support@firecrawl.dev)

---

## 💡 Conseils et Astuces

### Q35 : Quels sont les meilleurs paramètres pour l'immobilier ?

**R :**
- **Location** : "Tunisia" ou ville spécifique
- **Language** : "fr" pour le français
- **NumResults** : 10-20 pour un bon équilibre
- **OnlyMainContent** : true pour éviter le bruit

---

### Q36 : Comment optimiser mes coûts ?

**R :**
1. Utilisez le cache pour éviter les appels répétés
2. Limitez le nombre de résultats
3. Utilisez `onlyMainContent: true` pour Firecrawl
4. Faites des recherches ciblées plutôt que larges
5. Surveillez votre usage régulièrement

---

### Q37 : Puis-je automatiser les recherches ?

**R :** Oui ! Vous pouvez :
- Créer des jobs cron pour des recherches régulières
- Utiliser des webhooks pour des notifications
- Créer des alertes automatiques
- Générer des rapports périodiques

---

### Q38 : Comment interpréter les résultats ?

**R :**
- **SerpApi** : Retourne des résultats structurés avec titre, URL, description
- **Firecrawl** : Retourne le contenu HTML ou Markdown de la page
- **Combiné** : Retourne les deux pour une analyse complète

---

### Q39 : Puis-je filtrer les résultats ?

**R :** Oui ! Utilisez :
- **includeTags** : Pour inclure uniquement certains éléments HTML
- **excludeTags** : Pour exclure certains éléments (nav, footer, etc.)
- **onlyMainContent** : Pour extraire uniquement le contenu principal

---

### Q40 : Y a-t-il des limites de taux (rate limits) ?

**R :** Oui, chaque service a ses limites :
- **Pica** : Selon votre plan
- **SerpApi** : ~1 requête/seconde
- **Firecrawl** : Selon votre plan

Respectez ces limites pour éviter les erreurs 429 (Too Many Requests).

---

**Vous avez d'autres questions ? Consultez la documentation complète ou contactez le support !** 🚀
