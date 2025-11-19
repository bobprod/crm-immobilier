# 📧 Configuration SMTP - Module Communications

## 🎯 Vue d'ensemble

Le module Communications supporte l'envoi d'emails via SMTP (Simple Mail Transfer Protocol) avec support multi-providers (Gmail, Outlook, SendGrid, etc.).

---

## ⚙️ Configuration

### 1. Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe
SMTP_FROM=noreply@votre-domaine.com
```

### 2. Providers supportés

#### **Gmail** (Recommandé pour dev)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=mot-de-passe-application
```

**Important** : Pour Gmail, vous devez :
1. Activer l'authentification à 2 facteurs
2. Générer un "Mot de passe d'application" : https://myaccount.google.com/apppasswords

#### **Outlook/Office365**
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
```

#### **SendGrid** (Recommandé pour production)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=votre-sendgrid-api-key
```

#### **Mailgun**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
```

---

## 🧪 Tester la configuration

### Via API

**1. Tester la connexion SMTP :**
```bash
POST /api/communications/smtp/test-connection
```

Réponse :
```json
{
  "success": true,
  "message": "Configuration SMTP valide",
  "config": {
    "host": "smtp.gmail.com",
    "port": "587",
    "user": "votre-email@gmail.com"
  }
}
```

**2. Envoyer un email de test :**
```bash
POST /api/communications/smtp/test-email
Content-Type: application/json

{
  "to": "destinataire@example.com"
}
```

---

## 📤 Utilisation

### Envoyer un email simple

```typescript
POST /api/communications/email
{
  "to": "client@example.com",
  "subject": "Nouveau bien disponible",
  "body": "<h1>Bonjour</h1><p>Nous avons un bien qui pourrait vous intéresser...</p>",
  "prospectId": "uuid-prospect",
  "propertyId": "uuid-propriete"
}
```

### Avec pièces jointes

```typescript
{
  "to": "client@example.com",
  "subject": "Documents du bien",
  "body": "<p>Voici les documents demandés...</p>",
  "attachments": [
    {
      "filename": "contrat.pdf",
      "path": "/path/to/file.pdf"
    }
  ]
}
```

---

## 🔒 Sécurité

### Bonnes pratiques

1. **Ne jamais commit les credentials** dans Git
2. Utiliser des **mots de passe d'application** (pas le mot de passe principal)
3. **Limiter les permissions** du compte email
4. Utiliser **SendGrid/Mailgun** en production (meilleure délivrabilité)
5. Activer **DKIM, SPF, DMARC** pour éviter le spam

### Ports SMTP

- **Port 587** : TLS (recommandé) - `SMTP_SECURE=false`
- **Port 465** : SSL - `SMTP_SECURE=true`
- **Port 25** : Non sécurisé (déprécié)

---

## 🐛 Dépannage

### Erreur : "Invalid login"
- Vérifiez `SMTP_USER` et `SMTP_PASSWORD`
- Gmail : Utilisez un mot de passe d'application
- Outlook : Vérifiez que le compte n'a pas 2FA sans app password

### Erreur : "Connection timeout"
- Vérifiez `SMTP_HOST` et `SMTP_PORT`
- Vérifiez votre firewall/proxy
- Certains hébergeurs bloquent le port 587

### Emails en spam
- Configurez SPF : `v=spf1 include:_spf.google.com ~all`
- Configurez DKIM via votre provider
- Utilisez un domaine vérifié pour `SMTP_FROM`

---

## 📦 Dépendances

Le module utilise `nodemailer` :

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

---

## 🎯 Fonctionnalités

✅ Support multi-providers (Gmail, SendGrid, Mailgun, etc.)  
✅ Envoi avec pièces jointes  
✅ Templates HTML  
✅ Historique des envois  
✅ Gestion des échecs  
✅ Statistiques  
✅ Test de connexion  
✅ Email de test  

---

## 🚀 Production

Pour la production, utilisez plutôt :

1. **SendGrid** (100 emails/jour gratuits)
2. **Mailgun** (Excellent pour l'immobilier)
3. **Amazon SES** (Le moins cher à grande échelle)

Configuration SendGrid :
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxx
SMTP_FROM=noreply@votre-domaine.com
```

---

## 📞 Support

En cas de problème :
1. Testez avec `/smtp/test-connection`
2. Vérifiez les logs du service
3. Consultez la documentation du provider SMTP
