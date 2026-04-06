# Audit des champs sensibles — 2026-01-17

Résumé rapide
- J'ai scanné le code et le schéma Prisma : plusieurs colonnes et fichiers contiennent des secrets (API keys, tokens, mots de passe).
- Fichiers d'analyse produits : `analysis/db-read-rows.md`, `analysis/db-read-rows.json`, `analysis/sql_create_views.sql`.

Localisations principales (exemples)
- Tables / colonnes en base :
  - `ai_settings.openaiApiKey`, `ai_settings.anthropicApiKey`, `ai_settings.geminiApiKey`, etc.
  - `agency_api_keys.*` (plusieurs colonnes `*ApiKey`, `serpApiKey`, `firecrawlApiKey`, ...)
  - `provider_configs.apiKey`, `provider_configs.apiSecret`
  - `whatsapp_configs.accessToken`, `whatsapp_configs.twilioAuthToken`
- Fichiers et code :
  - `backend/.env` (DATABASE_URL, JWT secrets, SMTP_PASSWORD)
  - Frontend : composants settings et tests (`input#openaiApiKey`, `input#serpApiKey`, etc.) — clés manipulées côté client
  - Docs/tests : traces de clés d'exemple dans `VISUAL_ARCHITECTURE_GUIDE.md` et `test-results/*` (tests e2e contenant valeurs et sélecteurs)

Risques identifiés
- Secrets stockés en clair dans la base ou exposés via UI/tests.
- Stockage côté client (localStorage) pour tokens — risque XSS.
- Historique Git peut contenir secrets (fichiers supprimés mais committés auparavant).

Recommandations prioritaires (ordre proposé)
1. Ne plus exposer/délivrer les clés complètes via les APIs / endpoints publiques : renvoyer des chaînes masquées (`sk_****abcd`) ou indicateurs seulement.
2. Retirer les secrets des assets/tests/Docs et révoquer/rotater toute clé qui a été publiée publiquement.
3. Migrer les secrets hors des tables app si possible : utiliser un secret manager (HashiCorp Vault, Azure Key Vault, GCP Secret Manager) et stocker seulement des références/IDs en base.
4. Si stockage en base nécessaire : chiffrer au repos (pgcrypto) avec une clé de chiffrement gérée séparément (et non committée). Exemple non-destructif :

```sql
-- ajouter colonne chiffrée
ALTER TABLE agency_api_keys ADD COLUMN llm_api_key_enc bytea;

-- chiffrer et backfiller (exemple avec pgcrypto symétrique)
UPDATE agency_api_keys
SET llm_api_key_enc = pgp_sym_encrypt(llmApiKey::text, current_setting('app.encryption_key'))
WHERE llmApiKey IS NOT NULL;

-- vérifier, puis supprimer la colonne texte (après backup et validation)
-- ALTER TABLE agency_api_keys DROP COLUMN llmApiKey;
```

5. Modifier le code :
  - Back-end : ne jamais renvoyer la valeur en clair par les endpoints. Décrypter côté serveur uniquement lorsque nécessaire.
  - Front-end : utiliser des champs `type="password"` pour saisie, ne pas stocker dans `localStorage`. Préférer httpOnly secure cookies pour tokens de session.
  - Tests : remplacer valeurs réelles par fixtures ou variables d'environnement sécurisées.

6. Plan de rotation des clés : identifier les fournisseurs impactés, automatiser la rotation (script + notifications) et révoquer les clés compromises.

7. Nettoyage Git : utiliser `git filter-repo` ou BFG pour purger les secrets de l'historique, puis forcer push (coordination nécessaire avec l'équipe).

Livrables que je peux générer immédiatement
- `analysis/sensitive-fields.md` (ce fichier).
- Script SQL d'exemple pour backfill chiffré (pgcrypto) adapté aux colonnes listées.
- Exemples de snippets Node/NestJS pour chiffrer/déchiffrer via `pg` + `pgcrypto` ou via un secret manager.

Prochaine étape proposée
- Voulez‑vous que je :
  - A — Génère les scripts SQL de backfill/chiffrement pour les colonnes listées ?
  - B — Génère snippets NestJS/Node pour intégration avec Vault (ou lecture chiffrée via pgcrypto) ?
  - C — Lance l’audit d’historique Git pour localiser commits contenant secrets (liste de commits/files) ?

Rapide note de sécurité : avant d'exécuter toute migration destructive, effectuez un backup complet de la base et testez les scripts en staging.

— Rapport généré le 2026-01-17
