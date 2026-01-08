## Recommandation — Environnement de tests reproductible

Voici la solution recommandée (radicale et logique) pour stabiliser et fiabiliser les tests E2E du module *Appointments*.

1) Pourquoi
- Garantit un environnement isolé et identique localement et en CI.
- Élimine les erreurs 401 / ressources manquantes liées à des services non démarrés.
- Rend les tests reproductibles et débogables (traces, vidéos).

2) Composants à mettre en place
- `docker-compose.test.yml` : services `db` (Postgres), `backend` (NestJS), `frontend` (Next.js), et un service `playwright-runner`.
- Script de seed DB (`scripts/seed-test.js`) pour créer un utilisateur de test et fixtures (rendez‑vous).
- Playwright configuré pour attendre la readiness du frontend/backend et utiliser `baseURL: http://frontend:3000`.
- CI job (GitHub Actions / GitLab CI) qui lance `docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit`, exécute les tests et collecte rapports/vidéos/traces.

3) Commandes d'usage (local)
```bash
# build + start test stack
docker-compose -f docker-compose.test.yml up --build -d

# seed DB
docker exec -it crm-backend npm run seed:test

# run playwright (depuis le dossier frontend)
cd frontend
npx playwright test tests/appointments --project=chromium --reporter=list
```

4) Option alternative (moins radicale)
- Utiliser MSW (Mock Service Worker) pour moquer l'API côté frontend lors des E2E : tests plus rapides et déterministes sans DB.

5) Recommandations complémentaires
- Garder un jeu de fixtures versionné pour la seed.
- Conserver traces/vidéos pour chaque échec Playwright.
- Intégrer ces étapes dans le pipeline CI avant les merges.

---
Fichier généré le: 2026-01-07
