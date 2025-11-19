# 🔐 IDENTIFIANTS DE CONNEXION - CRM IMMOBILIER

## 🎯 Compte Administrateur Par Défaut

**Email** : `admin@crm.com`
**Mot de passe** : `admin123`

## 🌐 URLs d'Accès

### Frontend (Interface utilisateur)
- **URL** : http://localhost:3001
- **Page de connexion** : http://localhost:3001/login
- **Dashboard** : http://localhost:3001/dashboard

### Backend (API)
- **URL Base** : http://localhost:3000/api
- **Documentation Swagger** : http://localhost:3000/api/docs

### Base de données (pgAdmin 4)
- **Serveur** : localhost
- **Port** : 5432
- **Base de données** : crm_immobilier
- **Utilisateur** : postgres
- **Mot de passe** : postgres

## 📝 Créer un Nouvel Utilisateur

### Option 1 : Via l'Interface (Recommandé)
1. Ouvrir http://localhost:3001
2. Cliquer sur "S'inscrire"
3. Remplir le formulaire d'inscription

### Option 2 : Via pgAdmin
1. Ouvrir pgAdmin 4 avec `Ouvrir_pgAdmin4.bat`
2. Se connecter à la base de données `crm_immobilier`
3. Exécuter le script SQL : `backend/scripts/create_admin.sql`

### Option 3 : Via l'API
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre-email@exemple.com",
    "password": "VotreMotDePasse123!",
    "firstName": "Prénom",
    "lastName": "Nom",
    "role": "ADMIN"
  }'
```

## 🔒 Sécurité

⚠️ **IMPORTANT** : Ces identifiants sont pour le développement uniquement !

Pour la production :
1. Changez tous les mots de passe
2. Utilisez des mots de passe forts
3. Configurez des variables d'environnement sécurisées
4. Activez HTTPS
5. Configurez un système d'authentification robuste (2FA, etc.)

## 🆘 En cas de problème

### Mot de passe oublié
1. Connectez-vous à pgAdmin 4
2. Mettez à jour le mot de passe dans la table `users`
3. Utilisez un hash bcrypt valide

### Compte bloqué
1. Vérifiez les logs du backend : Terminal backend
2. Vérifiez la table `users` dans pgAdmin
3. Redémarrez le backend si nécessaire

## 📞 Support

Pour toute question ou problème :
1. Consultez la documentation : `GUIDE_INITIALISATION_SIMPLE.md`
2. Vérifiez les logs des terminaux actifs
3. Consultez la documentation Swagger pour tester l'API
