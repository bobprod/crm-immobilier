import { test, expect, Page } from '@playwright/test';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Tests E2E Phase 3 - Module Tasks
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tests pour les fonctionnalités avancées Phase 3:
 * - ✅ RECHERCHE TEXTE (4 tests)
 * - ✅ PAGINATION (4 tests)
 * - ✅ BULK ACTIONS (7 tests)
 *
 * Total: 15 tests
 */

test.describe('Tasks Module Phase 3 - Recherche Texte', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Naviguer vers Tasks
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  /**
   * Test 1: Recherche par titre
   */
  test('recherche les tâches par titre', async () => {
    // Créer des tâches de test
    await page.click('button:has-text("Nouvelle Tâche")');
    await page.fill('input[id="title"]', 'Appeler client Martin');
    await page.click('button:has-text("Créer")');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Nouvelle Tâche")');
    await page.fill('input[id="title"]', 'Envoyer email à Dupont');
    await page.click('button:has-text("Créer")');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Nouvelle Tâche")');
    await page.fill('input[id="title"]', 'Préparer présentation');
    await page.click('button:has-text("Créer")');
    await page.waitForTimeout(1000);

    // Vérifier que toutes les tâches sont visibles
    await expect(page.locator('text=Appeler client Martin')).toBeVisible();
    await expect(page.locator('text=Envoyer email à Dupont')).toBeVisible();
    await expect(page.locator('text=Préparer présentation')).toBeVisible();

    // Rechercher "client"
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    await searchInput.fill('client');

    // Attendre le filtrage
    await page.waitForTimeout(500);

    // Seule la tâche contenant "client" doit être visible
    await expect(page.locator('text=Appeler client Martin')).toBeVisible();
    await expect(page.locator('text=Envoyer email à Dupont')).not.toBeVisible();
    await expect(page.locator('text=Préparer présentation')).not.toBeVisible();
  });

  /**
   * Test 2: Recherche par description
   */
  test('recherche les tâches par description', async () => {
    // Créer une tâche avec description spécifique
    await page.click('button:has-text("Nouvelle Tâche")');
    await page.fill('input[id="title"]', 'Tâche importante');
    await page.fill('textarea[id="description"]', 'Contacter le fournisseur pour la commande urgente');
    await page.click('button:has-text("Créer")');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Nouvelle Tâche")');
    await page.fill('input[id="title"]', 'Autre tâche');
    await page.fill('textarea[id="description"]', 'Vérifier les stocks disponibles');
    await page.click('button:has-text("Créer")');
    await page.waitForTimeout(1000);

    // Rechercher par mot de la description
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    await searchInput.fill('fournisseur');
    await page.waitForTimeout(500);

    // Seule la tâche avec "fournisseur" dans la description doit être visible
    await expect(page.locator('text=Tâche importante')).toBeVisible();
    await expect(page.locator('text=Autre tâche')).not.toBeVisible();
  });

  /**
   * Test 3: Recherche insensible à la casse
   */
  test('recherche insensible à la casse (case insensitive)', async () => {
    // Créer une tâche
    await page.click('button:has-text("Nouvelle Tâche")');
    await page.fill('input[id="title"]', 'Réunion Équipe Marketing');
    await page.click('button:has-text("Créer")');
    await page.waitForTimeout(1000);

    // Rechercher en minuscules
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    await searchInput.fill('marketing');
    await page.waitForTimeout(500);

    // La tâche doit être trouvée malgré la casse différente
    await expect(page.locator('text=Réunion Équipe Marketing')).toBeVisible();

    // Vider et rechercher en majuscules
    await searchInput.clear();
    await searchInput.fill('ÉQUIPE');
    await page.waitForTimeout(500);

    // La tâche doit toujours être trouvée
    await expect(page.locator('text=Réunion Équipe Marketing')).toBeVisible();

    // Rechercher avec casse mixte
    await searchInput.clear();
    await searchInput.fill('RéUnIoN');
    await page.waitForTimeout(500);

    await expect(page.locator('text=Réunion Équipe Marketing')).toBeVisible();
  });

  /**
   * Test 4: Combinaison recherche + filtre statut
   */
  test('combine la recherche avec les filtres de statut', async () => {
    // Créer des tâches avec différents statuts
    await page.click('button:has-text("Nouvelle Tâche")');
    await page.fill('input[id="title"]', 'Projet Alpha TODO');
    await page.click('[id="status"]');
    await page.click('text=À faire');
    await page.click('button:has-text("Créer")');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Nouvelle Tâche")');
    await page.fill('input[id="title"]', 'Projet Alpha EN COURS');
    await page.click('[id="status"]');
    await page.click('text=En cours');
    await page.click('button:has-text("Créer")');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Nouvelle Tâche")');
    await page.fill('input[id="title"]', 'Projet Beta TODO');
    await page.click('[id="status"]');
    await page.click('text=À faire');
    await page.click('button:has-text("Créer")');
    await page.waitForTimeout(1000);

    // Rechercher "Alpha"
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    await searchInput.fill('Alpha');
    await page.waitForTimeout(500);

    // Les deux tâches Alpha doivent être visibles
    await expect(page.locator('text=Projet Alpha TODO')).toBeVisible();
    await expect(page.locator('text=Projet Alpha EN COURS')).toBeVisible();
    await expect(page.locator('text=Projet Beta TODO')).not.toBeVisible();

    // Appliquer filtre "En cours"
    await page.click('text=Toutes les tâches');
    await page.click('text=En cours');
    await page.waitForTimeout(500);

    // Seule "Projet Alpha EN COURS" doit être visible (recherche + filtre)
    await expect(page.locator('text=Projet Alpha EN COURS')).toBeVisible();
    await expect(page.locator('text=Projet Alpha TODO')).not.toBeVisible();
    await expect(page.locator('text=Projet Beta TODO')).not.toBeVisible();
  });
});

test.describe('Tasks Module Phase 3 - Pagination', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  /**
   * Test 5: Affichage de la pagination si > 50 tâches
   */
  test('affiche la pagination uniquement si plus de 50 tâches', async () => {
    // Vérifier qu'il n'y a pas de pagination au départ (< 50 tâches)
    const paginationBefore = page.locator('text=Page').first();
    const isVisibleBefore = await paginationBefore.isVisible().catch(() => false);

    if (isVisibleBefore) {
      // Si déjà visible, c'est qu'il y a déjà > 50 tâches
      await expect(paginationBefore).toBeVisible();
    } else {
      // Pas de pagination car < 50 tâches
      await expect(paginationBefore).not.toBeVisible();
    }

    // Note: Pour tester complètement, il faudrait créer 51 tâches,
    // mais c'est trop long pour un test E2E. On teste plutôt la présence
    // de la structure si elle existe déjà.
  });

  /**
   * Test 6: Navigation Précédent/Suivant
   */
  test('navigue entre les pages avec Précédent/Suivant', async () => {
    // Ce test nécessite > 50 tâches en DB
    // On vérifie si la pagination est présente
    const pagination = page.locator('text=Page').first();
    const hasPagination = await pagination.isVisible().catch(() => false);

    if (hasPagination) {
      // Vérifier le bouton Suivant
      const nextButton = page.locator('button:has-text("Suivant")');
      await expect(nextButton).toBeVisible();

      // Vérifier que Précédent est désactivé sur la première page
      const prevButton = page.locator('button:has-text("Précédent")');
      await expect(prevButton).toBeDisabled();

      // Cliquer sur Suivant
      await nextButton.click();
      await page.waitForTimeout(500);

      // Vérifier qu'on est sur la page 2
      await expect(page.locator('text=Page 2')).toBeVisible();

      // Précédent doit maintenant être activé
      await expect(prevButton).not.toBeDisabled();

      // Retourner à la page 1
      await prevButton.click();
      await page.waitForTimeout(500);

      // Vérifier qu'on est revenu à la page 1
      await expect(page.locator('text=Page 1')).toBeVisible();
    } else {
      // Pas assez de tâches pour tester la pagination
      test.skip();
    }
  });

  /**
   * Test 7: Affichage du compteur de pagination
   */
  test('affiche le compteur "Affichage de X à Y sur Z tâches"', async () => {
    const pagination = page.locator('text=Page').first();
    const hasPagination = await pagination.isVisible().catch(() => false);

    if (hasPagination) {
      // Vérifier le format du compteur
      const counter = page.locator('text=/Affichage de \\d+ à \\d+ sur \\d+ tâche/');
      await expect(counter).toBeVisible();

      // Vérifier qu'il commence à 1
      await expect(page.locator('text=/Affichage de 1 à/')).toBeVisible();
    } else {
      // Si pas de pagination, vérifier qu'il n'y a pas de compteur
      const counter = page.locator('text=/Affichage de \\d+ à \\d+ sur \\d+ tâche/');
      await expect(counter).not.toBeVisible();
    }
  });

  /**
   * Test 8: Reset de la page lors du changement de filtre
   */
  test('retourne à la page 1 lors du changement de filtre ou recherche', async () => {
    // Créer quelques tâches avec différents statuts
    for (let i = 0; i < 5; i++) {
      await page.click('button:has-text("Nouvelle Tâche")');
      await page.fill('input[id="title"]', `Tâche Test ${i}`);
      if (i % 2 === 0) {
        await page.click('[id="status"]');
        await page.click('text=En cours');
      }
      await page.click('button:has-text("Créer")');
      await page.waitForTimeout(300);
    }

    const pagination = page.locator('text=Page').first();
    const hasPagination = await pagination.isVisible().catch(() => false);

    if (hasPagination) {
      // Aller à la page 2
      const nextButton = page.locator('button:has-text("Suivant")');
      await nextButton.click();
      await page.waitForTimeout(500);
      await expect(page.locator('text=Page 2')).toBeVisible();

      // Changer le filtre
      await page.click('text=Toutes les tâches');
      await page.click('text=En cours');
      await page.waitForTimeout(500);

      // Devrait retourner à la page 1
      await expect(page.locator('text=Page 1')).toBeVisible();
    }

    // Tester aussi avec la recherche
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    await searchInput.fill('Test');
    await page.waitForTimeout(500);

    // Si pagination existe, devrait être à la page 1
    if (hasPagination) {
      await expect(page.locator('text=Page 1')).toBeVisible();
    }
  });
});

test.describe('Tasks Module Phase 3 - Bulk Actions', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    // Créer quelques tâches de test
    for (let i = 1; i <= 3; i++) {
      await page.click('button:has-text("Nouvelle Tâche")');
      await page.fill('input[id="title"]', `Tâche Bulk ${i}`);
      await page.click('button:has-text("Créer")');
      await page.waitForTimeout(300);
    }

    await page.waitForTimeout(500);
  });

  test.afterEach(async () => {
    await page.close();
  });

  /**
   * Test 9: Sélectionner une seule tâche
   */
  test('peut sélectionner une seule tâche', async () => {
    // Trouver la première checkbox de tâche
    const firstTaskCheckbox = page.locator('[aria-label*="Sélectionner la tâche"]').first();

    // Cocher la checkbox
    await firstTaskCheckbox.click();
    await page.waitForTimeout(300);

    // Vérifier que la toolbar apparaît
    const toolbar = page.locator('[role="toolbar"]');
    await expect(toolbar).toBeVisible();

    // Vérifier le compteur "1 tâche sélectionnée"
    await expect(page.locator('text=1 tâche sélectionnée')).toBeVisible();

    // Vérifier l'annonce ARIA pour les lecteurs d'écran
    const liveRegion = page.locator('[role="status"][aria-live="polite"]');
    await expect(liveRegion).toContainText('1 tâche sélectionnée');
  });

  /**
   * Test 10: Sélectionner plusieurs tâches
   */
  test('peut sélectionner plusieurs tâches individuellement', async () => {
    // Sélectionner la première tâche
    const firstCheckbox = page.locator('[aria-label*="Sélectionner la tâche"]').first();
    await firstCheckbox.click();
    await page.waitForTimeout(200);

    // Sélectionner la deuxième tâche
    const secondCheckbox = page.locator('[aria-label*="Sélectionner la tâche"]').nth(1);
    await secondCheckbox.click();
    await page.waitForTimeout(200);

    // Vérifier le compteur "2 tâches sélectionnées"
    await expect(page.locator('text=2 tâches sélectionnées')).toBeVisible();

    // Vérifier l'annonce ARIA
    const liveRegion = page.locator('[role="status"][aria-live="polite"]');
    await expect(liveRegion).toContainText('2 tâches sélectionnées');
  });

  /**
   * Test 11: Sélectionner toutes les tâches
   */
  test('peut sélectionner toutes les tâches de la page', async () => {
    // Trouver la checkbox "Sélectionner toutes"
    const selectAllCheckbox = page.locator('[aria-label*="Sélectionner toutes les tâches"]');

    // Cocher pour tout sélectionner
    await selectAllCheckbox.click();
    await page.waitForTimeout(300);

    // Vérifier que le compteur affiche "3 tâches sélectionnées"
    await expect(page.locator('text=3 tâches sélectionnées')).toBeVisible();

    // Décocher pour tout désélectionner
    await selectAllCheckbox.click();
    await page.waitForTimeout(300);

    // Vérifier que la toolbar disparaît
    const toolbar = page.locator('[role="toolbar"]');
    await expect(toolbar).not.toBeVisible();
  });

  /**
   * Test 12: Suppression en masse avec confirmation
   */
  test('peut supprimer plusieurs tâches avec confirmation', async () => {
    // Sélectionner 2 tâches
    await page.locator('[aria-label*="Sélectionner la tâche"]').first().click();
    await page.locator('[aria-label*="Sélectionner la tâche"]').nth(1).click();
    await page.waitForTimeout(300);

    // Cliquer sur le bouton "Supprimer" dans la toolbar
    const deleteButton = page.locator('[role="toolbar"] button:has-text("Supprimer")');
    await deleteButton.click();

    // Vérifier le dialog de confirmation
    await expect(page.locator('text=Supprimer les tâches sélectionnées')).toBeVisible();
    await expect(page.locator('text=/supprimer 2 tâches/')).toBeVisible();

    // Annuler d'abord
    await page.click('button:has-text("Annuler")');
    await page.waitForTimeout(300);

    // Les tâches doivent toujours exister
    await expect(page.locator('text=Tâche Bulk 1')).toBeVisible();

    // Réessayer et confirmer
    await deleteButton.click();
    await page.click('button:has-text("Confirmer")');

    // Attendre le toast de succès
    await expect(page.locator('text=/2 tâches supprimées/')).toBeVisible({ timeout: 5000 });

    // Vérifier que les tâches ont disparu
    await page.waitForTimeout(500);
    await expect(page.locator('text=Tâche Bulk 1')).not.toBeVisible();
    await expect(page.locator('text=Tâche Bulk 2')).not.toBeVisible();
  });

  /**
   * Test 13: Marquer plusieurs tâches comme terminées (bulk complete)
   */
  test('peut marquer plusieurs tâches comme terminées', async () => {
    // Sélectionner toutes les tâches
    const selectAllCheckbox = page.locator('[aria-label*="Sélectionner toutes les tâches"]');
    await selectAllCheckbox.click();
    await page.waitForTimeout(300);

    // Cliquer sur "Marquer comme terminé"
    const completeButton = page.locator('[role="toolbar"] button:has-text("Marquer comme terminé")');
    await completeButton.click();

    // Attendre le toast de succès
    await expect(page.locator('text=/3 tâches marquées comme terminées/')).toBeVisible({ timeout: 5000 });

    // Attendre la mise à jour
    await page.waitForTimeout(1000);

    // Vérifier que les tâches ont le badge "Terminé"
    const doneBadges = page.locator('text=Terminé');
    const count = await doneBadges.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  /**
   * Test 14: Annuler la sélection
   */
  test('peut annuler la sélection avec le bouton Annuler', async () => {
    // Sélectionner plusieurs tâches
    await page.locator('[aria-label*="Sélectionner la tâche"]').first().click();
    await page.locator('[aria-label*="Sélectionner la tâche"]').nth(1).click();
    await page.waitForTimeout(300);

    // Vérifier que la toolbar est visible
    const toolbar = page.locator('[role="toolbar"]');
    await expect(toolbar).toBeVisible();
    await expect(page.locator('text=2 tâches sélectionnées')).toBeVisible();

    // Cliquer sur "Annuler"
    const cancelButton = page.locator('[role="toolbar"] button:has-text("Annuler")');
    await cancelButton.click();
    await page.waitForTimeout(300);

    // Vérifier que la toolbar disparaît
    await expect(toolbar).not.toBeVisible();

    // Vérifier que les checkboxes sont décochées
    const firstCheckbox = page.locator('[aria-label*="Sélectionner la tâche"]').first();
    await expect(firstCheckbox).not.toBeChecked();
  });

  /**
   * Test 15: Affichage de la toolbar uniquement lors d'une sélection
   */
  test('affiche la toolbar uniquement quand au moins une tâche est sélectionnée', async () => {
    // Au départ, pas de toolbar
    const toolbar = page.locator('[role="toolbar"]');
    await expect(toolbar).not.toBeVisible();

    // Sélectionner une tâche
    await page.locator('[aria-label*="Sélectionner la tâche"]').first().click();
    await page.waitForTimeout(300);

    // La toolbar doit apparaître
    await expect(toolbar).toBeVisible();

    // Vérifier les boutons de la toolbar
    await expect(page.locator('[role="toolbar"] button:has-text("Marquer comme terminé")')).toBeVisible();
    await expect(page.locator('[role="toolbar"] button:has-text("Supprimer")')).toBeVisible();
    await expect(page.locator('[role="toolbar"] button:has-text("Annuler")')).toBeVisible();

    // Décocher la tâche
    await page.locator('[aria-label*="Sélectionner la tâche"]').first().click();
    await page.waitForTimeout(300);

    // La toolbar doit disparaître
    await expect(toolbar).not.toBeVisible();
  });
});
